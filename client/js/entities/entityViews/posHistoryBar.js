//Blue is clock.time(), orange is the time the entity is showing at,
//yellow is predicted, green is confirmed. Height roughly increases
//with speed, but has a minimum.

define(function (require) {
	return function PosHistoryBar(entity, posBuffer, clock) {
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
			canvas1.height = 20;
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
			var p = entity.pos();
			console.log(entity.posState());
			mesh1.position.set(p.x, p.y + 0.6, p.z);
			mesh1.scale.x = 1 / 200;
			mesh1.scale.y = 1 / 200;
			mesh1.scale.z = 1 / 200;

			var rotVec = {};
			rotVec.x = -entity.pos().x;
			rotVec.z = -entity.pos().z;

			var dirRadian = Math.atan2(rotVec.x, rotVec.z);
			mesh1.rotation.y = dirRadian;
			return mesh1;
		}

		function updateView(playerPos) {
			var viewData = posBuffer.posDebugData();

			var posPastTime = 1500;

			if (!entity.isLagInduced()) {
				//Extend buffer is lag induction is too much.
				posPastTime = Math.max(posPastTime, clock.time() - clock.entityTime())
			}

			var posViewTime = posPastTime + 500;

			var posStartTime = clock.time() - posPastTime;
			var posEndTime = clock.time() + posViewTime;

			//Kinda inefficient to loop over all the data if we only
			//really want the last bit.

			ctx.clearRect(0, 0, canvas1.width, canvas1.height);
			canvas1.width = canvas1.width;

			function posXFromTime(time) {
				return (time - posStartTime) / posViewTime * canvas1.width;
			}

			var barWidth = 2;

			var lastPos = new THREE.Vector3(0, 0, 0);
			viewData.forEach(function (viewDatum) {
				if (viewDatum.time < posStartTime) return;
				if (viewDatum.time > posEndTime) return;

				var posX = posXFromTime(viewDatum.time);

				var color = viewDatum.hasAuxData ? "yellow" : "green";

				var changeFromLast = viewDatum.pos.clone().sub(lastPos).length();
				lastPos = viewDatum.pos;

				var delta = Math.min(1, changeFromLast * 10);

				var barHeight = canvas1.height / 2 + (canvas1.height / 2) * delta;

				ctx.fillStyle = color;
				ctx.fillRect(posX, canvas1.height - barHeight, barWidth, canvas1.height);
			});

			//Without lag compensation our present time and entity time are equal.
			if (!entity.isLagInduced()) {
				var presentX = posXFromTime(clock.time());
				var entityX = presentX; //The player is displayed at the present time

				ctx.fillStyle = "blue";
				ctx.fillRect(presentX, 0, barWidth, canvas1.height / 2);

				ctx.fillStyle = "orange";
				ctx.fillRect(entityX, canvas1.height / 2, barWidth, canvas1.height / 2);
			} else {
				var presentX = posXFromTime(clock.time());
				var entityX = posXFromTime(clock.entityTime());

				ctx.fillStyle = "blue";
				ctx.fillRect(presentX, 0, barWidth, canvas1.height);

				ctx.fillStyle = "orange";
				ctx.fillRect(entityX, 0, barWidth, canvas1.height);
			}

			// canvas contents will be used for a texture
			texture1.needsUpdate = true;

			updatePos(curPos, playerPos, true);
		}

		var curPos = entity.pos();
		function updatePos(pos, playerPos, forceChanged) {
			if (!forceChanged && pos.x == curPos.x && pos.y == curPos.y) return;

			curPos = pos;

			var p = curPos;
			mesh1.position.set(p.x, p.y + 0.26, p.z);
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