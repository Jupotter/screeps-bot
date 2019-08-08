// example declaration file - remove these and add your own custom typings

interface BaseCreepMemory {
    ownRoom: string;
}

interface CreepMemory extends BaseCreepMemory {
    role: string;
}

interface HarvesterMemory extends CreepMemory {
    source: string;
    harvest: boolean;
    orig: string;
}

interface RoomMemory {
    spawn: string;
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
