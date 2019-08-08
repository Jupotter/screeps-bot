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

        const spawn = room.find(FIND_MY_SPAWNS)[0];

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
