var PLAYER_HEIGHT = 1.75;
var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_HALF_EXTENTS = new THREE.Vector3(
    0.2,
    PLAYER_HEIGHT / 2,
    0.2
);
var PLAYER_CENTER_OFFSET = new THREE.Vector3(
    0,
    PLAYER_BODY_HEIGHT/2 - PLAYER_EYE_HEIGHT,
    0
);

function Player(name, world, conn, controls) {
    var self = this;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);
    var flashLight = new THREE.SpotLight(0xFFFFFF);
    world.addToScene(camera);
    world.addToScene(flashLight);
    flashLight.position = camera.position;
    flashLight.castShadow = true;

    flashLight.shadowMapWidth = 1024;
    flashLight.shadowMapHeight = 1024;

    flashLight.intensity = 0.8;
    flashLight.distance = 25;
    flashLight.exponent = 20;
    flashLight.shadowCameraNear = 0.1;
    flashLight.shadowCameraFar = 50;
    flashLight.shadowCameraFov = 10;
    camera.add(flashLight.target);
    flashLight.target.position.set(0, 0, -1);

    var inventory = new Inventory(world, camera, conn, controls);
    var prediction = new PlayerPrediction(world, conn, camera.position);

    self.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        inventory.resize();
    };

    self.pos = function () {
        return camera.position.clone();
    };

    self.name = function () {
        return name;
    };

    self.id = function() {
        return "player-" + name;
    };

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };

    self.update = function (dt) {
        var c = controls.sample();

        var p = prediction.update(c);
        camera.position.set(p.x, p.y, p.z);

        doLook(camera, camera.position, c);
        inventory.update(p, c);
    };

    function doLook(camera, p, c) {
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        camera.lookAt(target);
    }
};
