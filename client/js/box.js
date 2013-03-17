// Implements simple collision detection between the world
// and a box whose center is at p and has a size described
// by the given halfExtents. Does not do partial application
// of movements. Feel free to improve it!
function Box(world, p, halfExtents) {
    var self = this;
    var onGround = true;

    self.setPos = function (newPos) {
        p = newPos;
    }

    self.onGround = function () {
        return onGround;
    }

    self.attemptMove = function (move) {
        var gh = groundHeight();

        if (p.y - gh < 0) {
            p.y = gh + 0.05;
            onGround = true;
            return p;
        } else if (Math.abs(p.y - gh) < 0.05) {
            onGround = true;
        } else {
            onGround = false;
        }

        p.x += move.x
        if (inSolid()) {
            p.x -= move.x;
        }

        p.y += move.y;
        if (inSolid()) {
            p.y -= move.y;
        }

        p.z += move.z;
        if (inSolid()) {
            p.z -= move.z;
        }

        return p.clone();
    }

    function bboxEach(fn, reduce) {
        var he = halfExtents;
        var xs = p.x + he.x, xe = p.x - he.x;
        var ys = p.y + he.y, ye = p.y - he.y;
        var zs = p.z + he.z, ze = p.z - he.z;
        // TODO: Figure out where more points are needed
        // based on the size of the shape (we use this many
        // because this is needed given the current size of
        // our player model).
        var ym = ys + (ye - ys) / 2;
        return reduce(
            fn(xs, ys, zs),
            fn(xs, ys, ze),
            fn(xs, ye, zs),
            fn(xs, ye, ze),
            fn(xs, ym, zs),
            fn(xs, ym, ze),
            fn(xe, ys, zs),
            fn(xe, ys, ze),
            fn(xe, ye, zs),
            fn(xe, ye, ze),
            fn(xe, ym, zs),
            fn(xs, ym, ze)
        );
    }

    function solid(x, y, z) {
        var block = world.blockAt(x, y, z);
        if (!block) return true;
        else return block.solid();
    }

    function logicalOr() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i]) return true;
        }
        return false;
    }

    function inSolid() {
        return bboxEach(solid, logicalOr);
    }

    function groundHeight() {
        var cg = world.findClosestGround;
        return bboxEach(cg, Math.max) + PLAYER_HEIGHT / 2;
    }
}
