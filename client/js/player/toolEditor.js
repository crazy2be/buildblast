define(function(require) {

var $ = require("jquery");
/* $ Extension */ require("spectrum");
var THREE = require("THREE");
/* THREE Extension */ require("OrbitControls");

return function ToolEditor(controls) {
	var self = this;
	var isShowing = false;
	updateVisibility();

	var $container = $("#teOpenGl");
	var $color = $("#colorPicker");
	$color.spectrum({
		color: "#f00",
		preferredFormat: "hex"
	});

	function parseColor() {
		var result = new THREE.Color();
		var color = $color.spectrum('get');
		result.setRGB(color._r / 255, color._g / 255, color._b / 255);
		return result;
	}
	console.log(parseColor());

	var renderer = initRenderer();
	function initRenderer() {
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize($container.width(), $container.height());
		renderer.setClearColor(0xFF69B4);

		$container.append(renderer.domElement);
		return renderer;
	}

	var scene = new THREE.Scene();
	var ambientLight = new THREE.AmbientLight(0xFFFFFF);
	scene.add(ambientLight);

	var gridWidth = 16, gridHeight = 16, gridDepth = 32;
	var scale = 50; // world units per block
	var width = gridWidth*scale, height = gridHeight*scale, depth = gridDepth*scale;

	var origin = new THREE.Vector3(0, 0, 0);
	scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, width, 0xFF0000));
	scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, height, 0x00FF00));
	scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, depth, 0x0000FF));


	var camera = new THREE.PerspectiveCamera(90, $container.width() / $container.height(),
		1, 10000);

	camera.position.set(width * 2, height / 2, depth / 2);

	var viewControls = new THREE.OrbitControls(camera, renderer.domElement);
	viewControls.target.set(width / 2, height / 2, depth / 2);
	viewControls.enableDamping = true;
	viewControls.dampingFactor = 0.60;

	// Render the gridlines.

	var geoDark = new THREE.Geometry();
	var geoLight = new THREE.Geometry();
	var matDark = new THREE.LineBasicMaterial({color: 0xFFFFFF});
	var matLight = new THREE.LineBasicMaterial({color: 0xFFFFFF, transparent: true});
	matLight.opacity = 0.5;
	var tar, i, si;
	for (i = 0; i <= gridWidth; i++) {
		tar = geoLight;
		if (i % 4 == 0) tar = geoDark;
		si = i*scale;
		tar.vertices.push(new THREE.Vector3(si, 0, 0));
		tar.vertices.push(new THREE.Vector3(si, height, 0));
		tar.vertices.push(new THREE.Vector3(si, 0, 0));
		tar.vertices.push(new THREE.Vector3(si, 0, depth));
	}
	for (i = 0; i <= gridHeight; i++) {
		tar = geoLight;
		if (i % 4 == 0) tar = geoDark;
		si = i*scale;
		tar.vertices.push(new THREE.Vector3(0, si, 0));
		tar.vertices.push(new THREE.Vector3(width, si, 0));
		tar.vertices.push(new THREE.Vector3(0, si, 0));
		tar.vertices.push(new THREE.Vector3(0, si, depth));
	}
	for (i = 0; i <= gridDepth; i++) {
		tar = geoLight;
		if (i % 4 == 0) tar = geoDark;
		si = i*scale;
		tar.vertices.push(new THREE.Vector3(0, 0, si));
		tar.vertices.push(new THREE.Vector3(width, 0, si));
		tar.vertices.push(new THREE.Vector3(0, 0, si));
		tar.vertices.push(new THREE.Vector3(0, height, si));
	}

	var lineDark = new THREE.LineSegments(geoDark, matDark);
	var lineLight = new THREE.LineSegments(geoLight, matLight);
	scene.add(lineDark);
	scene.add(lineLight);

	// Plane test
	var planeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

	var backGeo = new THREE.PlaneGeometry(width, height);
	var back = new THREE.Mesh(backGeo, planeMat);
	back.position.x += width / 2;
	back.position.y += height / 2;
	// Need to manually update the matrix since we're not adding it to the scene.
	back.updateMatrixWorld(true);
	//scene.add(back);

	var botGeo = new THREE.PlaneGeometry(width, depth);
	var bot = new THREE.Mesh(botGeo, planeMat);
	// Rotated so the normal faces "inwards", aka towards positive y axis
	bot.rotation.x = -Math.PI / 2;
	bot.position.x += width / 2;
	bot.position.z += depth / 2;
	// Need to manually update the matrix since we're not adding it to the scene.
	bot.updateMatrixWorld(true);
	//scene.add(bot);

	var sideGeo = new THREE.PlaneGeometry(width, depth);
	var side = new THREE.Mesh(sideGeo, planeMat);
	// Rotated so the normal faces "inwards", aka towards positive x axis
	side.rotation.x = Math.PI / 2;
	side.rotation.y = Math.PI / 2;
	side.position.y += height / 2;
	side.position.z += depth / 2;
	// Need to manually update the matrix since we're not adding it to the scene.
	side.updateMatrixWorld(true);
	//scene.add(side);

	console.log(back.position, bot.position, side.position);

	// Cube ghost
	var ghostCubeGeo = new THREE.BoxGeometry(scale, scale, scale);
	var ghostCubeMat = new THREE.MeshBasicMaterial({
		color: parseColor(),
		transparent: true,
		opacity: 0.6
	});
	var ghostCube = new THREE.Mesh(ghostCubeGeo, ghostCubeMat);
	var ghostWire = new THREE.EdgesHelper(ghostCube, 0x000000);
	var voxelWire = null;
	var added = false;

	var voxels = [];

	self.render = function() {
		if (!isShowing) return;
		viewControls.update();
		ghostCube.material.color.copy(parseColor());
		renderer.render(scene, camera);
	};

	var toggleWasDown = false;
	var placeWasDown = false;
	var removeWasDown = false;
	var downGridPos;
	self.update = function(controls) {
		if (!toggleWasDown && controls.ui.toggleTools()) {
			isShowing = !isShowing;
			updateVisibility();
		}
		toggleWasDown = controls.ui.toggleTools();
		if (!isShowing) return;

		var $pos = $container.offset();
		var mouse = new THREE.Vector2(
			((controls.ui.x - $pos.left) / $container.width()) * 2 - 1,
			-((controls.ui.y - $pos.top) / $container.height()) * 2 + 1
		);

		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(voxels.concat([back, bot, side]));
		if (intersects.length > 0) {
			if (!added) {
				added = true;
				scene.add(ghostCube);
				scene.add(ghostWire);
			}
			var hit = intersects[0];
			var pos = hit.point;
			if (pos.x < 0) pos.x *= -1;
			if (pos.y < 0) pos.y *= -1;
			if (pos.z < 0) pos.z *= -1;
			ghostCube.position.copy(hit.point).add(hit.face.normal);
			ghostCube.position.divideScalar(scale).floor();
			var gridPos = ghostCube.position.clone();
			ghostCube.position.multiplyScalar(scale).addScalar(scale/2);

			var voxelIndex = voxels.indexOf(hit.object);
			if (voxelIndex >= 0) {
				scene.remove(voxelWire);
				voxelWire = new THREE.EdgesHelper(hit.object, 0x000000);
				scene.add(voxelWire);
				scene.remove(ghostWire);
			} else {
				scene.remove(voxelWire);
				scene.add(ghostWire);
			}

			if (!placeWasDown && controls.ui.leftMouse()) {
				downGridPos = gridPos;
			}
			if (placeWasDown && !controls.ui.leftMouse()
					&& downGridPos && downGridPos.equals(gridPos))
			{
				var voxel = new THREE.Mesh(ghostCubeGeo,
					new THREE.MeshBasicMaterial({color: parseColor() }));
				voxel.position.copy(ghostCube.position);
				scene.add(voxel);
				voxels.push(voxel);
			}

			var leftWasActive = placeWasDown || controls.ui.leftMouse();

			if (!leftWasActive && !removeWasDown && controls.ui.rightMouse()) {
				downGridPos = gridPos;
			}
			if (!leftWasActive && removeWasDown && !controls.ui.rightMouse()
					&& downGridPos && downGridPos.equals(gridPos))
			{
				if (voxelIndex >= 0) {
					scene.remove(hit.object);
					voxels.splice(voxelIndex, 1);
				}
			}
		} else {
			if (added) {
				added = false;
				scene.remove(ghostCube);
				scene.remove(ghostWire);
			}
			if (voxelWire) {
				scene.remove(voxelWire);
				voxelWire = null;
			}
		}
		placeWasDown = controls.ui.leftMouse();
		removeWasDown = controls.ui.rightMouse();
	};

	function updateVisibility() {
		var $elm = $("#teOpenGl");
		if (isShowing) {
			$elm.show();
			$elm.blur();
			controls.unlock();
		} else {
			$elm.hide();
			controls.lock();
		}
	}
};

});
