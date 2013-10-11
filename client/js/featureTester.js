define([], function () {
return function FeatureTester() {
	var self = this;
	var tests;

	function hasWebGL() {
		try {
			if (!window.WebGLRenderingContext) {
				return false;
			}
			var canvas = document.createElement('canvas');
			var gl = canvas.getContext('experimental-webgl');
			if (!gl) return false;
		} catch (e) {
			return false;
		}
		return true;
	}

	function hasPointerLock() {
		if ('pointerLockElement' in document) return true;
		else if ('mozPointerLockElement' in document) return true;
		else if ('webkitPointerLockElement' in document) return true;
		else return false;
	}

	self.run = function () {
		tests = {};
		tests.webgl = hasWebGL();
		tests.workers = !!window.Worker;
		tests.pointerLock = hasPointerLock();
	};

	self.pass = function () {
		if (!tests) throw Error("You need to call FeatureTester.run() before checking the results of .pass()");
		for (var k in tests) {
			if (tests[k] !== true) {
				return false;
			}
		}
		return true;
	};

	self.errors = function () {
		var errors = document.createElement('div');
		errors.id = 'unsupported-error';
		if (!tests.webgl) {
			var elm = document.createElement('p');
			elm.innerHTML = window.WebGLRenderingContext ? [
			'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
			'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
		].join('\n') : [
			'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
			'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
		].join('\n');
			errors.appendChild(elm);
		}
		if (!tests.workers) {
			var elm = document.createElement('p');
			elm.innerHTML = "Your browser does not seem to support Web Workers.";
			errors.appendChild(elm);
		}
		if (!tests.pointerLock) {
			var elm = document.createElement('p');
			elm.innerHTML = "Your browser does not seem to support the pointer lock API.";
			errors.appendChild(elm);
		}
		var elm = document.createElement('p');
		elm.innerHTML = "You should probably just upgrade to <a href='http://www.google.com/chrome/'>Google Chrome</a>.";
		errors.appendChild(elm);
		return errors;
	};
};
});
