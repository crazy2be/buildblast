﻿requirejs.config({
	//We need paths because min files are annoying to handle with magicWrapper...
	paths: {
		THREE: '/lib/three.min',
		jquery: '/lib/jquery.min',
		jqueryui: '/lib/jquery-ui.min',
		jqueryWaitImgs: '/lib/jquery.waitforimages.min'
	},
	shim: {
		THREE: {
			exports: 'THREE'
		},
		jquery: {
			deps: [],
			init: function() {
				return $;
			}
		},
		jqueryui: {
			deps: ['jquery']
		},
		jqueryWaitImgs: {
			deps: ['jqueryui']
		}
	},
	packages: [{
		name: 'chunkManager',
		location: '/js/chunks',
		main: 'chunkManager',
	}],
});

define(["main", "settings", "math"], function(main, __loadSettingsScheme, mathFnc) {
	mathFnc(self);
	self.__loadSettingsScheme = __loadSettingsScheme;
	main();
});
