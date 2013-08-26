//This has the same essential functions and input as Inventory, even
//if it does not use them all, this way we can insure all the 'modules'
//inside player which add functionality have the same control
//(to prevent super modules from existing which overstep their bounds,
//and to insure optional modules are properly decoupled from the player).
function HealthBars(world, camera, conn, controls) {
	var self = this;

	var BAR_MATERIAL = new THREE.MeshBasicMaterial({
		vertexColors: true,
	});

	var curMeshes = [];
	function makeHPMesh(info) {
		var attributes = {};

		var verts = []


		var geometry = {};
		var mesh;
	}

	self.update = function (playerPosition, controlState) {
		curMeshes.forEach(world.removeFromScene);

		function makeAndAdd(info) { curMeshes.push(makeHPMesh(info)); }

		world.getEntityInfos().forEach(makeAndAdd);

		curMeshes.forEach(world.addToScene);
	}

	var aspectRatio = 1.0;
	self.resize = function () {
		aspectRatio = window.innerWidth / window.innerHeight;
	};
}