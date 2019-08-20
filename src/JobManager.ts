export enum JobType {
    Fill,
    Harvest,
    Upgrade,
    Build
}

export class JobManager {
    public static PrepareJobs(room: Room) {
        this.HarvestJobs(room);
        this.FillJobs(room);
        this.UpgradeJobs(room);
        this.BuildingJobs(room);

        return;
    }

    private static HarvestJobs(room: Room) {
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
    }

    private static FillJobs(room: Room) {
        const roomMemory = room.memory;

        if (roomMemory.jobs.find(j => j.targetId === roomMemory.spawn) === undefined) {
            const spawn = Game.getObjectById(roomMemory.spawn) as StructureSpawn;
            if (spawn.energy < spawn.energyCapacity) {
                roomMemory.jobs.push({
                    creep: null,
                    creepLimit: 1,
                    pos: spawn.pos,
                    priority: 1,
                    targetId: spawn.id,
                    type: JobType.Fill
                });
            }
        }
    }

    private static UpgradeJobs(room: Room) {
        const roomMemory = room.memory;

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
            roomMemory.jobs.push({
                creep: null,
                creepLimit: 1,
                pos: controller.pos,
                priority: 2,
                targetId: controller.id,
                type: JobType.Upgrade
            });
            roomMemory.jobs.push({
                creep: null,
                creepLimit: 1,
                pos: controller.pos,
                priority: 2,
                targetId: controller.id,
                type: JobType.Upgrade
            });
        }
    }

    private static BuildingJobs(room: Room) {
        const priority: { [id in BuildableStructureConstant]: number } = {
            constructedWall: 5,
            container: 3,
            extension: 2,
            extractor: 4,
            lab: 6,
            link: 3,
            nuker: 6,
            observer: 6,
            powerSpawn: 6,
            rampart: 2,
            road: 5,
            spawn: 3,
            storage: 4,
            terminal: 4,
            tower: 2
        };

        const roomMemory = room.memory;

        const currentJobs = roomMemory.jobs.filter(j => j.type === JobType.Build);
        const buildingJobs = room
            .find(FIND_CONSTRUCTION_SITES, {
                filter: site => currentJobs.find(job => job.targetId === site.id) === undefined
            })
            .map(site => ({
                creep: null,
                creepLimit: 1,
                pos: site.pos,
                priority: priority[site.structureType],
                targetId: site.id,
                type: JobType.Build
            }));

        roomMemory.jobs.push(...buildingJobs);
    }
}
