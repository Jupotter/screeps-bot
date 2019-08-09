export enum JobType {
    Fill,
    Harvest,
    Upgrade,
    Build
}

export class JobManager {
    public static PrepareJobs(room: Room) {
        const roomMemory = room.memory;

        const sourceJobs = room
            .find(FIND_SOURCES)
            .filter(s => roomMemory.jobs.find(j => j.targetId === s.id) === undefined)
            .map(
                s =>
                    ({
                        creep: null,
                        creepLimit: 1,
                        pos: s.pos,
                        priority: 1,
                        targetId: s.id,
                        type: JobType.Harvest
                    } as Job)
            );

        roomMemory.jobs.push(...sourceJobs);

        if (roomMemory.jobs.find(j => j.type === JobType.Upgrade) === undefined && room.controller !== undefined) {
            const controller = room.controller;
            roomMemory.jobs.push({
                creep: null,
                creepLimit: 1,
                pos: controller.pos,
                priority: 1,
                targetId: controller.id,
                type: JobType.Upgrade
            });
        }

        if (roomMemory.jobs.find(j => j.targetId === roomMemory.spawn) === undefined) {
            const spawn = Game.getObjectById(roomMemory.spawn) as StructureSpawn;
            roomMemory.jobs.push({
                creep: null,
                creepLimit: 1,
                pos: spawn.pos,
                priority: 1,
                targetId: spawn.id,
                type: JobType.Fill
            });
        }

        return;
    }
}
