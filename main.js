var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleHauler = require('role.hauler');
var roleClaimer = require('role.claimer');
var roleRemoteHarvester = require('role.remoteHarvester');
var utils = require('utils');


var roles = {
    harvester: roleHarvester,
    upgrader: roleUpgrader,
    builder: roleBuilder,
    hauler: roleHauler
};

function handleTowers(room) {
    var hostile = room.find(FIND_HOSTILE_CREEPS);
    var towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType == STRUCTURE_TOWER
    });
    for (var t = 0; t < towers.length; t++) {
        var tower = towers[t];
        if (hostile.length == 0) {
            var damagedStructure = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax &&
                    structure.hits < 200000
            });

            damagedStructure.sort((s1, s2) => s1.hits - s2.hits);

            if (damagedStructure.length != 0) {
                tower.repair(damagedStructure[0]);
            }
        } else {
            hostile.sort(utils.sortDistance(tower));
            tower.attack(hostile[0]);
        }
    }
}

function handleLinks(room, spawn) {
    var links = room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_LINK
    });

    if (links.length >= 2) {
        links.sort(utils.sortDistance(spawn));
        if (links[1].cooldown == 0 && links[1].energy > 0) {
            links[1].transferEnergy(links[0]);
        }
    }
}

function setupDoNotFill(spawn) {
    var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER;
        }
    });
    if (!container) {
        console.log("no recycle container found");
    } else {
        roleHauler.doNotFill.push(container.id);
    }
}

var remoteRooms = [];

/** @param {Creep} creep **/
var recycle = function (creep, spawn) {
    creep.memory.role = 'recycle';
    if (creep.carry > 0) {
        creep.drop(RESOURCE_ENERGY, creep.carry);
    } else {
        var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER;
            }
        });
        if (!container) {
            console.log("no recycle container found");
            container = spawn;
        }
        if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ff0000' } });
        }
    }
};



module.exports.loop = function () {
    utils.clearMemory();

    var spawn = Game.spawns.Spawn1;
    var room = spawn.room;

    setupDoNotFill(spawn);

    var sources = [];
    for (var dest in Game.rooms) {
        dest = Game.rooms[dest];
        if (!dest.memory.sources) {
            var thisSources = dest.find(FIND_SOURCES);
            dest.memory.sources = thisSources;
            sources = sources.concat(thisSources);
        } else {
            sources = sources.concat(dest.memory.sources);
        }
    }

    var store = room.storage;
    var energy = room.energyAvailable;
    if (store) {
        energy += store.store[RESOURCE_ENERGY];
    }
    console.log(energy);

    var sites = spawn.room.find(FIND_CONSTRUCTION_SITES, {
        filter: (s) => s.structureType != STRUCTURE_ROAD
    });

    handleTowers(room);

    handleLinks(room, spawn);

    var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
    if (claimers.length < remoteRooms.length) {
        roleClaimer.spawn(spawn, false, { ownRoom: room });
    }
    var remoteHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'remoteHarvester');
    if (remoteHarvesters.length < remoteRooms.length) {
        roleRemoteHarvester.spawn(spawn, false, { ownRoom: room });
    }
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    if (builders.length < (sites.length + 1) / 5) {
        roleBuilder.spawn(spawn, false, { ownRoom: room });
    }
    var upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    if (upgrader.length < Object.keys(Game.rooms).length) {
        for (var dest in Game.rooms) {
            dest = Game.rooms[dest].memory;
            if (!dest.upgrader || !Game.creeps[dest.upgrader] || Game.creeps[dest.upgrader].memory.role != 'upgrader') {
                roleUpgrader.spawn(spawn, false, { ownRoom: dest.name });
            }
        }
    }
    var hauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    if (hauler.length < sources.length + 1) {
        roleHauler.spawn(spawn, hauler.length == 0, { ownRoom: room });
    }
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    if (harvesters.length < sources.length) {
        roleHarvester.spawn(spawn, harvesters.length == 0, { ownRoom: room });
    }

    if (spawn.spawning) {
        var spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 });
    }

    var s = 0;
    var h = 0;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.ticksToLive <= 50 || creep.memory.role == 'recycle') {
            recycle(creep, spawn);
        }
        if (creep.memory.role == 'harvester') {
            if (!creep.memory.source) {
                for (var i in sources) {
                    source = sources[i];
                    if (!source.creep || !Game.creeps[source.creep] || Memory.creeps[source.creep].role != 'harvester') {
                        source.creep = creep.name;
                        creep.memory.source = source.id;
                        break;
                    }
                }
            }
            if (creep.memory.source) {
                roleHarvester.run(creep);
            } else {
                recycle(creep, spawn);
            }
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == 'hauler') {
            roleHauler.run(creep, sources[h++]);
        }
        if (creep.memory.role == 'claimer') {
            creep.memory.room = remoteRooms[0];
            roleClaimer.run(creep);
        }
        if (creep.memory.role == 'remoteHarvester') {
            creep.memory.room = remoteRooms[0];
            roleRemoteHarvester.run(creep);
        }
    }
};