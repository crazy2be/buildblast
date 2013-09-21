//TODO: Abstract this out into a "CanvasMesh" object,
//	so the only code in here is the stuff which ends up
//	drawing to the canvas.
function HealthBar(entity) {
	var self = this;

	var BAR_MATERIAL = new THREE.MeshBasicMaterial({
		vertexColors: true
	});

	var canvas1;
	var ctx;
	var userNameLbl;
	var texture1;
	var material1;
	var mesh1;

	makeHPMesh();
	function makeHPMesh() {
		// create a canvas element
		canvas1 = document.createElement('canvas');
		canvas1.width = 600;
		canvas1.height = 120;
		ctx = canvas1.getContext('2d');

		//Username
		userNameLbl = new Text();
		userNameLbl.text(entity.id());
		userNameLbl.color("white");
		userNameLbl.font("Verdana");
		userNameLbl.wrap(true);
		userNameLbl.maxFontSize(50);
		userNameLbl.align("center");
		userNameLbl.lineSpacing(1);
		userNameLbl.resize(new Rect(20, 25, 170, 70));

		// canvas contents will be used for a texture
		texture1 = new THREE.Texture(canvas1);
		texture1.needsUpdate = true;

		material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
		material1.transparent = true;

		mesh1 = new THREE.Mesh(
			new THREE.PlaneGeometry(canvas1.width, canvas1.height),
			material1
		);
		var p = entity.pos();
		mesh1.position.set(p.x, p.y + 0.4, p.z);
		mesh1.scale.x = 1/200;
		mesh1.scale.y = 1/200;
		mesh1.scale.z = 1/200;

		//Don't make a vector, as I am only using some components
		var rotVec = {};
		rotVec.x = -entity.pos().x;
		rotVec.z = -entity.pos().z;

		var dirRadian = Math.atan2(rotVec.x, rotVec.z);
		mesh1.rotation.y = dirRadian;
		return mesh1;
	}

	var curHP = entity.health();
	function updateHP(newHP, playerPos) {
		if(curHP == newHP) return;
		curHP = newHP;

		ctx.clearRect(0, 0, canvas1.width, canvas1.height);
		canvas1.width = canvas1.width;

		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 20, 600, 80);

		//Username
		userNameLbl.draw(ctx);

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)";//green
		var hpPercent = (curHP / entity.maxHealth());
		ctx.fillRect(230, 40, 350 * hpPercent, 40);

		//HP bar surrounding
		ctx.lineWidth = 4;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.rect(230, 38, 350, 44);
		ctx.stroke();

		// canvas contents will be used for a texture
		texture1.needsUpdate = true;

		updatePos(curPos, playerPos, true);
	}

	var curPos = entity.pos();
	function updatePos(pos, playerPos, hpChanged) {
		//TODO: This cache code doesn't work, fix it.
		//if (!hpChanged && pos.x == curPos.x && pos.y == curPos.y) return;

		curPos = pos;

		var p = curPos;
		mesh1.position.set(p.x, p.y + 0.4, p.z);
		mesh1.scale.x = 1 / 200;
		mesh1.scale.y = 1 / 200;
		mesh1.scale.z = 1 / 200;

		//I make an obj as I only use some components, and only use it once.
		var rotVec = {};
		rotVec.x = playerPos.x - pos.x;
		rotVec.z = playerPos.z - pos.z;

		var dirRadian = Math.atan2(rotVec.x, rotVec.z);
		mesh1.rotation.y = dirRadian;
	}

	self.update = function (playerPos) {
		updateHP(entity.health(), playerPos);
		updatePos(entity.pos(), playerPos);
	}

	self.mesh = function() {
		return mesh1;
	}
}