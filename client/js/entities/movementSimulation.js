var moveSim = function () {

	function bboxEach(p, fn, reduce) {
		var he = PLAYER_HALF_EXTENTS;
		var co = PLAYER_CENTER_OFFSET;
		var xs = p.x + co.x - he.x, xe = p.x + co.x + he.x;
		var ys = p.y + co.y - he.y, ye = p.y + co.y + he.y;
		var zs = p.z + co.z - he.z, ze = p.z + co.z + he.z;
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

	function groundHeight(world, pos) {
		var cg = world.findClosestGround;
		return bboxEach(pos, cg, Math.max) + PLAYER_HALF_EXTENTS.y - PLAYER_CENTER_OFFSET.y;
	}

	//Tries to apply an application of deltaMove to pos, without introducing intersections.
	function attemptMove(pos, inSolid, world, deltaMove) {
		//This code should probably be put to use for partial application of all movement
		//in the y direction, but if it is the server code must also be changed.
		if (inSolid(world, pos)) {
			var gh = groundHeight(world, pos);
			deltaMove.y = pos.y - gh;
			pos.y = gh;
		}

		pos.x += deltaMove.x;
		if (inSolid(world, pos)) {
			pos.x -= deltaMove.x;
			deltaMove.x = 0;
		}

		p.y += deltaMove.y;
		if (inSolid(world, pos)) {
			pos.y -= deltaMove.y;
			deltaMove.y = 0;
		}

		pos.z += deltaMove.z;
		if (inSolid(world, pos)) {
			pos.z -= deltaMove.z;
			deltaMove.z = 0;
		}

		return pos;
	}

	function makeDeltaMove(userConstants, lastRay, newRay, controlState, dt) {
		//We probably want to reduce 'gravity' a bit here
		newRay.dy = lastRay.dy + dt * -9.81;

		//Hardcoded for now?
		var speed = 10;

		var xzSpeed = speed * dt;
		var fw = xzSpeed*(c.forward ? 1 : c.back ? -1 : 0);
		var rt = xzSpeed*(c.right ? 1 : c.left ? -1 : 0);
		var move = {
			x: -cos(c.lon) * fw + sin(c.lon) * rt,
			y: newRay.dy * dt,
			z: -sin(c.lon) * fw - cos(c.lon) * rt,
		};



		box.setPos(pos);
		box.attemptMove(world, move);
		if (move.y === 0) {
			vy = c.jump ? 6 : 0;
		}
		return vy;
	}

	return {
		attemptMove: attemptMove
	};
};