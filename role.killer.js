var utils = require('utils');

var roleKiller = {
    /** @param {Spawn} spawn
     *  @param {boolean} force
     *  @param {Object} memory **/
    spawn: function(spawn, force = false, memory = {}) {
        var body = utils.buildBody(spawn, [ATTACK,MOVE], null, 10);
        memory.role = 'killer';
            spawn.createCreep(body, 'killer'+Game.time.toString(), memory);
        return body;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        var room = Game.rooms[creep.memory.ownRoom];
        var hostile = room.find(FIND_HOSTILE_CREEPS);
        if (hostile.length != 0) {
            hostile.sort(utils.sortDistance(creep));
            if (creep.attack(hostile[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hostile[0]);
            }
        }
        
    }
};

module.exports = roleKiller;