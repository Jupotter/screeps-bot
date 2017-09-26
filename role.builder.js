var utils = require('utils');
var roleUpgrader = require('role.upgrader');

var roleBuilder = {
    /** @param {Spawn} spawn
     *  @param {boolean} force
     *  @param {Object} memory **/
    spawn: function(spawn, force = false, memory = {}) {
        var body = utils.buildBody(spawn, [WORK,CARRY,MOVE], null, 20);
        memory.role = 'builder';
            spawn.createCreep(body, undefined, memory);
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (!creep.memory.ownRoom) {
            creep.memory.ownRoom = creep.room.name;
        }
        var order = [
            STRUCTURE_TOWER,
            STRUCTURE_EXTENSION,
            STRUCTURE_RAMPART,
            STRUCTURE_CONTAINER,
            STRUCTURE_ROAD,
            STRUCTURE_STORAGE,
            STRUCTURE_SPAWN,
            STRUCTURE_LINK,
            STRUCTURE_EXTRACTOR,
            STRUCTURE_TERMINAL,
            STRUCTURE_WALL];

	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

        var target;
	    if(creep.memory.building) {
            for (var i in order) {
                var struct = order[i];
                target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                /* jshint -W083 */
                filter: function(a) {
                    return a.structureType == struct;
                }});
                if (target) {
                    break;
                }
            }
            if (!target) {
                for (var room in Game.rooms) {
                    if (room == creep.room.name) {
                        continue;
                    }
                    room = Game.rooms[room];
                    for (var i in order) {
                        var struct = order[i];
                        var targets = room.find(FIND_CONSTRUCTION_SITES, {
                        /* jshint -W083 */
                        filter: function(a) {
                            return a.structureType == struct;
                        }});
                        if (targets.length > 0) {
                            target = targets[0]
                            break;
                        }
                    }
                }
            }
           
            if (target) {
                var result = creep.build(target);
                if(result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                roleUpgrader.run(creep);
            }
	    }
	    else {
            var ground;
            ground =  creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
            if (ground) {
                if (creep.pickup(ground) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ground, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                var container = Game.rooms[creep.memory.ownRoom].find(FIND_MY_SPAWNS)[0].pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) &&
                            structure.store[RESOURCE_ENERGY] > 0;
                    }
                });
                if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    var sources = utils.findSources(creep);
                    if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            }
        }
    }
};

module.exports = roleBuilder;