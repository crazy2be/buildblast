//Blue is clock.time(), orange is the time the entity is showing at,
//yellow is predicted, green is confirmed. Height roughly increases
//with speed, but has a minimum.

define(function (require) {
	var THREE = require("THREE");
	var Text = require("canvasLibs/text");
	var Rect = require("canvasLibs/rect");

	return function HpBar(entity) {
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

		var userNameLbl;

		makeMesh();
		function makeMesh() {
			// create a canvas element
			canvas1 = document.createElement('canvas');
			canvas1.width = 600;
			canvas1.height = 80;
			ctx = canvas1.getContext('2d');

			//Background
			ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
			ctx.fillRect(0, 20, 600, 80);

			// canvas contents will be used for a texture
			texture1 = new THREE.Texture(canvas1);
			texture1.needsUpdate = true;

			material1 = new THREE.MeshBasicMaterial({ map: texture1, side: THREE.DoubleSide });
			material1.transparent = true;

			mesh1 = new THREE.Mesh(
			new THREE.PlaneGeometry(canvas1.width, canvas1.height),
				material1
			);
			mesh1.scale.x = 1 / 200;
			mesh1.scale.y = 1 / 200;
			mesh1.scale.z = 1 / 200;

			userNameLbl = new Text()
				.contents(entity.id())
				.color("white")
				.fontFace("Verdana")
				.wrap(true)
				.maxFontSize(50)
				.align("center")
				.lineSpacing(1)
				.rect(new Rect(0, 0, canvas1.width, canvas1.height - 5));

			return mesh1;
		}

		function updateView(playerPos) {
			//Background
			ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
			ctx.fillRect(0, 0, canvas1.width, canvas1.height);

			//HP bar and fill
			ctx.fillStyle = "rgba(135, 206, 46, 1)"; //green
			var hpPercent = (entity.health() / entity.maxHealth());
			ctx.fillRect(0, 0, canvas1.width * hpPercent, canvas1.height);

			userNameLbl.contents(entity.id());
			userNameLbl.draw(ctx);

			// canvas contents will be used for a texture
			texture1.needsUpdate = true;

			updatePos(curPos, playerPos, true);
		}

		var curPos = entity.pos();
		function updatePos(pos, playerPos, forceChanged) {
			if (!forceChanged && pos.x == curPos.x && pos.y == curPos.y) return;

			curPos = pos;

			var p = curPos;
			mesh1.position.set(p.x, p.y + 0.53, p.z);

			//I make an obj as I only use some components, and only use it once.
			var rotVec = {};
			rotVec.x = playerPos.x - pos.x;
			rotVec.z = playerPos.z - pos.z;

			//I feel like this is wrong is some manner... not sure why though.
			var dirRadian = Math.atan2(rotVec.x, rotVec.z);
			mesh1.rotation.y = dirRadian;
		}

		self.mesh = function () {
			return mesh1;
		}

		self.update = function (dt, playerPos) {
			updateView(playerPos);
			if (!entity.pos()) {
				debugger;
				var test = entity.pos();
			}
			updatePos(entity.pos(), playerPos);
		}
	}
});