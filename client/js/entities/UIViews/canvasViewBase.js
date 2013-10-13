//Not really needed, just somewhere to put the interface
define(function (require) {
	var UIViewBase = require("UIViewBase");
	var extends = require("core/extends");
	extends(CanvasViewBase, UIViewBase);

	//width and height given are in world coordinates!
	function CanvasViewBase(wcWidth, wcHeight, resolution) {
		var self = this;

		//Call super constructor first
		UIViewBase.call(self);

		//We probably lose some speed with this,
		//but it makes the context sensible.
		self.meshes = self.meshes.bind(self);
		self.update = self.update.bind(self);
		self.init = self.init.bind(self);

		//The higher the resolution the higher quality the mesh looks.
		resolution = resolution || 100;

		var canvasWidth = wcHeight * resolution;
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

		self.updateCanvas = function() {
			texture.needsUpdate = true;
		}

		mesh.scale.set(1/resolution, 1/resolution, 1/resolution);
		//mesh.position.set(0, 1.25, 0);

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

		self.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wcWidth, wcHeight), material);
	}
	CanvasViewBase.prototype.meshes = function () {
		return [];
	}
	CanvasViewBase.prototype.update = function (entity, clock, viewFacingPos) {
		UIViewBase.prototype.update.call(this, entity, clock, viewFacingPos);

		var ctx = this.canvas;
		ctx.clearRect(0, 0, ctx.width, ctx.height);
	}
	//Called (by the base update implementation) on the first update call.
	CanvasViewBase.prototype.init = function (entity) {
		UIViewBase.prototype.update.call(this);
	}
	return CanvasViewBase;
});