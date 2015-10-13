define(function() {

return function Controls(elm) {
	// Key codes for a bunch of the keys we need. Need more
	// keys or these keycodes aren't working for you?
	// Head over to http://whatthekeycode.com/ to find out the
	// codes for the keys you want to add.
	var Keys = {
		W: 87,
		A: 65,
		S: 83,
		D: 68,
		Q: 81,
		E: 69,
		C: 67,
		F: 70,
		J: 74,
		O: 79,

		Left: 37,
		Up: 38,
		Right: 39,
		Down: 40,

		Space: 32,
		Enter: 13,

		Tab: 9,

		One: 49,
		Two: 50,
		Three: 51,

		Comma: 188,

		Semicolon: 186,
		Period: 190,

		Ampersand: 55,
		LeftSquareBraket: 219,
		RightCurlyBraket: 221,
	};

	var MouseButtons = {
		Left: 0,
		Middle: 1,
		Right: 2,
	};

	// Action mappings for in game controls

	var ActionMasks = {
		forward:       1 << 0,
		left:          1 << 1,
		right:         1 << 2,
		back:          1 << 3,
		jump:          1 << 4,
		activateLeft:  1 << 5,
		activateRight: 1 << 6
	};

	var ActionMappingsBase = {
		forward: [Keys.Up],
		left: [Keys.Left],
		right: [Keys.Right],
		back: [Keys.Down],
		jump: [Keys.Space],

		activateLeft: [MouseButtons.Left],
		activateRight: [MouseButtons.Right]
	};

	var ActionMappingsQwerty = {
		forward: [Keys.W],
		left: [Keys.A],
		right: [Keys.D],
		back: [Keys.S],

		toggleBag: [Keys.C],
		toggleTools: [Keys.F],

		swapLeft: [Keys.Q],
		swapRight: [Keys.E]
	};

	var ActionMappingsDvorak = {
		forward: [Keys.Comma],
		left: [Keys.A],
		right: [Keys.E],
		back: [Keys.O],

		toggleBag: [Keys.J],
		toggleTools: [Keys.F],

		swapLeft: [Keys.Semicolon],
		swapRight: [Keys.Period]
	};

	// UI mappings for interacting with menus and such

	var UIMasks = {
		leftMouse:   1 << 0,
		rightMouse:  1 << 1,
		scoreBoard:  1 << 2,
		chat:        1 << 3,
		toggleBag:   1 << 4,
		toggleTools: 1 << 5,
		swapLeft:    1 << 6,
		swapRight:   1 << 7
	};

	var UIMappingsBase = {
		leftMouse: [MouseButtons.Left],
		rightMouse: [MouseButtons.Right],

		chat: [Keys.Enter],
		scoreBoard: [Keys.Tab],
	};

	var UIMappingsQwerty = {
		toggleBag: [Keys.C],
		toggleTools: [Keys.F],

		swapLeft: [Keys.Q],
		swapRight: [Keys.E]
	};

	var UIMappingsDvorak = {
		toggleBag: [Keys.J],
		toggleTools: [Keys.F],

		swapLeft: [Keys.Semicolon],
		swapRight: [Keys.Period]
	};


	var actionMapping;
	var uiMapping;
	if (window.localStorage["useDvorak"]) {
		actionMapping = mergeMappings(ActionMappingsBase, ActionMappingsDvorak);
		uiMapping = mergeMappings(UIMappingsBase, UIMappingsDvorak);
	} else {
		actionMapping = mergeMappings(ActionMappingsBase, ActionMappingsQwerty);
		uiMapping = mergeMappings(UIMappingsBase, UIMappingsQwerty);
	}

	var self = this;

	var gameInput = {
		controlFlags: 0,
		lat: -1/2 * Math.PI,
		lon: 1/2 * Math.PI
	};
	createBitFlagFunctions(gameInput, ActionMasks);

	var uiInput = {
		controlFlags: 0,
		x: 0,
		y: 0
	};
	createBitFlagFunctions(uiInput, UIMasks);

	function createBitFlagFunctions(inputs, masks) {
		for (var action in masks) {
			inputs[action] = function (action) {
				return function () {
					return (this.controlFlags & masks[action]) > 0;
				}
			}(action);
		}
	}

	var gameInputSet = { masks: ActionMasks, mapping: actionMapping, input: gameInput };
	var uiInputSet = { masks: UIMasks, mapping: uiMapping, input: uiInput };

	self.sample = function() {
		return { game: self.sampleGame(), ui: self.sampleUI() };
	};

	self.sampleGame = function() {
		return clone(gameInput);
	};

	self.sampleUI = function() {
		return clone(uiInput);
	};

	var isLocked = false;

	self.lock = function() {
		isLocked = true;
		requestPointerLock();
	};

	self.unlock = function() {
		isLocked = false;
		requestPointerUnlock();
	};

	function findAction(mapping, trigger) {
		for (var action in mapping) {
			var triggers = mapping[action];
			for (var i = 0; i < triggers.length; i++) {
				if (triggers[i] === trigger) return action;
			}
		}
	}

	function updateInput(inputSet, trigger, active) {
		var action = findAction(inputSet.mapping, trigger);
		if (!action) return false;
		if (active) {
			inputSet.input.controlFlags |= inputSet.masks[action];
		} else {
			inputSet.input.controlFlags &= ~inputSet.masks[action];
		}
		return true;
	}

	function gameInputStart(trigger) {
		updateInput(gameInputSet, trigger, true);
	}

	function gameInputEnd(trigger) {
		updateInput(gameInputSet, trigger, false);
	}

	function uiInputStart(trigger) {
		updateInput(uiInputSet, trigger, true);
	}

	function uiInputEnd(trigger) {
		updateInput(uiInputSet, trigger, false);
	}

	function keyDown(event) {
		var consumed = gameInputStart(event.keyCode) || uiInputStart(event.keyCode);
		if (consumed) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function keyUp(event) {
		var consumed = gameInputEnd(event.keyCode) || uiInputEnd(event.keyCode);
		if (consumed) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function mouseDown(event) {
		elm.focus();
		event.preventDefault();

		uiInputStart(event.button);

		if (!isLocked) return;
		attemptPointerLock();
		if (!pointerLocked()) return;
		event.stopPropagation();
		gameInputStart(event.button);
	}

	function mouseUp(event) {
		event.preventDefault();

		uiInputEnd(event.button);

		if (!isLocked) return;
		event.stopPropagation();
		gameInputEnd(event.button);
	}

	var MOUSE_MOVE_DELTA_BUG = localStorage.mouseMoveBug;
	function mouseMove(event) {
		uiInput.x = event.clientX;
		uiInput.y = event.clientY;

		if (!pointerLocked()) return;

		var x = event.movementX
			|| event.mozMovementX
			|| event.webkitMovementX
			|| 0;
		var y = event.movementY
			|| event.mozMovementY
			|| event.webkitMovementY
			|| 0;

		// This is needed on Justin's version of chrome.
		// For some reason the mouse events are off by one.
		// (must be a bug on the Linux version of Chrome).
		if (MOUSE_MOVE_DELTA_BUG) {
			x = x + 1;
			y = y + 1;
		}

		var lookSpeed = 0.005;
		gameInput.lon += x * lookSpeed;
		gameInput.lon %= 2 * Math.PI;
		gameInput.lat -= y * lookSpeed;
		gameInput.lat = clamp(gameInput.lat, -Math.PI + 0.01, -0.01);
	}

	onPointerLock(pointerLockChange);

	elm.tabIndex = "-1";
	elm.addEventListener('contextmenu', function (event) {
		event.preventDefault();
	}, false);
	elm.addEventListener('keydown', keyDown, false);
	elm.addEventListener('keyup', keyUp, false);
	elm.addEventListener('mousedown', mouseDown, false);
	elm.addEventListener('mouseup', mouseUp, false);
	elm.addEventListener('mousemove', mouseMove, false);

	function attemptPointerLock() {
		if (pointerLocked()) return;

		// We had an error :(
		if (elm.classList.contains('error')) return;

		// Firefox currently only allows us to access
		// pointer lock if the document is in full screen.
		// See https://bugzilla.mozilla.org/show_bug.cgi?id=737100
		if ('mozPointerLockElement' in document) {
			requestFullscreen();
		}
		self.lock();
	}

	function pointerLockChange() {
		if (pointerLocked()) {
			elm.classList.add('interactive');
		} else {
			if (isLocked) {
				elm.classList.remove('interactive');
			}
		}
	}

	function requestPointerLock() {
		(elm.requestPointerLock ||
		elm.mozRequestPointerLock ||
		elm.webkitRequestPointerLock).call(elm);
	}

	function requestPointerUnlock() {
		(document.exitPointerLock ||
		document.mozExitPointerLock ||
		document.webkitExitPointerLock).bind(document).call();
	}

	function requestFullscreen() {
		(elm.requestFullscreen ||
		elm.mozRequestFullscreen ||
		elm.mozRequestFullScreen || // Older API upper case 'S'.
		elm.webkitRequestFullscreen).call(elm);
	}

	function onPointerLock(cb) {
		document.addEventListener('pointerlockchange', cb, false);
		document.addEventListener('mozpointerlockchange', cb, false);
		document.addEventListener('webkitpointerlockchange', cb, false);
	}

	function pointerLocked() {
		return document.pointerLockElement === elm ||
			document.mozPointerLockElement === elm ||
			document.webkitPointerLockElement === elm;
	}

	function mergeMappings(base, more) {
		var result = clone(base);
		for (var action in more) {
			if (base[action]) {
				result[action] = base[action].concat(more[action]);
			} else {
				result[action] = more[action].slice();
			}
		}
		return result;
	}

	function clone(o) {
		var newO = {};
		for (var k in o) {
			newO[k] = o[k];
		}
		return newO;
	}
};

});
