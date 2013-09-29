// I use self for other things. Parent makes
// a lot more sense anyway.
var parent = self;

importScripts("../../../../lib/requirejs/require.js");

requirejs.config({
	paths: {
		math: "/js/math",
	},
	packages: [{
		name: 'chunkManager',
		location: '',
		main: 'main',
	}],
});

require(["main"], function(console) {
	//No need to call anything, just including main should do it...

});