import { InfoFlag } from "infoFlag";
import { RoleHarvester } from "role/harvester";
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

        const harvesters = _.filter(
            Game.creeps,
            creep => creep.memory.role === "harvester" && creep.memory.ownRoom === room.name
        );

        console.log(`workers: ${workers.length}/3`);
        console.log(`harvesters: ${harvesters.length}/${room.memory.sources.length}`);

        if (!spawn.spawning) {
            if (harvesters.length < room.memory.sources.length) {
                RoleHarvester.spawn(spawn, false, { ownRoom: room.name });
            } else if (workers.length < 3) {
                RoleWorker.spawn(spawn, false, { ownRoom: room.name });
            }
        } else {
            const spawned = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text("🛠️" + spawned.memory.role, spawn.pos.x + 1, spawn.pos.y, {
                align: "left",
                opacity: 0.8
            });
        }

        workers.forEach(c => RoleWorker.run(c));
        harvesters.forEach(c => RoleHarvester.run(c));
    }
    Utils.ClearMemory();
});

class RoomManager {
    public static SetupMemory(room: Room) {
        if (room.memory.spawn === null || room.memory.spawn === undefined) {
            const sources = room.find(FIND_SOURCES);
            const memories = sources.map(s => ({ id: s.id, creep: null } as SourceMemory));
            room.memory = { spawn: room.find(FIND_MY_SPAWNS)[0].id, sources: memories };
        }

        room.memory.sources.forEach(s => {
            if (s.creep !== null && Memory.creeps[s.creep] === undefined) {
                s.creep = null;
            }
        });
    }
}
