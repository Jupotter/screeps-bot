/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('InfoFlag');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
      
    go:function(spawn)
    {
        var texte =" \n\n\n";
        var x = 22;
        var y =44;

        var room = spawn.room;
        var store = room.storage;
        var energy = room.energyAvailable;
        if (store) {
            energy += store.store[RESOURCE_ENERGY];
        }
        
        //console.log(JSON.stringify(flag));
        texte += '⚡ Core : ' + spawn.room.energyAvailable + " / " + spawn.room.energyCapacityAvailable  + "\n\n\n"  ;
        texte +=  "🔨 Storage : " + energy;
        
        spawn.room.visual.text(
                 texte,
                x + 1,
                y,
                { align: 'left', opacity: 0.8 });
        texte =   "🔰Level : "+spawn.room.controller.level;
        texte += "  ⏳ Progress :" +Math.trunc((spawn.room.controller.progress/spawn.room.controller.progressTotal)*100)+"%"; 
        texte+= " 💀Death : "+spawn.room.controller.ticksToDowngrade;
        
        spawn.room.visual.text(
                 texte,
                x + 1,
                y+1,
                { align: 'left', opacity: 0.8 });
        
    }

};