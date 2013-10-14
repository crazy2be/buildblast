//Exposes handy math functions to the global context

define(function() {
return function addToContext(context) {
	//I swear, I should just loop through all of math and add it to the global context...
	context.sin = Math.sin;
	context.cos = Math.cos;
	context.abs = Math.abs;
	context.min = Math.min;
	context.max = Math.max;
	context.sqrt = Math.sqrt;
	context.pow = Math.pow;
	context.floor = Math.floor;
	context.ceil = Math.ceil;

	//Well this stuff should probably go in a module... but this is
	//soooo convienent!
	context.mod = function (a, b) {
		return (((a % b) + b) % b);
	}
	// Clamp n between [a, b]. Behaviour is
	// undefined if a > b. (who even wrote this?)
	context.clamp = function (n, a, b) {
		return n < a ? a : n > b ? b : n;
	}
	// Return the sign of n, -1, 1, or 0.
	context.signum = function (n) {
		return n < 0 ? -1 : n > 0 ? 1 : 0;
	}

	//Essentially an extension of mod,
	//wraps n around [a, b] if it is outside.
	//(wrap(1.5, -1, 1) ~ -0.5
	context.wrap = function (n, a, b) {
		return context.mod(n - b, (a - b)) + b;
	}
	// You only need this on the worker thread,
	//
	context.dist = function (p1, p2) {
		return sqrt(pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2) + pow(p1.z - p2.z, 2));
	}
}
});
