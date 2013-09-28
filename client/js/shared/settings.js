//Yes I made this file, and no I am not removing it.
//	Our settings will likely always be stored entirely
//	in local storage, so the way we load settings is
//	appropriate. Named settings are appropriate too,
//	as there is no point in having a scheme which no
//	ones uses, and so the only viable schemes currently
//	are the ones exactly as we want them (so ones that
//	exit just for us).

define([], function () {
	return {
		loadSettings: loadSettings
	}

	function loadSettings() {
		if (!localStorage.scheme) return;

		switch (localStorage.scheme) {
			case "quentin": 
				{
					localStorage.viewsVisible = true;
					localStorage.lag = 300;
					localStorage.thirdPerson = true;
					localStorage.posHistoryBar = true;
					break;
				}
			default: 
				{
					console.warn("No clue what the settings scheme: '" + localStorage.scheme + "' means?")
					break;
				}
		}
	}
});