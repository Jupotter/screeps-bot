var utils = require('utils');

var roleClaimer = {

    /** @param {Spawn} spawn
     *  @param {boolean} force
     *  @param {Object} memory **/
    spawn: function(spawn, force = false, memory = {}) {
        var body = [CLAIM, CLAIM, MOVE, MOVE];
        memory.role = 'claimer';
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.75) {
            spawn.createCreep(body, 'claimer'+Game.time.toString(), memory);
        }
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        var room = creep.memory.room;
        controller = creep.memory.controller;
        if (controller) {
            controller = creep.room.controller;
            var result = creep.claimController(controller);
            if (result == ERR_GCL_NOT_ENOUGH) {
                result = creep.reserveController(controller);
                if(result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } else if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
            }
        } else if (creep.room.name != room) {
            var exit = Game.map.findExit(creep.room, room);
            creep.moveTo(creep.pos.findClosestByPath(exit), {visualizePathStyle: {stroke: '#00ff00'}});
        } else {
            creep.memory.controller = creep.room.controller.id;
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ff00'}});
        }
    }
};

module.exports = roleClaimer;