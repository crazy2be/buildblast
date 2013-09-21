function PosHistoryBar(entity, posBuffer, clock) {
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

	makeMesh();
	function makeMesh() {
		// create a canvas element
		canvas1 = document.createElement('canvas');
		canvas1.width = 600;
		canvas1.height = 10;
		ctx = canvas1.getContext('2d');

		//Background
		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 20, 600, 80);

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
		userNameLbl.draw(ctx);

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)";//green
		var hpPercent = (entity.health() / entity.maxHealth());
		ctx.fillRect(230, 40, 350 * hpPercent, 40);

		//HP bar surrounding
		ctx.lineWidth = 4;
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.rect(230, 38, 350, 44);
		ctx.stroke();

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
		mesh1.position.set(p.x, p.y + 0.6, p.z);
		mesh1.scale.x = 1/200;
		mesh1.scale.y = 1/200;
		mesh1.scale.z = 1/200;

		var rotVec = {};
		rotVec.x = -entity.pos().x;
		rotVec.z = -entity.pos().z;

		var dirRadian = Math.atan2(rotVec.x, rotVec.z);
		mesh1.rotation.y = dirRadian;
		return mesh1;
	}

	function updateView(playerPos) {
		var viewData = posBuffer.posDebugData();

		var posViewTime = 2000;
		var posPastTime = 1500; //posViewTime - posPastTime is future view time
		var posStartTime = clock.time() - posPastTime;
		var posEndTime = clock.time() + posViewTime;

		//Kinda inefficient to loop over all the data if we only
		//really want the last bit.

		ctx.clearRect(0, 0, canvas1.width, canvas1.height);
		canvas1.width = canvas1.width;

		function posXFromTime(time) {
			return(time - posStartTime) / posViewTime * canvas1.width;
		}

		viewData.forEach(function (viewDatum) {
			if (viewDatum.time < posStartTime) return;
			if (viewDatum.time > posEndTime) return;

			var posX = posXFromTime(viewDatum.time);

			var color = viewDatum.hasAuxData ? "yellow" : "green";

			ctx.fillStyle = color;
			ctx.fillRect(posX, 0, 1, canvas1.height);
		});

		var presentX = posXFromTime(clock.time());
		ctx.fillStyle = "blue";
		ctx.fillRect(presentX, 0, 1, canvas1.height);

		// canvas contents will be used for a texture
		texture1.needsUpdate = true;

		updatePos(curPos, playerPos, true);
	}

	var curPos = entity.pos();
	function updatePos(pos, playerPos, forceChanged) {
		if (!forceChanged && pos.x == curPos.x && pos.y == curPos.y) return;

		curPos = pos;

		var p = curPos;
		mesh1.position.set(p.x, p.y + 0.16, p.z);
		mesh1.scale.x = 1 / 200;
		mesh1.scale.y = 1 / 200;
		mesh1.scale.z = 1 / 200;

		//I make an obj as I only use some components, and only use it once.
		var rotVec = {};
		rotVec.x = playerPos.x - pos.x;
		rotVec.z = playerPos.z - pos.z;

		//I feel like this is wrong is some manner... not sure why though.
		var dirRadian = Math.atan2(rotVec.x, rotVec.z);
		mesh1.rotation.y = dirRadian;
	}

	self.mesh = function() {
		return mesh1;
	}

	self.update = function (playerPos) {
		updateView(playerPos);
		updatePos(entity.pos(), playerPos);
	}
}