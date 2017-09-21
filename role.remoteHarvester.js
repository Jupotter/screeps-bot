var utils = require('utils');

var roleRemoteHarvester = {
    //** @param {Spawn} spawn **/
    spawn: function(spawn, force = false) {
        var body = utils.buildBody(spawn, [WORK,CARRY,MOVE], null, 15);
        if (force || spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.75) {
            spawn.createCreep(body, undefined, {role: 'remoteHarvester'});
        }
        return body;
    },
    
    distance: function(a, b) {
        var dist = (b.pos.x - a.pos.x)*(b.pos.x - a.pos.x) + (b.pos.y - a.pos.y)*(b.pos.y - a.pos.y);
        console.log(dist);
        return dist;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        var source = creep.memory.source;
        var room = creep.memory.room;
        if (source) {
            source = Game.getObjectById(source);
            if(creep.carry.energy == 0) {
    	        creep.memory.harvest = true;
                if (source && source.energy == 0) {
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
                var container = Game.getObjectById(creep.memory.destination);
                if (container != null) {
                    if(creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } 
            }
        } else {
            if (creep.room.name != room) {
                var exit = Game.map.findExit(creep.room, room);
                creep.moveTo(creep.room.find(exit)[0], {visualizePathStyle: {stroke: '#00ff00'}});
                creep.memory.destination = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_LINK
                }).id;
            } else {
                source = creep.room.find(FIND_SOURCES);
                creep.memory.source = source[0].id;
            }
        }
	}
};

module.exports = roleRemoteHarvester;