interface Job {
    pos: RoomPosition | null;
    targetId: string;
    priority: number;
    type: JobType;
    creep: string | null;
    creepLimit: number;
}

interface BaseCreepMemory {
    ownRoom: string;
}

interface CreepMemory extends BaseCreepMemory {
    role: string;
    job: Job | null;
}

interface RoomMemory {
    spawn: string;
    jobs: Job[];
}

interface SourceMemory {
    id: string;
    creep: string | null;
}

interface Memory {
    uuid: number;
    log: any;
}

// `global` extension samples
declare namespace NodeJS {
    interface Global {
        log: any;
    }
}
