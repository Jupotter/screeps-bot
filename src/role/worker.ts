import { JobType } from "JobManager";
import { Utils } from "utils";

enum WorkerState {
    Spawning,
    Harvesting,
    Working,
    FindingJob
}

interface WorkerMemory extends CreepMemory {
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

    private static allowedJobs = [JobType.Build, JobType.Upgrade, JobType.Fill];

    public static spawn(spawn: StructureSpawn, force = false, memory: BaseCreepMemory) {
        const body = Utils.BuildBody(spawn, [WORK, CARRY, MOVE], null, 20);
        const fullMemory = memory as WorkerMemory;
        fullMemory.role = "worker";
        fullMemory.state = WorkerState.Spawning;
        fullMemory.target = null;
        console.log("Spawning worker");
        spawn.spawnCreep(body, "worker" + Game.time.toString(), { memory: fullMemory });
        return body;
    }

    private static spawning(creep: Creep, memory: WorkerMemory) {
        if (!creep.spawning) {
            creep.say("🔄 FindingJob");
            memory.state = WorkerState.FindingJob;
            this.run(creep);
        }
        return;
    }

    private static findJob(creep: Creep, memory: WorkerMemory) {
        const jobs = Memory.rooms[memory.ownRoom].jobs;
        const free = jobs
            .filter(j => j.creep === null && this.allowedJobs.includes(j.type))
            .sort((j1, j2) => j1.priority - j2.priority)[0];
        if (free === undefined) {
            creep.say("No job available");
            return;
        }

        free.creep = creep.name;
        memory.job = free;
        memory.state = WorkerState.Working;
        this.working(creep, memory);
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
        if (memory.target === null || memory.target === undefined) {
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
            memory.state = WorkerState.Working;
        }
    }

    private static working(creep: Creep, memory: WorkerMemory) {
        if (memory.job === null) {
            memory.state = WorkerState.FindingJob;
            this.findJob(creep, memory);
            if (memory.job === null) {
                return;
            }
        }

        if (creep.carry.energy === 0) {
            memory.state = WorkerState.Harvesting;
            memory.target = null;
            this.harvesting(creep, memory);
            return;
        }

        if (memory.target === null) {
            memory.target = memory.job.targetId;
        }

        const target = Game.getObjectById(memory.target as string);

        if (target instanceof ConstructionSite) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            }

            if (target.progress === target.progressTotal) {
                const jobs = Memory.rooms[memory.ownRoom].jobs;
                const index = jobs.findIndex(j => j.targetId === memory.target);
                if (index > -1) {
                    jobs.splice(index, 1);
                }
                memory.job = null;
                memory.target = null;
            }
        } else if (target instanceof StructureSpawn) {
            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            }

            if (target.energy === target.energyCapacity) {
                const jobs = Memory.rooms[memory.ownRoom].jobs;
                const index = jobs.findIndex(j => j.targetId === memory.target);
                if (index > -1) {
                    jobs.splice(index, 1);
                }
                memory.job = null;
                memory.target = null;
            }
        } else if (target instanceof StructureController) {
            if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        } else {
            const jobs = Memory.rooms[memory.ownRoom].jobs;
            const job = jobs.find(j => j.targetId === memory.target);
            if (job !== undefined) {
                job.creep = null;
            }
            memory.job.creep = null;
            memory.job = null;
            return;
        }
    }

    public static run(creep: Creep) {
        const memory = creep.memory as WorkerMemory;

        if (memory.state === WorkerState.Spawning) {
            this.spawning(creep, memory);
            return;
        }

        if (memory.state === WorkerState.FindingJob) {
            this.findJob(creep, memory);
            return;
        }

        if (memory.state === WorkerState.Harvesting) {
            this.harvesting(creep, memory);
            return;
        }

        if (memory.state === WorkerState.Working) {
            this.working(creep, memory);
            return;
        }
    }
}
