export class InfoFlag {
    private room: Room | undefined;
    private pos: RoomPosition;

    public constructor(flag: Flag) {
        const room = flag.room;
        this.pos = flag.pos;
        if (room === undefined) {
            return;
        }
        this.room = room;
    }

    public printInfo() {
        const room = this.room;
        if (room === undefined) {
            console.log("Invalid Room");
            return;
        }

        if (room.controller === undefined) {
            console.log("Invalid Controller");
            return;
        }

        const store = room.storage;
        let energy = room.energyAvailable;
        if (store) {
            energy += store.store[RESOURCE_ENERGY];
        }

        const available = room.energyAvailable;
        const capacity = room.energyCapacityAvailable;
        const text1 = `⚡ Core : ${available} / ${capacity} 🔨 Storage : ${energy}`;
        room.visual.text(text1, this.pos.x + 1, this.pos.y, { align: "left", opacity: 0.8 });

        const level = room.controller.level;
        const progress = Math.trunc((room.controller.progress / room.controller.progressTotal) * 100);
        const downgrade = room.controller.ticksToDowngrade;
        const text2 = `🔰Level : ${level}  ⏳ Progress : ${progress}%  💀Death : ${downgrade}`;

        room.visual.text(text2, this.pos.x + 1, this.pos.y + 1, { align: "left", opacity: 0.8 });
    }
}
