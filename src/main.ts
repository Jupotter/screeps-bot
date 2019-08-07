import { InfoFlag } from "infoFlag";
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

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
});
