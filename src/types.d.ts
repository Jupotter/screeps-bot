// example declaration file - remove these and add your own custom typings

interface BaseCreepMemory {
    ownRoom: string;
}

interface CreepMemory extends BaseCreepMemory {
    role: string;
}

interface RoomMemory {
    spawn: string;
    sources: SourceMemory[] | null;
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
