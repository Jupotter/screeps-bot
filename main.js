var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleHauler = require('role.hauler');
var roleClaimer = require('role.claimer');
var roleRemoteHarvester = require('role.remoteHarvester');
var roleKiller = require('role.killer');
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

    for (var room in Game.rooms) {
        room = Game.rooms[room];
        var hostile = room.find(FIND_HOSTILE_CREEPS);
        var spawn = Game.spawns.Spawn1;
        for (var spawnN in Game.spawns) {
            if (Game.spawns[spawnN].room.name == room.name) {
                spawn = Game.spawns[spawnN];
                break;
            }
        }

        setupDoNotFill(spawn);

        var sources = [];
        var dest = room;
        if (!dest.memory.sources) {
            var thisSources = dest.find(FIND_SOURCES);
            dest.memory.sources = thisSources;
            sources = sources.concat(thisSources);
        } else {
            sources = sources.concat(dest.memory.sources);
        }
        

        var store = room.storage;
        var energy = room.energyAvailable;
        if (store) {
            energy += store.store[RESOURCE_ENERGY];
        }

        var sites = spawn.room.find(FIND_CONSTRUCTION_SITES, {
            filter: (s) => s.structureType != STRUCTURE_ROAD
        });

        handleTowers(room);

        handleLinks(room, spawn);

        var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.ownRoom == room.name);
        if (claimers.length < remoteRooms.length) {
            roleClaimer.spawn(spawn, false, { ownRoom: room.name });
        }
        var remoteHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'remoteHarvester'&& creep.memory.ownRoom == room.name);
        if (remoteHarvesters.length < remoteRooms.length) {
            roleRemoteHarvester.spawn(spawn, false, { ownRoom: room.name });
        }
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.ownRoom == room.name);
        if (builders.length < (sites.length + 1) / 5) {
            roleBuilder.spawn(spawn, false, { ownRoom: room.name });
        }
        var upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.ownRoom == room.name);
        if (upgrader.length < 1) {
            roleUpgrader.spawn(spawn, false, { ownRoom: room.name });
        }
        var hauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && creep.memory.ownRoom == room.name);
        if (hauler.length < sources.length + 1) {
            roleHauler.spawn(spawn, hauler.length == 0, { ownRoom: room.name });
        }
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.ownRoom == room.name);
        if (harvesters.length < sources.length) {
            roleHarvester.spawn(spawn, harvesters.length == 0, { ownRoom: room.name });
        }
        var killers = _.filter(Game.creeps, (creep) => creep.memory.role == 'killer' && creep.memory.ownRoom == room.name);
        if (killers.length == 0 && hostile.length != 0) {
            roleKiller.spawn(spawn, true, { ownRoom: room.name });
        }

        console.log("room: " + room.name);
        console.log(energy + " energy available");
        console.log("sources: " + sources);
        console.log("Harvesters: " + harvesters);
        console.log("Killers: " + killers);
        console.log("Haulers: " + hauler);
        console.log("Upgrader: " + upgrader);
        console.log("Builder: " + builders);

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
            if (creep.memory.role == 'killer') {
                roleKiller.run(creep);
            }
            if (creep.memory.role == 'remoteHarvester') {
                creep.memory.room = remoteRooms[0];
                roleRemoteHarvester.run(creep);
            }
        }
    }
};