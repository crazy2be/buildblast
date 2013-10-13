define(function (require) {
	var THREE = require("THREE");

	var CanvasViewBase = require("./CanvasViewBase");
	var __extends = require("core/extends");
	var __super = CanvasViewBase;
	__extends(EntityBar, __super);

	function EntityBar(drawFunc) {
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

	EntityBar.prototype.fixToPlayer = function () {
		return false;
	}

	var throttle = 0;
	EntityBar.prototype.update = function (entity, clock, viewFacingPos) {
		__super.prototype.update.call(this, entity, clock, viewFacingPos);

		var ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());
		this.PRIVATE_drawFunc(ctx, clock.entityTime(), this.canvasWidth(), this.canvasHeight());

		this.updateCanvas();
	}

	return EntityBar;
});