//This has the same essential functions and input as Inventory, even
//if it does not use them all, this way we can insure all the 'modules'
//inside player which add functionality have the same control
//(to prevent super modules from existing which overstep their bounds,
//and to insure optional modules are properly decoupled from the player).
function HealthBars(world, camera, conn, controls) {
	var self = this;

	var throttle = 0;

	var BAR_MATERIAL = new THREE.MeshBasicMaterial({
		vertexColors: true
	});

	var curMeshes = [];
	function makeHPMesh(info, controlState) {
		// create a canvas element
		var canvas1 = document.createElement('canvas');
		canvas1.width = 300;
		canvas1.height = 60;
		var ctx = canvas1.getContext('2d');

		//Background
		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 10, 300, 40);

		//Username
		ctx.fillStyle = "white";
		ctx.font = "20px Verdana";
		ctx.fillText(info.id, 20, 36);

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)";//green
		var hpPercent = (info.hp / info.maxHP);
		ctx.fillRect(90, 20, 200 * hpPercent, 20);

		//HP bar surrounding
		ctx.lineWidth = 2;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.rect(90, 19, 200, 22);
		ctx.stroke();

		// canvas contents will be used for a texture
		var texture1 = new THREE.Texture(canvas1);
		texture1.needsUpdate = true;

		var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
		material1.transparent = true;

		var mesh1 = new THREE.Mesh(
			new THREE.PlaneGeometry(canvas1.width, canvas1.height),
			material1
		);
		var p = info.pos;
		mesh1.position.set(p.x, p.y + 0.4, p.z);
		mesh1.scale.x = 1/100;
		mesh1.scale.y = 1/100;
		mesh1.scale.z = 1/100;

		var rotVec = {};
		rotVec.x = -info.pos.x + camera.position.x;
		rotVec.y = -info.pos.z + camera.position.z;

		var dirRadian = Math.atan2(rotVec.x, rotVec.y);

		mesh1.rotation.y = dirRadian;
		//mesh1.rotation.x = 0.5;//Math.sin(dirRadian);
		return mesh1;


		function copy(src, dst) {
			for (var i = 0; i < src.length; i++) {
				dst[i] = src[i];
			}
		}

		//2D rotation:
		function setRotationAroundOrigin(point, radian) {
			var curRotation = Math.atan2(point.x, point.y);
			var newRotation = curRotation + radian;

			var xFactor = Math.cos(newRotation);
			var yFactor = Math.sin(newRotation);

			var curMag = Math.sqrt(point.x * point.x + point.y * point.y);

			point.x = curMag * xFactor;
			point.y = curMag * yFactor;
		}

		var verts = [];
		verts.push(-1, -1, 0);
		verts.push(+1, -1, 0);
		verts.push(+1, +1, 0);

		verts.push(+1, +1, 0);
		verts.push(-1, +1, 0);
		verts.push(-1, -1, 0);

		//var cameraDirectionVec = camera.rotation.clone();
		//Not pointing where the camera is pointing, but pointing
		//to the actual camera!
		var rotVec = {};
		rotVec.x = -info.pos.x + camera.position.x;
		rotVec.y = -info.pos.z + camera.position.z;

		var dirRadian = Math.atan2(rotVec.y, rotVec.x);

		if(throttle++ % 1001 == 0) {
			console.log(dirRadian);
		}
		for(var ix = 0; ix < verts.length; ix += 3){
			var p = {x: verts[ix], y: verts[ix + 2]};
			setRotationAroundOrigin(p, dirRadian);
			verts[ix] = p.x;
			verts[ix + 2] = p.y;

			verts[ix] += info.pos.x;
			verts[ix + 1] += info.pos.y;
			verts[ix + 2] += info.pos.z;
		}

		//verts.push(-100, -100, -100);
		//verts.push(100, 100, 100);
		//verts.push(100, 100, -100);

		var color = [];
		for(var ix = 0; ix < verts.length; ix++) {
			color[ix] =  (1 + ix) * 17 % 19 / 19;
		}

		var index = [];
		for(var i = 0; i < verts.length; i += 9) {
			var ix = i / 3;
			index.push(ix, ix + 1, ix + 2);
			index.push(ix + 2, ix + 1, ix);
		}

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

		return mesh;
	}

	self.update = function (playerPosition, controlState) {
		curMeshes.forEach(world.removeFromScene);
		curMeshes = [];

		function makeAndAdd(info) { curMeshes.push(makeHPMesh(info, controlState)); }

		world.getEntityInfos().forEach(makeAndAdd);

		curMeshes.forEach(world.addToScene);
	}

	var aspectRatio = 1.0;
	self.resize = function () {
		aspectRatio = window.innerWidth / window.innerHeight;
	};
}