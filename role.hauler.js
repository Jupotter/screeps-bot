var utils = require('utils');
var roleHarvester = require('role.harvester');

var roleHauler = {
    //** @param {Spawn} spawn **/
    spawn: function(spawn, force = false) {
        var body = utils.buildBody(spawn, [MOVE,CARRY]);
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.75) {
            spawn.createCreep(body, undefined, {role: 'hauler'});
        }
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep, source) {
        var tick = creep.memory.tick;
        if (!tick) {
            tick = 1;
        }
        if(creep.carry.energy == 0) {
            tick = 1;
	        creep.memory.harvest = true;
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.harvest = false;
        } else if (tick > 100) {
            creep.memory.harvest = false;
        } 
        tick++;
        creep.memory.tick = tick;
        
        if (creep.memory.harvest) {
            var ground;
            ground =  source.pos.findClosestByPath(FIND_DROPPED_ENERGY);
            if (ground) {
                if (creep.pickup(ground) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ground, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                var container;
                container = source.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                            return structure.structureType == STRUCTURE_CONTAINER;
                        }
                });
                
                creep.memory.orig = container;
                if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                                (structure.structureType == STRUCTURE_EXTENSION &&
                                    structure.energy < structure.energyCapacity) ||
                                ((
                                    structure.structureType == STRUCTURE_SPAWN ||
                                    structure.structureType == STRUCTURE_TOWER
                                ) && structure.energy <= structure.energyCapacity - 50)
                            );
                    }
            });
            if(targets.length == 0) {
                targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_CONTAINER && 
                                      structure.id != creep.memory.orig.id && 
                                      structure.store[RESOURCE_ENERGY] < structure.storeCapacity - creep.carryCapacity;
                        }
                });
            }
            
            targets.sort(utils.sortDistance(creep))
            
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                creep.moveTo(Game.spawns['Spawn1']);
            } 
        }
	}
};

module.exports = roleHauler;