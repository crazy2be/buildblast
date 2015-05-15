requirejs.config({
	baseUrl: '/js/',
	// On slow connections, THREE and jQuery can cause timeouts with the
	// default settings.
	waitSeconds: 30,
	//We need paths because min files are annoying to handle with magicWrapper...
	paths: {
		THREE: '../lib/three',
		jquery: '../lib/jquery.min',
		jqueryui: '../lib/jquery-ui.min',
		jqueryWaitImgs: '../lib/jquery.waitforimages.min',
		async: '../lib/async'
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
	}
});

require(["main", "settings", "math", "fatalError", "debug", "THREE"], function(main, __loadSettingsScheme, math, fatalError, debug, THREE) {
	THREE.DVector3 = debug.DVector3;

	window.onerror = function (msg, url, lineno) {
		fatalError({
			message: msg,
			filename: url,
			lineno: lineno
		});
	};

	// Make all the math convenience functions global, so you can
	// do abs(a) rather than Math.abs(a).
	merge(window, math);
	window.__loadSettingsScheme = __loadSettingsScheme;
	main();
	
	function merge(obj, newProperties) {
		for (var k in newProperties) {
			obj[k] = newProperties[k];
		}
	}
});

