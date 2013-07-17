//Name starts with 1 so it is loaded first (kindaof a hack, but its
//really important for settings to be loaded first!)

//Global settings, try to keep the variables only 1 level deep, don't nest stuff.

if (settings === undefined) {
    throw "You must include defaultSettings.js before localSettings.js!";
}

//To make it easy to find settings put all settings in defaultSettings, but set to them to false false.
settings.destroyMapOnMine = true;
settings.showGeometryGraph = true;
settings.greedyMesh = true;