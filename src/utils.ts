export class Utils {
    public static distance(a: RoomObject, b: RoomObject) {
        const dist = (b.pos.x - a.pos.x) * (b.pos.x - a.pos.x) + (b.pos.y - a.pos.y) * (b.pos.y - a.pos.y);
        return dist;
    }

    public static sortDistance(creep: Creep) {
        const that = this;
        return (a: RoomObject, b: RoomObject) => {
            const dist = that.distance(creep, a) - that.distance(creep, b);
            return dist;
        };
    }

    public static findSources(creep: Creep) {
        const sources = creep.room.find(FIND_SOURCES);

        sources.sort(this.sortDistance(creep));
        return sources;
    }

    public static BodyCost(body: BodyPartConstant[]) {
        let cost = 0;
        for (const i in body) {
            const part = body[i];
            cost += BODYPART_COST[part];
        }
        return cost;
    }

    public static BuildBody(
        spawn: StructureSpawn,
        base: BodyPartConstant[],
        first: BodyPartConstant | null,
        limit = 0
    ) {
        const that = this;
        const capacity = spawn.room.energyAvailable;
        const body = base.slice();
        if (first) {
            body.push(first);
        }
        let cost = that.BodyCost(base);
        let added = true;
        while (added && cost < capacity) {
            for (const i in base) {
                added = false;
                const part = base[i];
                // console.log(part);
                if (cost + BODYPART_COST[part] < capacity) {
                    body.push(part);
                    cost += BODYPART_COST[part];
                    console.log(`${body}: ${cost}`);
                    added = true;
                } else {
                    added = false;
                    console.log(`${body}: ${cost}`);
                    break;
                }
                if (limit !== 0 && body.length >= limit) {
                    added = false;
                    break;
                }
            }
        }
        return body;
    }

    public static ClearMemory() {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
    }
}
