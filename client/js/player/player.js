var PLAYER_EYE_HEIGHT = 1.6;
var PLAYER_HEIGHT = 1.75;
var PLAYER_BODY_HEIGHT = 1.3;
var PLAYER_DIST_CENTER_EYE = PLAYER_EYE_HEIGHT - PLAYER_BODY_HEIGHT/2;
var PLAYER_HALF_EXTENTS = new THREE.Vector3(
    0.2,
    PLAYER_HEIGHT / 2,
    0.2
);
var PLAYER_CENTER_OFFSET = new THREE.Vector3(
    0,
    -PLAYER_DIST_CENTER_EYE,
    0
);

function Player(name, world, conn, controls) {
    var self = this;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1024);

    var buildInventory = new BuildInventory(world, camera);
    var blastInventory = new BlastInventory(world, camera);
    var prediction = new PlayerPrediction(world, conn, camera.position);

    self.resize = function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        buildInventory.resize();
        blastInventory.resize();
    };

    self.pos = function () {
        return camera.position.clone();
    }

    self.name = function () {
        return name;
    }

    self.id = function() {
        return "player-" + name;
    }

    self.render = function (renderer, scene) {
        renderer.render(scene, camera);
    };

    self.update = function (dt) {
        var c = controls.sample();

        var p = prediction.update(c);
        camera.position.set(p.x, p.y, p.z);

        doLook(camera, camera.position, c);
        buildInventory.update(p, c);
        blastInventory.update(p, c);
    };

    function doLook(camera, p, c) {
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        camera.lookAt(target);
    }
};
