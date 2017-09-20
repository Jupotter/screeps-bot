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
}

var remoteRooms = ['E25N42'];

    /** @param {Creep} creep **/
var recycle = function (creep, spawn) {
    creep.memory.role = 'recycle';
    if (creep.carry > 0) {
        creep.drop(RESOURCE_ENERGY, creep.carry);
    } else {
        var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER 
                }
        });
        if (!container) {
            console.log("no recycle container found");
            container = spawn;
        }
        if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container, {visualizePathStyle: {stroke: '#ff0000'}});
        }
    }
}

module.exports.loop = function () {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    var spawn = Game.spawns['Spawn1'];
    if (roleHauler.doNotFill.length == 0) {
        var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER 
                }
        });
        if (!container) {
            console.log("no recycle container found");
        } else {
            roleHauler.doNotFill[0] = container.id;
        }
    }
    
    var room = Game.spawns['Spawn1'].room;
    var sources
    if (!room.memory.sources) {
        sources = room.find(FIND_SOURCES);
        room.memory.sources = sources;
    } else {
        sources = room.memory.sources;
    }
    
    var store = room.storage;
    var energy = room.energyAvailable;
    if (store) {
        energy += store.store[RESOURCE_ENERGY];
    }
    console.log(energy);
    
    var hostile = Game.spawns['Spawn1'].room.find(FIND_HOSTILE_CREEPS);
    var sites = Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES, {
        filter: (s) => s.structureType != STRUCTURE_ROAD
    });

    var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
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
            
            if(damagedStructure.length != 0) {
                tower.repair(damagedStructure[0]);
            }
        } else {
            hostile.sort(utils.sortDistance(tower));
            tower.attack(hostile[0]);
        }
    }
    
    var links = room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_LINK
    });
    
    if (links.length >= 2) {
        links.sort(utils.sortDistance(spawn));
        if (links[1].cooldown == 0 && links[1].energy > 0) {
            links[1].transferEnergy(links[0]);
        }
    }
    
    var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
    if(claimers.length < remoteRooms.length) {
        roleClaimer.spawn(Game.spawns['Spawn1']);
    }
    var remoteHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'remoteHarvester');
    if(remoteHarvesters.length < remoteRooms.length) {
        roleRemoteHarvester.spawn(Game.spawns['Spawn1']);
    }
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    if(builders.length < (sites.length + 1) / 5) {
        roleBuilder.spawn(Game.spawns['Spawn1']);
    }
    var upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    if(upgrader.length < 1) {
        roleUpgrader.spawn(Game.spawns['Spawn1']);
    }
    var hauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    if(hauler.length < sources.length + 1) {
        roleHauler.spawn(Game.spawns['Spawn1'], hauler.length == 0);
    }
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    if(harvesters.length < sources.length) {
        roleHarvester.spawn(Game.spawns['Spawn1'], harvesters.length == 0);
    }
    
    if(Game.spawns['Spawn1'].spawning) { 
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1, 
            Game.spawns['Spawn1'].pos.y, 
            {align: 'left', opacity: 0.8});
    }

    var s = 0;
    var h = 0;
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.ticksToLive <= 50 || creep.memory.role == 'recycle') {
            recycle(creep, Game.spawns['Spawn1']);
        }
        if(creep.memory.role == 'harvester') {
            if (!creep.memory.source) {
                for (var i in sources) {
                    source = sources[i];
                    if (!source.creep || !Game.creeps[source.creep] ||  Memory.creeps[source.creep].role != 'harvester') {
                        source.creep = creep.name;
                        creep.memory.source = source.id;
                        break;
                    }
                }
            }
            if (creep.memory.source) {
                roleHarvester.run(creep);
            } else {
                recycle(creep, Game.spawns['Spawn1']);
            }
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'hauler') {
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
    room.memory.sources = sources
}