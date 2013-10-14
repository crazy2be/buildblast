define(function (require) {
var Rect = require("./rect");

return function Text() {
	var self = this;
	// Will we re-measure and re-fit all of the contents on the
	// next call to apply()?
	var dirty = true;

	var contents = "[No contents]";
	self.contents = function (newContents) {
		// We rely on this contents object to have string methods.
		contents = newContents + "";
		dirty = true;
		return self;
	}

	// Should we word wrap long lines to fit within the width
	// of the bounding rect? If no, resize() will return the
	// width actually used by the contents, which may be
	// greater than the width given.
	var wrap = true;
	self.wrap = function (newWrap) {
		wrap = newWrap;
		dirty = true;
		return self;
	}


	// Should we shrink the contents size as required to fit within
	// the bounding rect? If yes, the contents is always garuenteed
	// to fit within the bounding rect, but isn't always
	// gaurenteed to be readable!
	var shrink = true;
	self.shrink = function (newShrink) {
		shrink = newShrink;
		dirty = true;
		return self;
	}

	var maxFontSize = 14;

	var fontSize = maxFontSize;
	// When shrink == true, maxFontSize is the size we would ideally
	// line to achieve, and fontSize is the size we are forced
	// to render at to meet the constraints of our bounding rect.
	self.maxFontSize = function (newFontSize) {
		maxFontSize = newFontSize;
		dirty = true;
		return self;
	}

	var fontFace = "Verdana";
	self.fontFace = function (newFontFace) {
		fontFace = newFontFace;
		dirty = true;
		return self;
	}

	var color = "green";
	self.color = function (newColor) {
		color = newColor;
		dirty = true;
		return self;
	}

	// The amount of space allocated for each line, as a function
	// of the font size. As lines are positioned in the center of
	// the space allocted for them, the space is evenly distributed
	// above and below each line (which really only matters for
	// the first and last lines.)
	var lineSpacing = 1;
	self.lineSpacing = function (newLineSpacing) {
		lineSpacing = newLineSpacing;
		dirty = true;
		return self;
	}

	// How should we align the contents within the box? Currently
	// supported values are "left", "right", and "center".
	// Justified support is not provided by canvas natively,
	// and is not trivial to implement. If you need it, add
	// it.
	var align = "center";
	self.align = function (newAlign) {
		var valid = ['left', 'right', 'center'];
		if (valid.indexOf(newAlign) === -1) {
			throw "Invalid or unsuppored value '" + newAlign + "' for Text.align given.";
		}
		align = newAlign;
		return self;
	}

	var rect;
	self.rect = function (newRect) {
		if (!newRect instanceof Rect) {
			throw "Text.rect() expects a Rect!";
		}
		rect = newRect;
		dirty = true;
		return self;
	};

	self.draw = function (ctx) {
		if (dirty) {
			recomputeWrapping();
			dirty = false;
		}
		ctx.font = font();
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.textAlign = align;
		ctx.textBaseline = "middle";

		var x = rect.x;
		if (align == "center") {
			x += rect.w / 2;
		} else if (align == "right") {
			x += rect.w;
		}

		var heightPerLine = lineHeight();
		var usedHeight = heightPerLine * lines.length;
		var unusedHeight = rect.h - usedHeight;
		var y = rect.y + heightPerLine / 2 + unusedHeight / 2;

		for (var i = 0; i < lines.length; i++) {
			ctx.fillText(lines[i], x, y);
			y += heightPerLine;
		}
	}

	var lines = [];
	var c = document.createElement('canvas').getContext('2d');
	function recomputeWrapping() {
		fontSize = maxFontSize;
		c.font = font();

		if (!shrink) {
			lines = findTextWrapping(contents);
			return;
		}

		for (; fontSize > 0; fontSize--) {
			lines = findTextWrapping(contents);
			var newWidth = longest(lines);
			var newHeight = lineHeight() * lines.length;
			if (newWidth <= rect.w && newHeight <= rect.h) {
				return;
			}
			c.font = font();
		}

		function longest(lines) {
			var width = 0;
			lines.forEach(function (line) {
				width = Math.max(width, c.measureText(line).width);
			});
			return width;
		}
	}

	function findTextWrapping(contents) {
		if (!wrap) {
			return [contents];
		}
		return calcLines(c, contents, rect.w);
	}

	function font(reqFontSize) {
		return (reqFontSize || fontSize) + "px " + fontFace;
	}

	function lineHeight() {
		return fontSize * lineSpacing;
	}


	// http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
	// Set font before you call this.
	function calcLines(ctx, contents, maxWidth) {
		var words = contents.split(" ");
		var lines = [];
		var currentLine = words[0];

		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			var width = ctx.measureText(currentLine + " " + word).width;
			if (width < maxWidth) {
				currentLine += " " + word;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		}
		lines.push(currentLine);
		return lines;
	}
}
});
