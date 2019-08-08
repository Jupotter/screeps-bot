var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleHauler = require('role.hauler');
var roleClaimer = require('role.claimer');
var roleRemoteHarvester = require('role.remoteHarvester');
var roleKiller = require('role.killer');
var roleMHarvester = require('role.mineralHarvester');
var utils = require('utils');
var infoFlag = require('./infoFlag');

function handleTowers(room) {
  var hostile = room.find(FIND_HOSTILE_CREEPS);
  var towers = room.find(FIND_STRUCTURES, {
    filter: (structure) => structure.structureType == STRUCTURE_TOWER
  });
  for (var t = 0; t < towers.length; t++) {
    var tower = towers[t];
    if (hostile.length == 0) {
      var damagedStructure = tower.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax &&
          structure.hits < 200000
      });

      damagedStructure.sort((s1, s2) => s1.hits - s2.hits);

      if (damagedStructure.length != 0) {
        tower.repair(damagedStructure[0]);
      }
    } else {
      hostile.sort(utils.sortDistance(tower));
      tower.attack(hostile[0]);
    }
  }
}

function handleLinks(room, spawn) {
  var links = room.find(FIND_STRUCTURES, {
    filter: (s) => s.structureType == STRUCTURE_LINK
  });

  if (links.length >= 2) {
    links.sort(utils.sortDistance(spawn));
    if (links[1].cooldown == 0 && links[1].energy > 0) {
      links[1].transferEnergy(links[0]);
    }
  }
}

function setupDoNotFill(spawn) {
  var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType == STRUCTURE_CONTAINER;
    }
  });
  if (!container) {
    console.log("no recycle container found");
  } else {
    roleHauler.doNotFill.push(container.id);
  }
}

var remoteRooms = [];

/** @param {Creep} creep **/
var recycle = function (creep, spawn) {
  creep.memory.role = 'recycle';
  if (creep.carry > 0) {
    creep.drop(RESOURCE_ENERGY, creep.carry);
  } else {
    var container = spawn.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_CONTAINER;
      }
    });
    if (!container) {
      console.log("no recycle container found");
      container = spawn;
    }
    if (spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
      creep.moveTo(container, {
        visualizePathStyle: {
          stroke: '#ff0000'
        }
      });
    }
  }
};

var upgraderByLevel = [1, 1, 1, 1, 2, 2, 2, 3, 3];

module.exports.loop = function () {
  utils.clearMemory();
  console.log("<hrule />");
  console.log("credits: " + Game.market.credits);

  var mainSpawn = Game.spawns.Spawn1;
  var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
  if (claimers.length < remoteRooms.length) {
    roleClaimer.spawn(mainSpawn, false, {
      ownRoom: mainSpawn.room.name
    });
  }
  var remoteHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'remoteHarvester');
  if (remoteHarvesters.length < remoteRooms.length) {
    roleRemoteHarvester.spawn(mainSpawn, false, {
      ownRoom: mainSpawn.room.name
    });
  }

  for (var room in Game.rooms) {
    room = Game.rooms[room];

    console.log("room: " + room.name);
    if (!room.controller || !room.controller.my) {
      continue;
    }
    var hostile = room.find(FIND_HOSTILE_CREEPS);
    var spawn = mainSpawn;
    for (var spawnN in Game.spawns) {
      if (Game.spawns[spawnN].room.name == room.name) {
        spawn = Game.spawns[spawnN];
        infoFlag.go(spawn);
        room.memory.spawn = spawn.id;
        break;
      }
    }


    setupDoNotFill(spawn);

    var sources = [];
    var dest = room;
    if (!dest.memory.sources) {
      var thisSources = dest.find(FIND_SOURCES);
      dest.memory.sources = thisSources;
      sources = sources.concat(thisSources);
    } else {
      sources = sources.concat(dest.memory.sources);
    }


    var store = room.storage;
    var energy = room.energyAvailable;
    if (store) {
      energy += store.store[RESOURCE_ENERGY];
    }

    var sites = spawn.room.find(FIND_CONSTRUCTION_SITES, {
      filter: (s) => s.structureType != STRUCTURE_ROAD
    });
    var extractor = room.find(FIND_MINERALS, {
      filter: (s) => s.pos.lookFor(LOOK_STRUCTURES).length != 0 && s.mineralAmount > 0
    });

    if (extractor.length != 0 && room.terminal) {
      var mineral = extractor[0].mineralType;
      var terminal = room.terminal;
      if (terminal.store[mineral] > 0) {
        var transactions = Game.market.getAllOrders({
          type: ORDER_BUY,
          resourceType: mineral
        });
        transactions = transactions.sort((t1, t2) => Game.map.getRoomLinearDistance(room.name, t1.roomName, true) - Game.map.getRoomLinearDistance(room.name, t2.roomName, true));
        var deal = transactions[0];
        if (deal) {
          Game.market.deal(deal.id, Math.min(terminal.store[mineral], deal.amount), room.name);
        }
      }
    }

    handleTowers(room);

    handleLinks(room, spawn);

    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'mineralHarvester' && creep.memory.ownRoom == room.name);
    if (miners.length < extractor.length) {
      roleMHarvester.spawn(spawn, false, {
        ownRoom: room.name
      });
    }
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.ownRoom == room.name);
    if (builders.length < (sites.length + 1) / 5) {
      roleBuilder.spawn(spawn, false, {
        ownRoom: room.name
      });
    }
    var upgrader = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && creep.memory.ownRoom == room.name);
    if (upgrader.length < upgraderByLevel[room.controller.level]) {
      roleUpgrader.spawn(spawn, false, {
        ownRoom: room.name
      });
    }
    var hauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && creep.memory.ownRoom == room.name);
    if (hauler.length < sources.length + 1) {
      roleHauler.spawn(spawn, hauler.length == 0, {
        ownRoom: room.name
      });
    }
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.ownRoom == room.name);
    if (harvesters.length < sources.length) {
      roleHarvester.spawn(spawn, harvesters.length == 0, {
        ownRoom: room.name
      });
    }
    var killers = _.filter(Game.creeps, (creep) => creep.memory.role == 'killer' && creep.memory.ownRoom == room.name);
    if (killers.length == 0 && hostile.length != 0) {
      roleKiller.spawn(spawn, true, {
        ownRoom: room.name
      });
    }

    console.log(energy + " energy available");
    console.log("sources: " + sources);
    console.log("Harvesters: " + harvesters);
    console.log("Haulers: " + hauler);
    console.log("Upgrader: " + upgrader);
    console.log("Builder: " + builders);
    console.log("Killers: " + killers);
    console.log("Miners: " + miners);

    if (spawn.spawning) {
      var spawningCreep = Game.creeps[spawn.spawning.name];
      spawn.room.visual.text(
        '🛠️' + spawningCreep.memory.role,
        spawn.pos.x + 1,
        spawn.pos.y, {
          align: 'left',
          opacity: 0.8
        });
    }

    var h = 0;
    var owncreep = _.filter(Game.creeps, (creep) => creep.memory.ownRoom == room.name);
    for (var name in owncreep) {
      var creep = owncreep[name];
      if (creep.ticksToLive <= 50 || creep.memory.role == 'recycle') {
        recycle(creep, spawn);
      } else {
        switch (creep.memory.role) {
          case 'harvester':
            if (!creep.memory.source) {
              for (var i in sources) {
                source = sources[i];
                if (!source.creep || !Game.creeps[source.creep] || Memory.creeps[source.creep].role != 'harvester') {
                  source.creep = creep.name;
                  creep.memory.source = source.id;
                  break;
                }
              }
            }
            if (creep.memory.source) {
              roleHarvester.run(creep);
            } else {
              recycle(creep, spawn);
            }
            break;
          case 'upgrader':
            roleUpgrader.run(creep);
            break;
          case 'builder':
            roleBuilder.run(creep);
            break;
          case 'hauler':
            roleHauler.run(creep, sources[h++]);
            break;
          case 'claimer':
            creep.memory.room = remoteRooms[0];
            roleClaimer.run(creep);
            break;
          case 'killer':
            roleKiller.run(creep);
            break;
          case 'remoteHarvester':
            creep.memory.room = remoteRooms[0];
            roleRemoteHarvester.run(creep);
            break;
          case 'mineralHarvester':
            roleMHarvester.run(creep);
            break;
        }
      }
    }
  }
};
