requirejs.config({
	//We need paths because min files are annoying to handle with magicWrapper...
	paths: {
		THREE: '/lib/THREE.min',
	},
	//We need shims independently of the min problem.
	shim: {
		THREE: {
			exports: 'THREE'
		}
	},
	packages: [{
		name: 'chunkManager',
		location: '/js/chunks',
		main: 'chunkManager',
	}],
});

require(["main"], function(main) {
	main();
});