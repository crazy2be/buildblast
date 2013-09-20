function Rect(x, y, w, h) {
	if (localStorage.debug) {
		addDebugWatchers(this);
	}

	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

	this.uninvert();
}

var pr = Rect.prototype;

pr.center = function (newCenter) {
	if (newCenter === undefined) {
		return new THREE.Vector2(this.x + this.w / 2, this.y + this.h / 2);
	}
	this.x = newCenter.x - this.w / 2;
	this.y = newCenter.y - this.h / 2;
	return this;
};

//If we are inverted, flips us so we are not.
//Meaning, if our w or h are negative, makes them
//positive and moves our x or y over
pr.uninvert = function() {
	if (this.w < 0) {
		this.x += this.w;
		this.w = -this.w;
	}
	if (this.h < 0) {
		this.y += this.h;
		this.h = -this.h;
	}
}

pr.clone = function () {
	return new Rect(this.x, this.y, this.w, this.h);
};

// Assuming this rectangle fits within the unit rectangle
// with origin (0, 0) and size (1, 1), project it onto
// a rectangle with the given origin and size. For example,
//     rect(0, 0, 0.5, 0.5).project(rect(0, 0, 4, 4))
// would give you rect(0, 0, 2, 2). Similarilly,
//     rect(0.5, 0, 0.5, 0.5).project(rect(0, 0, 4, 4))
// would give you rect(2, 0, 2, 2). Finally,
//     rect(0, 0, 1, 1).project(rect(20, 75, 1, 1))
// would give you rect(20, 75, 1, 1).
pr.project = function (rect) {
	this.x = rect.x + this.x * rect.w;
	this.y = rect.y + this.y * rect.h;

	this.w *= rect.w;
	this.h *= rect.h;

	return this;
}

// Assuming this rectangle fits within the given rectangle,
// this function will normalize it to fit within the unit
// rectangle, so that it can be projected onto a different
// rectangle.
p.norm = function (rect) {
	this.x = (this.x - rect.x) / rect.w;
	this.y = (this.y - rect.y) / rect.h;

	this.w /= rect.w;
	this. h /= rect.h;

	return this;
}

// Returns a rectangle represeting the largest square that
// can fit inside this rectangle, centered inside the rectangle.
// Very useful for laying out square objects in the gui.
pr.largestSquare = function () {
	var size = this.w > this.h ? this.h : this.w;
	return new Rect(0, 0, size, size).center(this.center());
}

pr.origin = function (newOrigin) {
	if (newOrigin === undefined) {
		return new THREE.Vector2(this.x, this.y);
	}
	this.x = newOrigin.x;
	this.y = newOrigin.y;
	return this;
}

pr.moveOrigin = function (delta) {
	this.x += delta.x;
	this.y += delta.y;
	return this;
}

pr.size = function (newSize) {
	if (newSize === undefined) {
		return new THREE.Vector2(this.w, this.h);
	}
	this.w = newSize.x;
	this.h = newSize.y;
	return this;
}

// Shrinks a rectangle by amount in all directions.
// used to add padding.
pr.shrink = function (amount) {
	this.x += amount;
	this.y += amount;
	this.w -= 2 * amount;
	this.h -= 2 * amount;
	return this;
}

pr.str = function () {
	return "Rectangle at (" + this.x + ", " + this.y + ")" + "with size (" + this.w + ", " + this.h + ")";
}

//Functions to allow our rectangle to exist in the left, top, right, bottom
//paradigm. Very useful for UI code.
pr.left = function (newLeft) {
	if(newLeft === undefined) {
		return this.x;
	}
	this.x = newLeft;
	return this;
}
pr.top = function (newTop) {
	if(newTop === undefined) {
		return this.y;
	}
	this.y = newTop;
	return this;
}
pr.right = function (newRight) {
	if(newRight === undefined) {
		return this.x + this.w;
	}
	this.x = newRight - this.w;
	return this;
}
pr.bottom = function (newBottom) {
	if(newBottom === undefined) {
		return this.y + this.h;
	}
	this.y = newBottom - this.top;
	return this;
}

pr.round = function() {
	this.x = Math.round(this.x);
	this.y = Math.round(this.y);
	this.w = Math.round(this.w);
	this.h = Math.round(this.h);

	return this;
}

function addDebugWatchers(obj) {
	Object.defineProperties(obj, {
		x: {
			get: function () {
				return this._x
			},
			set: function (x) {
				if (x !== x || x === undefined) throw "Invalid value for x";
				this._x = x
			},
		},
		y: {
			get: function () {
				return this._y;
			},
			set: function (y) {
				if (y !== y || y === undefined) throw "Invalid value for y";
				this._y = y;
			},
		},
		w: {
			get: function () {
				return this._w
			},
			set: function (w) {
				if (w !== w || w === undefined) throw "Invalid value for w";
				this._w = w
			},
		},
		h: {
			get: function () {
				return this._h
			},
			set: function (h) {
				if (h !== h || h === undefined) throw "Invalid value for h";
				this._h = h
			},
		},
	});
}