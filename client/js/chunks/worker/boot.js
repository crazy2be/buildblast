// I use self for other things. Parent makes
// a lot more sense anyway.
var parent = self;

console = {};
['log', 'warn', 'error'].forEach(function (type) {
	console[type] = function () {
		var args = [].slice.call(arguments);
		parent.postMessage({
			kind: 'log',
			payload: {
				type: type,
				message: args,
			},
		});
	};
});

importScripts("/lib/require.js");

requirejs.config({
	baseUrl: '/js/',
	paths: {
		THREE: '../lib/three',
		async: '../lib/async',
		proto: "empty:"
	},
	shim: {
		THREE: {
			exports: 'THREE'
		}
	}
});

require(["chunks/worker/main", "math", "THREE"], function (main, math, THREE) {
	// Make all the math convenience functions global, so you can
	// do abs(a) rather than Math.abs(a).
	merge(self, math);

	// No need to call anything, just including main should do it...
	console.log("Booted successfully");
	parent.postMessage({
		kind: "booted",
		payload: "success",
	});
	
	function merge(obj, newProperties) {
		for (var k in newProperties) {
			obj[k] = newProperties[k];
		}
	}
});
