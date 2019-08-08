import { Utils } from "utils";

enum WorkerState {
    SPAWNING,
    HARVESTING,
    BUILDING,
    UPGRADING
}

interface WorkerMemory extends CreepMemory {
    building: boolean;
    state: WorkerState;
    target: string | null;
}

export class RoleWorker {
    private static order = [
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
        STRUCTURE_WALL
    ];

    public static spawn(spawn: StructureSpawn, force = false, memory: BaseCreepMemory) {
        const body = Utils.BuildBody(spawn, [WORK, CARRY, MOVE], null, 20);
        const fullMemory = memory as WorkerMemory;
        fullMemory.role = "worker";
        fullMemory.state = WorkerState.SPAWNING;
        spawn.createCreep(body, "worker" + Game.time.toString(), fullMemory);
        return body;
    }

    private static spawning(creep: Creep, memory: WorkerMemory) {
        if (!creep.spawning) {
            creep.say("🔄 harvest");
            memory.state = WorkerState.HARVESTING;
            this.run(creep);
        }
        return;
    }

    private static findHarvestingTarget(creep: Creep, memory: WorkerMemory) {
        creep.say("🔄 harvest");
        const ground = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        if (ground) {
            memory.target = ground.id;
        } else {
            const spawn = Game.getObjectById(Game.rooms[memory.ownRoom].memory.spawn) as StructureSpawn;
            let container;
            let startpos = creep.pos;
            if (spawn) {
                startpos = spawn.pos;
            }
            container = startpos.findClosestByPath(FIND_STRUCTURES, {
                filter: structure => {
                    return (
                        (structure.structureType === STRUCTURE_CONTAINER ||
                            structure.structureType === STRUCTURE_STORAGE) &&
                        structure.store[RESOURCE_ENERGY] > 0
                    );
                }
            });

            if (container) {
                memory.target = container.id;
                if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: "#ffaa00" } });
                }
            } else {
                const source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (!source) {
                    console.log("No energy source found");
                    return;
                }
                memory.target = source.id;
            }
        }
    }

    private static harvesting(creep: Creep, memory: WorkerMemory) {
        if (memory.target === null) {
            this.findHarvestingTarget(creep, memory);
        }

        const target = Game.getObjectById(memory.target as string);
        if (target instanceof Resource) {
            if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            if (target.amount === 0) {
                memory.target = null;
            }
        } else if (target instanceof StructureContainer || target instanceof StructureStorage) {
            if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            if (target.store.energy === 0) {
                memory.target = null;
            }
        } else if (target instanceof Source) {
            if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
        } else {
            memory.target = null;
        }

        if (creep.carry.energy === creep.carryCapacity) {
            memory.target = null;
            memory.state = WorkerState.BUILDING;
        }
    }

    private static findBuildingTarget(creep: Creep, memory: WorkerMemory) {
        creep.say("🚧 build");

        for (const i in this.order) {
            const struct = this.order[i];
            const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: a => {
                    return a.structureType === struct;
                }
            });
            if (target) {
                memory.target = target.id;
                return;
            }
        }
    }

    private static building(creep: Creep, memory: WorkerMemory) {
        if (memory.target === null) {
            this.findBuildingTarget(creep, memory);
        }

        const target = Game.getObjectById(memory.target as string);

        if (target instanceof ConstructionSite) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        } else {
            memory.state = WorkerState.UPGRADING;
        }

        if (creep.carry.energy === 0) {
            memory.state = WorkerState.HARVESTING;
            memory.target = null;
            this.upgrading(creep, memory);
        }
    }

    private static upgrading(creep: Creep, memory: WorkerMemory) {
        const target = creep.room.controller;

        if (target === undefined) {
            return;
        }
        if (memory.target === null) {
            memory.target = target.id;
            creep.say("⬆ Upgrade");
        }
        if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        }

        if (creep.carry.energy === 0) {
            memory.state = WorkerState.HARVESTING;
            memory.target = null;
            this.upgrading(creep, memory);
        }
    }

    public static run(creep: Creep) {
        const memory = creep.memory as WorkerMemory;

        if (memory.state === WorkerState.SPAWNING) {
            this.spawning(creep, memory);
            return;
        }

        if (memory.state === WorkerState.HARVESTING) {
            this.harvesting(creep, memory);
            return;
        }

        if (memory.state === WorkerState.BUILDING) {
            this.building(creep, memory);
            return;
        }

        if (memory.state === WorkerState.UPGRADING) {
            this.upgrading(creep, memory);
            return;
        }
    }
}
