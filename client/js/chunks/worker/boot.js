// I use self for other things. Parent makes
// a lot more sense anyway.
var parent = self;

importScripts("../../../../lib/requirejs/require.js");

requirejs.config({
	packages: [{
		name: 'chunkManager',
		location: '',
		main: 'main',
	}],
});

require(["main"], function(main) {
	main();
});