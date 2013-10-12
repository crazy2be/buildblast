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
}
});
