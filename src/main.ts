import { InfoFlag } from "infoFlag";
import { RoleWorker } from "role/worker";
import { Utils } from "utils";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);

    const flags = _.filter(Game.flags, (f: Flag) => f.color === COLOR_WHITE && f.secondaryColor === COLOR_WHITE);

    flags.forEach((flag: Flag) => {
        const infoFlag = new InfoFlag(flag);
        infoFlag.printInfo();
    });

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        RoomManager.SetupMemory(room);
        const spawn = Game.getObjectById(room.memory.spawn) as StructureSpawn;

        const workers = _.filter(
            Game.creeps,
            creep => creep.memory.role === "worker" && creep.memory.ownRoom === room.name
        );

        if (workers.length < 3) {
            RoleWorker.spawn(spawn, false, { ownRoom: room.name });
        }

        workers.forEach(c => RoleWorker.run(c));
    }
    Utils.ClearMemory();
});

class RoomManager {
    public static SetupMemory(room: Room) {
        const memory = room.memory;
        if (memory.sources === null) {
            const sources = room.find(FIND_SOURCES);
            const memories = sources.map(s => ({ id: s.id, creep: null } as SourceMemory));
            memory.sources = memories;
        }
        if (memory.spawn === null) {
            memory.spawn = room.find(FIND_MY_SPAWNS)[0].id;
        }
    }
}
