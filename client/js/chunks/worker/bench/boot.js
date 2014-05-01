requirejs.config({
	baseUrl: '/js/',
	paths: {
		async: '../lib/async',
	},
});

require(["chunks/worker/bench/main", "math"], function (main, math) {
	// Make all the math convenience functions global, so you can
	// do abs(a) rather than Math.abs(a).
	merge(self, math);

	console.log("Booted successfully");

	// Executing this async should avoid
	setTimeout(main, 0);
	
	function merge(obj, newProperties) {
		for (var k in newProperties) {
			obj[k] = newProperties[k];
		}
	}
});
