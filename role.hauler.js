var utils = require('utils');
var roleHarvester = require('role.harvester');

var roleHauler = {
    doNotFill : [],
    
    /** @param {Spawn} spawn **/
    spawn: function(spawn, force = false, memory = {}) {
        var body = utils.buildBody(spawn, [MOVE,CARRY]);
        memory.role = 'hauler';
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.75) {
            spawn.createCreep(body, undefined, memory);
        }
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep, source) {
        var that = this;
        var any = false;
        if (!source) {
            source = Game.spawns['Spawn1'];
            any = true;
        } else {
            source = Game.getObjectById(source.id);
        }
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
            ground =  source.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
            if (ground && ground.amount > 50) {
                if (creep.pickup(ground) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ground, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                var container;
                container = source.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => any && s.structureType == STRUCTURE_LINK && s.energy > 50
                });
                if (!container) {
                    container = source.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => {
                            if (any) {
                                return (structure.structureType == STRUCTURE_CONTAINER ||
                                        structure.structureType == STRUCTURE_STORAGE ) &&
                                        structure.store[RESOURCE_ENERGY] > 50;
                            } else {
                                return structure.structureType == STRUCTURE_CONTAINER ||
                                       structure.structureType == STRUCTURE_STORAGE;
                            }
                        }
                    });
                }
                creep.memory.orig = container;
                if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                                ((structure.structureType == STRUCTURE_EXTENSION || 
                                    structure.structureType == STRUCTURE_SPAWN )&&
                                    structure.energy < structure.energyCapacity) ||
                                ((
                                    structure.structureType == STRUCTURE_TOWER
                                ) && structure.energy <= structure.energyCapacity - 100)
                            );
                    }
            });
            if(targets.length == 0) {
                targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                        if (that.doNotFill.indexOf(structure.id) > -1) {
                            return false;
                        }
                        return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && 
                                  (!creep.memory.orig || structure.id != creep.memory.orig.id) && 
                                  structure.store[RESOURCE_ENERGY] < structure.storeCapacity - creep.carryCapacity;
                    }
                });
            }
            
            targets.sort(utils.sortDistance(creep));
            
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