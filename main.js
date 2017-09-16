var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleHauler = require('role.hauler');

var roles = {
    harvester: roleHarvester,
    upgrader: roleUpgrader,
    builder: roleBuilder,
    hauler: roleHauler
}

module.exports.loop = function () {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    var sources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);
    var sites = Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES);

    var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType == STRUCTURE_TOWER
    });  
    if(towers.length) {
        tower = towers[0];
        var damagedStructure = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax &&
                structure.hits < 150000
        });
        
        damagedStructure.sort((s1, s2) => s1.hits - s2.hits);
        
        if(damagedStructure.length != 0) {
            tower.repair(damagedStructure[0]);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }
    
    
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    if(builders.length < sites.length / 6) {
        roleBuilder.spawn(Game.spawns['Spawn1']);
    }
    var upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    if(upgrader.length < 1) {
        roleUpgrader.spawn(Game.spawns['Spawn1']);
    }
    var hauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler');
    if(hauler.length < sources.length) {
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