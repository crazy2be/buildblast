define(function () {
	// Conventient bundles of settings which you can activate
	// at your leasure in the javascript console.
	function __loadSettingsScheme(name) {
		switch (name) {
			case "quentin":
				localStorage.lagInductionTime = 300;
				localStorage.thirdPerson = true;
				localStorage.showHistoryBuffers = true;
				localStorage.hpBars = true;
				return "Success!";
			case "justin":
				localStorage.useDvorak = true;
				localStorage.mouseMoveBug = true;
				return "Success!";
			case undefined:
			case "default":
				for (var k in localStorage) {
					// Can't use = false, because it gets
					// serialized as "false" in localStorage,
					// which is thruthy to JavaScript.
					delete localStorage[k];
				}
				return "Success!";
			default:
				return "No clue what the settings scheme: '" + name + "' means?";
		}
	}
	return __loadSettingsScheme;
});
