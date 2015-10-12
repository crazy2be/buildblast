define(function(require) {

var $ = require("jquery");
var THREE = require("THREE");

return function ToolEditor() {
	var self = this;

	var $container = $("#teOpenGl");

	var renderer = initRenderer();
	function initRenderer() {
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize($container.width(), $container.height());

		$container.append(renderer.domElement);
		return renderer;
	}

	var camera = new THREE.PerspectiveCamera(90, $container.width() / $container.height(), 0.01, 400);
	var scene = new THREE.Scene();
	var ambientLight = new THREE.AmbientLight(0xFFFFFF);
	scene.add(ambientLight);

	self.render = function() {
		renderer.render(scene, camera);
	};

	self.update = function(dt) {
		// DOIT: Do stuff
	};
};

});