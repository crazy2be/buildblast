//DON'T TRUST THIS CODE! Anyone who writes javascript without semicolons is suspect...
//http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParamNames(func) {
	var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
	return result || [];
}

function isAllUpper(text) {
	return !text.match(/[a-z]/);
}

//This is okay, we already follow strict conventions on naming so there should always
//be a one to one conversion between filename and classname.
function classNameToFileName(className) {
	if(!isAllUpper(className)) {
		//First letter to lower case.
		className = className.substring(0, 1).toLowerCase() + className.substring(1);
	}

	return className;
}

function magicWrapper(fnc, callback) {
	var includes = getParamNames(fnc);

	var includePathList = [];

	var curDirectory = "";
	includes.forEach(function (includeName) {
		var noDirectory = includeName.indexOf("__") !== -1;
		if(noDirectory) {
			includeName = includeName.substring(2);
		}

		if(includeName.indexOf('_') >= 0) {
			//directory
			includeName = includeName.replace(/_/g, '/');

			//It is purely a directory
			if(includeName[includeName.length-1] === '/') {
				curDirectory = includeName;
				includePathList.push("");
				return;
			}
		}

		var fullPath = "";
		
		if(includeName.indexOf('/') === -1 && !noDirectory) {
			fullPath += curDirectory;
		}

		fullPath += classNameToFileName(includeName);
		if(fullPath.indexOf('/') === 0) {
			fullPath += ".js";
		}
		includePathList.push(fullPath);
	});

	callback(includePathList, fnc);
}

//These functions create the array of includes based on the name of your arguments.
//	underscores represent forward slashes, and every include that ends with an underscore,
//	simply sets the current directory, which is used by every include after that has no underscores.
function defineWrapper(fnc) {
	magicWrapper(fnc, define);
}

function requireWrapper(fnc) {
	magicWrapper(fnc, require);
}

requirejs.config({
	paths: {
	//For some reason this doesn't work... the documentation is totally useless on this,
	//it doesn't even explain how this is supposed to be used, but it looks like paths
	//to paths doesn't work... but it works for shims...
		'/lib/THREE.js': '/lib/THREE.min.js',
	},
	shim: {
		'/lib/THREE.js': {
			exports: 'THREE'
		}
	},
});

requireWrapper(function (
		main
	) {
	main();
});