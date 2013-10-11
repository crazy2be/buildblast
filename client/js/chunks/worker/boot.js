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
	paths: {
		math: "/js/math",
		conn: "/js/core/conn",
	},
});

require(["main"], function () {
	//No need to call anything, just including main should do it...
	console.log("Booted successfully");
	parent.postMessage({
		kind: "booted",
		payload: "success",
	});
});
