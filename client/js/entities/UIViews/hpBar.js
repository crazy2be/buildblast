define(function (require) {

var THREE = require("THREE");
var Text = require("canvasLibs/text");
var Rect = require("canvasLibs/rect");

// Could be used for various types of bars or canvases
// we want to have in the scene if somebody wants to make
// it generic.
return function HpBar() {
	var self = this;
	var canvas = document.createElement('canvas');
	canvas.width = 200;
	canvas.height = 30;
	var ctx = canvas.getContext('2d');

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var material = new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide
	});
	material.transparent = true;

	var mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(canvas.width, canvas.height),
		material);

	mesh.scale.set(1/100, 1/100, 1/100);
	mesh.position.set(0, 1.35, 0);

	var userNameLbl;

	var inited = false;
	function init(entity) {
		if(inited) return;
		inited = true;

		//Username
		userNameLbl = new Text();
		userNameLbl.text(entity.id());
		userNameLbl.color("white");
		userNameLbl.font("Verdana");
		userNameLbl.wrap(true);
		userNameLbl.maxFontSize(50);
		userNameLbl.align("center");
		userNameLbl.lineSpacing(1);
		userNameLbl.resize(new Rect(0, 0, canvas.width, canvas.height - 5));
	}

	self.update = function (entity, clock) {
		init(entity);

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//Background
		ctx.fillStyle = "rgba(87, 87, 87, 0.6)"; //grey
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		//HP bar and fill
		ctx.fillStyle = "rgba(135, 206, 46, 1)";//green
		var hpPercent = (entity.health() / entity.maxHealth());
		ctx.fillRect(0, 0, canvas.width * hpPercent, canvas.height);

		userNameLbl.draw(ctx);

		//mesh.rotation = entity.rotation();



		texture.needsUpdate = true;
	};

	self.meshes = function () {
		return [mesh];
	};
}
});