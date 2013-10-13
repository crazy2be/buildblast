define(function (require) {
	var THREE = require("THREE");

	var UIViewBase = require("./UIViewBase");
	var __extends = require("core/extends");
	var __super = UIViewBase;
	__extends(CanvasViewBase, __super);


	//width and height given are in world coordinates!
	function CanvasViewBase(wcWidth, wcHeight, resolution) {
		var self = this;

		//Call super constructor first
		__super.call(self);

		//The higher the resolution the higher quality the mesh looks.
		resolution = resolution || 100;

		var canvasWidth = wcWidth * resolution;
		var canvasHeight = wcHeight * resolution;

		//If these were prototypical functions we would need to
		//make width and height public.
		self.canvasWidth = function() {
			return canvasWidth;
		}
		self.canvasHeight = function() {
			return canvasHeight;
		}
		self.wcWidth = function() {
			return wcWidth;
		}
		self.wcHeight = function() {
			return wcHeight;
		}

		//If fixToPlayer(), then this will be the position relative
		//to the player else it will just be wc position.
		self.setWcPosition = function(pos) {
			mesh.position.set(pos.x, pos.y, pos.z);
		}

		self.lookAtWcPosition = function(pos) {
			mesh.lookAt(pos);
		}

		self.updateCanvas = function() {
			texture.needsUpdate = true;
		}

		self.PRIVATE_trackPlayerWcOffset = null;
		self.trackPlayer = function(wcOffset) {
			var offset = offset || new THREE.Vector3(0, 0, 0);
			self.PRIVATE_trackPlayerWcOffset = wcOffset;
		}

		self.PRIVATE_faceViewAxisNumbers = [];
		//Takes a string, that is "x", "y" or "z"
		//I cannot guarantee this will work well...
		self.faceViewOnAxis = function(axisName) {
			function axisNameToNumber(axisName) {
				switch(axisName) {
					case "x": return 0;
					case "y": return 1;
					case "z": return 2;
					default: throw "What is the axis: " + axisName;
				}
			}
			self.PRIVATE_faceViewAxisNumbers.push(axisNameToNumber(axisName));
		}

		var canvas = document.createElement('canvas');
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		self.canvas = canvas;

		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;

		var material = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.DoubleSide,
		});
		material.transparent = true;

		var mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvasWidth, canvasHeight), material);

		mesh.scale.set(1/resolution, 1/resolution, 1/resolution);

		self.PRIVATE_mesh = mesh;

		self.ctx = canvas.getContext('2d');
	}
	CanvasViewBase.prototype.meshes = function () {
		return [this.PRIVATE_mesh];
	}
	CanvasViewBase.prototype.update = function (entity, clock, viewFacingPos) {
		__super.prototype.update.call(this, entity, clock, viewFacingPos);

		if(this.PRIVATE_trackPlayerWcOffset) {
			this.setWcPosition(entity.pos().clone().add(
				this.PRIVATE_trackPlayerWcOffset));
		}

		//Only tested this for y, and it even messed that up sometimes...
		if(this.PRIVATE_faceViewAxisNumbers.length > 0) {
			var realFacePos = viewFacingPos.clone();
			var nonFacedAxis = {0: true, 1: true, 2: true};
			this.PRIVATE_faceViewAxisNumbers.forEach(function(axis) {
				nonFacedAxis[axis] = false;
			});
			for(var axis in nonFacedAxis) {
				if(!nonFacedAxis[axis]) continue;
				axis = parseInt(axis);
				var entityComp = entity.pos().getComponent(axis);
				realFacePos.setComponent(axis, entityComp);
			}

			this.lookAtWcPosition(realFacePos);
		}
	}
	//Called (by the base update implementation) on the first update call.
	CanvasViewBase.prototype.init = function (entity) {
		//Unneeded super call, just as a good practice
		__super.prototype.init.call(this);
	}
	return CanvasViewBase;
});