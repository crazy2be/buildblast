define(function (require) {
	var THREE = require("THREE");
	var Text = require("canvasLibs/text");
	var Rect = require("canvasLibs/rect");

	var CanvasViewBase = require("./CanvasViewBase");
	var __extends = require("core/extends");
	var __super = CanvasViewBase;
	__extends(HpBar, __super);

	function HpBar() {
		var self = this;

		//Call super constructor first
		__super.call(self, 2, 0.3);

		self.PRIVATE_userNameLbl = null;

		self.faceViewOnAxis("x");
		self.faceViewOnAxis("z");

		self.trackPlayer(new THREE.Vector3(0, 0.40, 0));
	}

	HpBar.prototype.fixToPlayer = function () {
		return false;
	}

	var throttle = 0;
	HpBar.prototype.update = function (entity, clock, viewFacingPos) {
		__super.prototype.update.call(this, entity, clock, viewFacingPos);

		var ctx = this.ctx;
		ctx.clearRect(0, 0, ctx.width, ctx.height);

		var ctx = this.ctx;

		//Background
		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 0, this.canvasWidth(), this.canvasHeight());

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)"; //green
		var hpPercent = (entity.health() / entity.maxHealth());
		ctx.fillRect(0, 0, this.canvasWidth() * hpPercent, this.canvasHeight());

		this.PRIVATE_userNameLbl.draw(ctx);

		this.updateCanvas();
	}

	HpBar.prototype.init = function (entity) {
		__super.prototype.init.call(this);

		//Username
		var userNameLbl = new Text();
		userNameLbl.text(entity.id());
		userNameLbl.color("white");
		userNameLbl.font("Verdana");
		userNameLbl.wrap(true);
		userNameLbl.maxFontSize(50);
		userNameLbl.align("center");
		userNameLbl.lineSpacing(1);
		userNameLbl.resize(new Rect(0, 0, this.canvasWidth(), this.canvasHeight() - 5));

		this.PRIVATE_userNameLbl = userNameLbl;
	}

	return HpBar;
});