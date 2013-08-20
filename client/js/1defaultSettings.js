//Name starts with 1 so it is loaded first (kindaof a hack, but its
//really important for settings to be loaded first!)

//Global settings, try to keep the variables only 1 level deep, don't nest stuff.

var settings = {};

//To make it easy to find settings all settings should be in here, but set to false.
//A locally stored localSettings.js file sets the settings too

//Makes mining destroy a large portion of the map, making it more varied for testing purposes.
settings.destroyMapOnMine = true;

settings.testingMesher = false;