var parent = self;

console = {};
['log', 'warn', 'error'].forEach(function (type) {
	console[type] = function () {
		var args = [].slice.call(arguments);
		parent.postMessage({
			kind: 'log',
			payload: {
				type: type,
				message: args,
			},
		});
	};
});

function require(name, cb) {
	var args = [].slice.apply(arguments);
	console.log(args);
	var moduleList = self.miniRequireModules || {};
	var module = moduleList[name];
	if (!module) {
		console.warn("Warning: Module not found with name: " + name);
	}
	if (name.indexOf('workerChunkManager') !== -1) {
		console.warn("This one's for the workerChunkManager!");
		console.warn(module);
	}
	if (cb) {
		cb(module);
	}
	return module;
}
function define(name, _, ctor, extra) {
	function Path(str) {
		var self = this;
		self.pieces = str.split('/');
		self.str = function () {
			return self.pieces.join('/');
		};
		self.join = function (otherPath) {
			var otherPieces = otherPath.pieces.slice();
			while (otherPieces.length) {
				var piece = otherPieces[0];
				if (piece === '..') {
					self.pieces.pop();
					otherPieces.shift();
				} else if (piece === '.') {
					otherPieces.shift();
				} else {
					self.pieces.push(piece);
					otherPieces.shift();
				}
			}
			return self;
		};
		self.clone = function () {
			return new Path(self.str());
		};
		self.removeLast = function () {
			self.pieces = self.pieces.slice(0, -1);
			return self;
		};
	}
	var args = [].slice.apply(arguments);
	console.log(args);
	if (extra !== undefined 
		|| typeof ctor !== 'function'
		|| typeof name !== 'string') {
		throw "miniRequire only supports the inline require format. Args: " + args.toString();
	}
	function theirRequire(theirName) {
		var modulePath = new Path(name).removeLast();
		var requiredPath = new Path(theirName);
		if (theirName[0] === '.') {
			var resolvedPath = modulePath.clone().join(requiredPath);
		} else {
			var resolvedPath = requiredPath.clone();
		}
		return require(resolvedPath.str());
	}
	var module = ctor(theirRequire);
	
	var moduleList = self.miniRequireModules || {};	
	console.log(moduleList);
	console.log(name);
	console.log(module);
	moduleList[name] = module;
	self.miniRequireModules = moduleList;
}