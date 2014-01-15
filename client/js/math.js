// Handy math functions!
define(function() {
math = {};
math.sin = Math.sin;
math.cos = Math.cos;
math.abs = Math.abs;
math.min = Math.min;
math.max = Math.max;
math.sqrt = Math.sqrt;
math.pow = Math.pow;
math.floor = Math.floor;
math.ceil = Math.ceil;

// JavaScript builtin mod is silly for negative numbers...
math.mod = function (a, b) {
	return (((a % b) + b) % b);
}
// Clamp n between [a, b]. Behaviour is
// undefined if a > b. (who even wrote this?)
math.clamp = function (n, a, b) {
	return n < a ? a : n > b ? b : n;
}
// Return the sign of n, -1, 1, or 0.
math.signum = function (n) {
	return n < 0 ? -1 : n > 0 ? 1 : 0;
}
// Euclidian distance between p1 and p2
math.dist = function (p1, p2) {
	return sqrt(pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2) + pow(p1.z - p2.z, 2));
}
return math;
});
