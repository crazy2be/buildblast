// This file benchmarks the mesh generation code.
// run it with
//	node node-main.js
// and speed up all the meshing!

var fs = require('fs');

// Hacks to mock require. Yay dependency injection!
function requireJS(relativePath) {
	var path = '../../../' + relativePath + '.js';
	var code = fs.readFileSync(path);
	var lastDefine = null;
	function define(ctor) {
		lastDefine = ctor;
	}
	eval(code.toString());
	var module = lastDefine(requireJS);
	return module;
}

var main = requireJS('chunks/worker/bench/main');
main();
