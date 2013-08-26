//This has the same essential functions and input as Inventory, even
//if it does not use them all, this way we can insure all the 'modules'
//inside player which add functionality have the same control
//(to prevent super modules from existing which overstep their bounds,
//and to insure optional modules are properly decoupled from the player).
function HealthBars(world, camera, conn, controls) {
	var self = this;

	var BAR_MATERIAL = new THREE.MeshBasicMaterial({
		vertexColors: true
	});

	var curMeshes = [];
	function makeHPMesh(info) {
		function copy(src, dst) {
			for (var i = 0; i < src.length; i++) {
				dst[i] = src[i];
			}
		}

		var verts = [];
		verts.push(info.pos.x, info.pos.y, info.pos.z);
		verts.push(info.pos.x + 1, info.pos.y, info.pos.z);
		verts.push(info.pos.x + 0.5, info.pos.y + 1, info.pos.z);

		//verts.push(-100, -100, -100);
		//verts.push(100, 100, 100);
		//verts.push(100, 100, -100);

		var color = [];
		color.push(0.5, 0.5, 0.5);
		color.push(0.5, 0.5, 0.5);
		color.push(0.5, 0.5, 0.5);

		var index = [];
		index.push(0, 1, 2);
		index.push(2, 1, 0);

		var vertsa = new Float32Array(verts.length);
		var colora = new Float32Array(color.length);
		var indexa = new Uint16Array(index.length);
		copy(verts, vertsa);
		copy(color, colora);
		copy(index, indexa);

		var geometry = new THREE.BufferGeometry();

		geometry.offsets = [{
			start: 0,
			count: indexa.length,
			index: 0
		}];
		geometry.attributes = {
			position: {
				itemSize: 3, 
				array: vertsa,
				numItems: vertsa.length,
				needsUpdate: true
			},
			color: {
				itemSize: 3,
				array: colora,
				numItems: colora.length,
				needsUpdate: true
			},
			index: {
				itemSize: 1,
				array: indexa,
				numItems: indexa.length,
				needsUpdate: true
			}
		};
		var mesh = new THREE.Mesh(geometry, BAR_MATERIAL);

		mesh.rotation.y = 0.1;

		return mesh;
	}

	self.update = function (playerPosition, controlState) {
		curMeshes.forEach(world.removeFromScene);
		curMeshes = [];

		function makeAndAdd(info) { curMeshes.push(makeHPMesh(info)); }

		world.getEntityInfos().forEach(makeAndAdd);

		curMeshes.forEach(world.addToScene);
	}

	var aspectRatio = 1.0;
	self.resize = function () {
		aspectRatio = window.innerWidth / window.innerHeight;
	};
}