define(function (require) {

function Rect(x, y, w, h) {
	if (localStorage.debug) {
		addDebugWatchers(this);
	}

	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

Rect.prototype.clone = function () {
	return new Rect(this.x, this.y, this.w, this.h);
};

return Rect;
});
