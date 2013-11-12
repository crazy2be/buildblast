define(["shared/string"], function (string) {

// Conventient bundles of settings which you can activate
// at your leasure in the javascript console.
function __loadSettingsScheme(name) {
	if (string.startsWith(name, '!')) {
		name = string.trimStart(name, '!');
		__loadSettingsScheme("default");
	}
	
	localStorage.settingsSet = true;

	switch (name) {
	case "quentin":
		localStorage.lagInductionTime = 300;
		localStorage.thirdPerson = true;
		localStorage.viewsVisible = true;
		localStorage.showHistoryBuffers = true;
		localStorage.hpBars = true;
		return "Success!";
	case "justin":
	    localStorage.viewsVisible = true;
		localStorage.useDvorak = true;
		localStorage.mouseMoveBug = true;
		return "Success!";
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