function Models() {};

Models.init = function(loadedCallback) {
    var loader = new THREE.JSONLoader();

    var modelsToLoad = {
        pistol: 'models/pistol/pistol.js',
        shovel: 'models/shovel/shovel.js',
        block: 'models/block/block.js',
        stone: 'models/block/stone.js',
    };

    function loadNextModel() {
        var name = getAKey(modelsToLoad);
        if (name === false) {
            loadedCallback();
            return;
        }

        var path = modelsToLoad[name];

        loader.load(path, function (geom, mats) {
            var mat = new THREE.MeshFaceMaterial(mats);
            console.log(mats);

            Models[name] = function () {
                return new THREE.Mesh(geom, mat);
            };
            delete modelsToLoad[name];
            loadNextModel();
        });
    }
    loadNextModel();

    function getAKey(obj) {
        for (var k in obj) return k;
        return false;
    }
};
