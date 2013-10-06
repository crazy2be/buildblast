// Conventient bundles of settings which you can activate
// at your leasure in the javascript console.
function __loadSettingScheme(name) {
	switch (name) {
	case "quentin":
		localStorage.viewsVisible = true;
		localStorage.lag = 300;
		localStorage.thirdPerson = true;
		localStorage.posHistoryBar = true;
		return "Success!";
	case "justin":
		localStorage.useDvorak = true;
		localStorage.mouseMoveBug = true;
		return "Success!";
	default:
		return "No clue what the settings scheme: '" + localStorage.scheme + "' means?";
	}
}
