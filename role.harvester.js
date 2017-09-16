var utils = require('utils');
var roleBuilder = require('role.builder');

var roleHarvester = {
    //** @param {Spawn} spawn **/
    spawn: function(spawn, force = false) {
        var body = utils.buildBody(spawn, [WORK,WORK]);
        body[0] = MOVE;
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.9) {
            spawn.createCreep(body, undefined, {role: 'harvester'});
        }
        return body;
    },
    
    distance: function(a, b) {
        var dist = (b.pos.x - a.pos.x)*(b.pos.x - a.pos.x) + (b.pos.y - a.pos.y)*(b.pos.y - a.pos.y);
        console.log(dist);
        return dist;
    },
    
    /** @param {Creep} creep **/
    run: function(creep, source) {
        if(creep.carry.energy == 0) {
	        creep.memory.harvest = true;
            if (source.energy == 0) {
                creep.memory.harvest = false;
            }
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.harvest = false;
        }
        
        if (creep.memory.harvest) {
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            
        } else {
            var container = source.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER;
                    }
            })
            if (container != null) {
                if(creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((
                                structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER
                                ) && structure.energy < structure.energyCapacity
                            ) || (structure.structureType == STRUCTURE_CONTAINER && 
                                  structure.id != creep.memory.orig.id && 
                                  structure.store[RESOURCE_ENERGY] < structure.storeCapacity - creep.carryCapacity);
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                roleBuilder.run(creep);
                //creep.moveTo(Game.spawns['Spawn1']);
            } 
            }
        }
	}
};

module.exports = roleHarvester;