var utils = {
    distance: function(a, b) {
        var dist = (b.pos.x - a.pos.x)*(b.pos.x - a.pos.x) + (b.pos.y - a.pos.y)*(b.pos.y - a.pos.y);
        return dist;
    },
    
    sortDistance: function(creep) {
        var that = this;
        return function(a, b) {
           var dist = that.distance(creep, a) - that.distance(creep, b);
           return dist;
        }
    },
    
    findSources(creep) {
        var that = this
        var sources = creep.room.find(FIND_SOURCES);
        
        sources.sort(
            function(a, b) {
               var dist = that.distance(creep, a) - that.distance(creep, b);
               return dist;
            });
        return sources;
    },
    
    bodyCost: function(body) {
        var cost = 0;
        for (var i in body) {
            var part = body[i];
            cost += BODYPART_COST[part];
        }
        return cost;
    },
    
    buildBody: function(spawn, base, first, limit = 0) {
        var that = this;
        var capacity = spawn.room.energyAvailable;
        var body = base.slice();
        if (first) {
            body.push(first);
        }
        var cost = that.bodyCost(base);
        var added = false;
        do {
            added = false;
            for (var i in base) {
                var part = base[i];
                //console.log(part);
                if (cost + BODYPART_COST[part] <= capacity) {
                    body.push(part);
                    cost += BODYPART_COST[part];
                    added = true;
                }
                if (limit != 0 && body.length >= limit) {
                    added = false;
                    break;
                }
            }
        } while (added && cost < capacity)
        return body;
    }
}

module.exports = utils;