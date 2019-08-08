import { Utils } from "utils";
import { ErrorMapper } from "utils/ErrorMapper";

enum State {
    SPAWNING,
    HARVESTING
}

interface HarvesterMemory extends CreepMemory {
    state: State;
    source: string;
}

export class RoleHarvester {
    public static spawn(spawn: StructureSpawn, force = false, memory: BaseCreepMemory) {
        const body = Utils.BuildBody(spawn, [WORK], MOVE, 6);
        const fullMemory = memory as HarvesterMemory;
        fullMemory.role = "harvester";
        fullMemory.state = State.SPAWNING;
        console.log("Spawning harvester: " + Utils.BodyCost(body));
        console.log(spawn.spawnCreep(body, "harvester" + Game.time.toString(), { memory: fullMemory }));
        return body;
    }

    private static spawning(creep: Creep, memory: HarvesterMemory) {
        if (memory.source === null || memory.source === undefined) {
            const roomMemory = Game.rooms[creep.memory.ownRoom].memory;
            const sources = roomMemory.sources;
            console.log(sources.length);
            const free = sources.find(s => s.creep === null);
            if (free === undefined) {
                console.log("No source available, dying");
                return;
            }

            memory.source = free.id;
            free.creep = creep.name;
            creep.say("🔄 harvest");
            memory.state = State.HARVESTING;
            this.run(creep);
        }
        return;
    }

    private static harvest(creep: Creep, memory: HarvesterMemory) {
        const source = Game.getObjectById(memory.source) as Source;
        if (source === undefined || source === null) {
            console.log("No source available, dying");
        }
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
