//Aww... this means THREE should be in shared or something...
//So... TODO: Move this out of shared?
defineWrapper(function (
		_lib_,		async, THREE
	) {

	function Models() { };

	Models.init = function (loadedCallback) {
		var loader = new THREE.JSONLoader();
		var models = [
			'pistol',
			'shovel',
			'block',
			'stone',
		];

		async.map(models, loadModel, loadedCallback);

		function loadModel(name, done) {
			var path = 'models/' + name + '/' + name + '.js';
			loader.load(path, function (geom, mats) {
				var mat = new THREE.MeshFaceMaterial(mats);
				if (name === 'shovel') {
					shovelFix(mat.materials);
				}
				Models[name] = function () {
					return new THREE.Mesh(geom, mat);
				};
				done();
			});
		}

		function shovelFix(mats) {
			for (var i = 0; i < mats.length; i++) {
				mats[i].side = THREE.DoubleSide;
			}
		}
	};

	return Models;
});