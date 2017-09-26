var utils = require('utils');

var roleUpgrader = {

    /** @param {Spawn} spawn
     *  @param {boolean} force
     *  @param {Object} memory **/
    spawn: function(spawn, force = false, memory = {}) {
        var body = utils.buildBody(spawn, [WORK,CARRY,MOVE], null, 20);
        memory.role = 'upgrader';
            return spawn.createCreep(body, undefined, memory);
    },

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	    }

	    if(creep.memory.upgrading) {
            if (creep.memory.ownRoom && creep.room.name != creep.memory.ownRoom) {
                var exit = Game.map.findExit(creep.room, creep.memory.ownRoom);
                creep.moveTo(creep.pos.findClosestByPath(exit), { visualizePathStyle: { stroke: '#00ff00' } });
            } else {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        else {
            var sources = utils.findSources(creep);
            var containers = creep.room.controller.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER;
                    }
            });
            if (containers) {
                if(creep.withdraw(containers, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(containers, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            }
        }
	}
};

module.exports = roleUpgrader;