define(function () {

function attemptMove(body, delta, collides) {
	var pos = body.pos;
	var box = body.box;
	if (collides(box, pos)) {
		delta.x = 0;
		delta.y = 1;
		delta.z = 0;
		return delta;
	}

	// TODO: Partial application of movements
	// (just make sure it matches the server!)
	// some "stickyness" when jumping is likely
	// caused by lack of partial movement application.
	pos.x += delta.x;
	if (collides(box, pos)) {
		pos.x -= delta.x;
		delta.x = 0;
	}

	pos.y += delta.y;
	if (collides(box, pos)) {
		pos.y -= delta.y;
		delta.y = 0;
	}

	pos.z += delta.z;
	if (collides(box, pos)) {
		pos.z -= delta.z;
		delta.z = 0;
	}
	return delta;
}

// WARNING: Be VERY careful that any changes to this
// function are *exactly* mirrored on the server,
// or else you __will__ encounter problems with
// entity prediction!
function simulate(collides, state, c, dt) /* newState */ {
	var newState = state.clone();

	//For some reason this whole function treats dt as it's in seconds...
	//(on the server too).
	dt /= 1000;

	if(dt > 1) {
		dt = 1;
	}

	var sin = Math.sin;
	var cos = Math.cos;

	newState.look = new THREE.Vector3(
		sin(c.lat) * cos(c.lon),
		cos(c.lat),
		sin(c.lat) * sin(c.lon)
	);

	newState.entityState.body.vel.y += dt * -9.81;

	var fw = c.forward() ? 1 : c.back() ? -1 : 0;
	var rt = c.right()   ? 1 : c.left() ? -1 : 0;
	fw *= 10 * dt;
	rt *= 10 * dt;
	var delta = {
		x: -cos(c.lon)*fw + sin(c.lon)*rt,
		y: newState.entityState.body.vel.y * dt,
		z: -sin(c.lon)*fw - cos(c.lon)*rt
	};

	delta = attemptMove(newState.entityState.body, delta, collides);

	if (delta.y === 0) {
		newState.entityState.body.vel.y = c.jump() ? 6 : 0;
	}

	return newState;
}

return {
	simulate: simulate
};

});
