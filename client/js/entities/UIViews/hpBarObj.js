define(function (require) {
	var THREE = require("THREE");
	var Text = require("canvasLibs/text");
	var Rect = require("canvasLibs/rect");
	var DIR = require("geom/direction");

	var CanvasViewBase = require("./CanvasViewBase");
	var __extends = require("core/extends");
	var __super = CanvasViewBase;
	__extends(HpBarObj, __super);

	// Could be used for various types of bars or canvases
	// we want to have in the scene if somebody wants to make
	// it generic.
	function HpBarObj() {
		var self = this;

		//Call super constructor first
		__super.call(self, 2, 0.3);

		self.PRIVATE_userNameLbl = null;
	}

	HpBarObj.prototype.fixToPlayer = function () {
		return false;
	}

	var throttle = 0;
	HpBarObj.prototype.update = function (entity, clock, viewFacingPos) {
		__super.prototype.update.call(this, entity, clock, viewFacingPos);

		this.setWcPosition(entity.pos().clone().add(new THREE.Vector3(0, 0.40, 0)));

		var barFacePos = viewFacingPos.clone();
		barFacePos.y = entity.pos().y;

		this.lookAtWcPosition(barFacePos);


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

	HpBarObj.prototype.init = function (entity) {
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

	return HpBarObj;
});