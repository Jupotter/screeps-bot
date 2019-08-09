import { JobType } from "JobManager";
import { Utils } from "utils";

enum State {
    SPAWNING,
    HARVESTING
}

interface HarvesterMemory extends CreepMemory {
    state: State;
}

export class RoleHarvester {
    public static spawn(spawn: StructureSpawn, force = false, memory: BaseCreepMemory) {
        const body = Utils.BuildBody(spawn, [WORK], MOVE, 6);
        const fullMemory = memory as HarvesterMemory;
        fullMemory.role = "harvester";
        fullMemory.state = State.SPAWNING;
        fullMemory.job = null;
        console.log("Spawning harvester: " + Utils.BodyCost(body));
        console.log(spawn.spawnCreep(body, "harvester" + Game.time.toString(), { memory: fullMemory }));
        return body;
    }

    private static spawning(creep: Creep, memory: HarvesterMemory) {
        if (memory.job === null || memory.job === undefined) {
            const roomMemory = Game.rooms[creep.memory.ownRoom].memory;
            const jobs = roomMemory.jobs.filter(j => j.type === JobType.Harvest);

            const free = jobs.find(j => j.creep === null);
            if (free === undefined) {
                console.log("No source available");
                return;
            }

            memory.job = free;
            free.creep = creep.name;
            creep.say("🔄 harvest");
            memory.state = State.HARVESTING;
            this.run(creep);
        }
        return;
    }

    private static harvest(creep: Creep, memory: HarvesterMemory) {
        if (memory.job === null) {
            creep.say("No job available");
            return;
        }
        const source = Game.getObjectById(memory.job.targetId) as Source;
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
        }
        return;
    }

    public static run(creep: Creep) {
        const memory = creep.memory as HarvesterMemory;

        if (memory.state === State.SPAWNING) {
            this.spawning(creep, memory);
            return;
        }

        if (memory.state === State.HARVESTING) {
            this.harvest(creep, memory);
            return;
        }
    }
}
