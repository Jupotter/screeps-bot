var utils = require('utils');

var roleMineralHarvester = {
	//** @param {Spawn} spawn **/
	spawn: function (spawn, force = false, memory = {}) {
		var body = utils.buildBody(spawn, [WORK, MOVE],CARRY, 15);
		memory.role = 'mineralHarvester';
		spawn.createCreep(body, 'mineralHarvester' + Game.time.toString(), memory);
		return body;
	},

	/** @param {Creep} creep **/
	run: function (creep) {
		var source = Game.getObjectById(creep.memory.source);
		var target = creep.room.terminal;
		if (!source) {
			source = creep.room.find(FIND_MINERALS)[0];
			creep.memory.source = source.id;
		}

		var resource = source.mineralType;

		if (!creep.carry[resource] || creep.carry[resource]  == 0) {
			creep.memory.harvest = true;
		} else {
			creep.memory.harvest = false;
		}

		if (creep.memory.harvest) {
			if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
				creep.moveTo(source, {
					visualizePathStyle: {
						stroke: '#ffaa00'
					}
				});
			}

		} else {

			if (creep.transfer(target, resource) == ERR_NOT_IN_RANGE) {
				creep.moveTo(target, {
					visualizePathStyle: {
						stroke: '#ffffff'
					}
				});
			}

		}
	}
};

module.exports = roleMineralHarvester;
