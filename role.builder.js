var utils = require('utils');

var roleBuilder = {
    //** @param {Spawn} spawn **/
    spawn: function(spawn, force = false) {
        var body = utils.buildBody(spawn, [WORK,CARRY,MOVE], null, 20);
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.75) {
            spawn.createCreep(body, undefined, {role: 'builder'});
        }
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        var order = [
            STRUCTURE_TOWER,
            STRUCTURE_EXTENSION,
            STRUCTURE_RAMPART,
            STRUCTURE_CONTAINER,
            STRUCTURE_ROAD,
            STRUCTURE_STORAGE,
            STRUCTURE_LINK,
            STRUCTURE_WALL];

	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
	       for (var i in order) {
	           var struct = order[i];
	           var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { 
	           filter: function(a) {
	               return a.structureType == struct;
	           }});
	           if (target) {
	               var result = creep.build(target);
	               if(result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    break;
	           } else {
	           }
	       }
	    }
	    else {
	        var ground; 
	        // ground =  creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
            if (ground) {
                if (creep.pickup(ground) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ground, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
	        var container = Game.spawns['Spawn1'].pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) &&
                            structure.store[RESOURCE_ENERGY] > 0;
                    }
            });
            if (container) {
                if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                var sources = utils.findSources(creep);
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            }
	    }
	}
};

module.exports = roleBuilder;