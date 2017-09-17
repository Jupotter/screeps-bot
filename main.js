var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleHauler = require('role.hauler');
var utils = require('utils');


var roles = {
    harvester: roleHarvester,
    upgrader: roleUpgrader,
    builder: roleBuilder,
    hauler: roleHauler
}

    /** @param {Creep} creep **/
var recycle = function (creep, spawn) {
    creep.memory.role = 'recycle';
    creep.drop(RESOURCE_ENERGY, creep.carry);
    var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER 
            }
    });
    if (!container) {
        console.log("no recycle container found");
        return;
    }
    if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
        creep.moveTo(container, {visualizePathStyle: {stroke: '#ff0000'}});
    }
}

module.exports.loop = function () {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    var sources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);
    var hostile = Game.spawns['Spawn1'].room.find(FIND_HOSTILE_CREEPS);
    var sites = Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES, {
        filter: (s) => s.structureType != STRUCTURE_ROAD
    });

    var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_TOWER
    });  
    if(towers.length) {
        var tower = towers[0];
        if (hostile.length == 0) {
            var damagedStructure = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax &&
                    structure.hits < 150000
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
        if (creep.ticksToLive <= 50) {
            recycle(creep, Game.spawns['Spawn1']);
        }
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep, sources[s++]);
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
    }
}