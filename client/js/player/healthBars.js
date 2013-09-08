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
		canvas1.width = 600;
		canvas1.height = 120;
		var ctx = canvas1.getContext('2d');

		//Background
		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 20, 600, 80);

		//Username
		//ctx.fillStyle = "white";
		//ctx.font = "20px Verdana";
		//ctx.fillText(info.id, 20, 36);
		var userNameLbl = new Text();
		userNameLbl.text(info.id);
		userNameLbl.color("white");
		userNameLbl.font("Verdana");
		userNameLbl.wrap(true);
		userNameLbl.maxFontSize(50);
		userNameLbl.align("center");
		userNameLbl.lineSpacing(1);
		//userNameLbl.optimalWidth(40);
		//userNameLbl.optimalHeight(28);
		userNameLbl.resize(new Rect(20, 25, 170, 70));
		userNameLbl.draw(ctx);

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)";//green
		var hpPercent = (info.hp / info.maxHP);
		ctx.fillRect(230, 40, 350 * hpPercent, 40);

		//HP bar surrounding
		ctx.lineWidth = 4;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.rect(230, 38, 350, 44);
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
		mesh1.scale.x = 1/200;
		mesh1.scale.y = 1/200;
		mesh1.scale.z = 1/200;

		var rotVec = {};
		rotVec.x = -info.pos.x + camera.position.x;
		rotVec.y = -info.pos.z + camera.position.z;

		//I fell like this is wrong is some manner... not sure why though.
		var dirRadian = Math.atan2(rotVec.x, rotVec.y);
		mesh1.rotation.y = dirRadian;
		//mesh1.rotation.x = 0.5;//Math.sin(dirRadian);
		return mesh1;
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