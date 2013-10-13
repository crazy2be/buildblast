define(function (require) {
	var THREE = require("THREE");
	var Text = require("canvasLibs/text");
	var Rect = require("canvasLibs/rect");
	var DIR = require("geom/direction");

	var CanvasViewBase = require("./CanvasViewBase");
	var __extends = require("core/extends");
	var __super = CanvasViewBase;
	__extends(EntityBarObj, __super);

	// Could be used for various types of bars or canvases
	// we want to have in the scene if somebody wants to make
	// it generic.
	function EntityBarObj(drawFunc) {
		var self = this;

		//Call super constructor first
		if (localStorage.hpBars) {
			__super.call(self, 2, 0.1);
		} else {
			__super.call(self, 2, 0.3);
		}

		self.PRIVATE_drawFunc = drawFunc;

		self.faceViewOnAxis("x");
		self.faceViewOnAxis("z");

		var playerOffset = localStorage.hpBars ? 
			new THREE.Vector3(0, 0.20, 0) :
			new THREE.Vector3(0, 0.40, 0);

		self.trackPlayer(playerOffset);
	}

	EntityBarObj.prototype.fixToPlayer = function () {
		return false;
	}

	var throttle = 0;
	EntityBarObj.prototype.update = function (entity, clock, viewFacingPos) {
		__super.prototype.update.call(this, entity, clock, viewFacingPos);

		var ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());
		this.PRIVATE_drawFunc(ctx, clock.entityTime(), this.canvasWidth(), this.canvasHeight());

		this.updateCanvas();
	}

	return EntityBarObj;
});