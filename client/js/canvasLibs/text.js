define(function (require) {
	var Rect = require("./rect");

	return function Text() {
		var self = this;
		// Will we re-measure and re-fit all of the text on the
		// next call to apply()?
		var dirty = true;

		var text = "[No text]";
		self.text = function (newText) {
			if (newText === undefined) {
				return text;
			}
			// We rely on self text object to have string methods.
			text = newText + "";
			dirty = true;
			return self;
		}

		// Should we word wrap long lines to fit within the width
		// of the bounding rect? If no, resize() will return the
		// width actually used by the text, which may be greater
		// than the width given.
		var wrap = true;
		self.wrap = function (newWrap) {
			if (newWrap === undefined) {
				return wrap;
			}
			wrap = newWrap;
			dirty = true;
			return self;
		}

		var fontSize = 14;

		// When shrink == true, fontSize is the size we would ideally
		// line to achieve, and curFontSize is the size we are forced
		// to render at to meet the constraints of our bounding rect.
		var curFontSize = fontSize;

		// Should we shrink the text size as required to fit within
		// the bounding rect? If yes, the text is always garuenteed
		// to fit within the bounding rect, but isn't always
		// gaurenteed to be readable!
		var shrink = true;
		self.shrink = function (newShrink) {
			if (newShrink === undefined) {
				return shrink;
			}
			shrink = newShrink;
			dirty = true;
			return self;
		}

		// We cannot neccessarily set the fontSize, but we can set the maximum font
		// size which may be decreased in size to fit the bounding rectangle.
		self.maxFontSize = function (newFontSize) {
			if (newFontSize === undefined) {
				return fontSize;
			}
			fontSize = newFontSize;
			dirty = true;
			return self;
		}

		var color = "green";
		self.color = function (newColor) {
			if (newColor === undefined) {
				return color;
			}
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
			if (newLineSpacing === undefined) {
				return lineSpacing;
			}
			lineSpacing = newLineSpacing;
			dirty = true;
			return self;
		}

		// How should we align the text within the box? Currently
		// supported values are "left", "right", and "center".
		// Justified support is not provided by canvas natively,
		// and is not trivial to implement. If you need it, add
		// it.
		var align = "center";
		self.align = function (newAlign) {
			if (newAlign === undefined) {
				return align;
			}
			// I wish I could do array.contains or something,
			// but javascript doesn't have that natively, and
			// self works for now.
			if (align == "left") {
				align = newAlign;
			} else if (align == "right") {
				align = newAlign;
			} else if (align == "center") {
				align = newAlign;
			} else {
				throw "Invalid or unsuppored value '" + newAlign + "' for Text.align given.";
			}
			return self;
		}

		self.draw = function (ctx) {
			if (dirty) {
				self.resize(rect);
				dirty = false;
			}
			ctx.font = makeFont();
			ctx.fillStyle = color;
			ctx.strokeStyle = color;
			ctx.textAlign = align;
			ctx.textBaseline = "middle";

			lines = getLines(ctx, text, rect.w);
			var usedHeight = lineHeight() * lines.length;

			var height = lineHeight();
			var unusedHeight = rect.h - usedHeight;
			var x = rect.x;
			var y = rect.y + height / 2 + unusedHeight / 2;

			if (align == "center") {
				x += rect.w / 2;
			} else if (align == "right") {
				x += rect.w;
			}

			for (var i = 0; i < lines.length; i++) {
				ctx.fillText(lines[i], x, y);
				y += height;
			}
		}

		var rect;
		var usedHeight = 0;
		self.resize = function (newRect) {
			rect = newRect;
			curFontSize = fontSize;

			if (!shrink) return measureText(newRect.clone());

			while (true) {
				var fittedRect = measureText(newRect.clone());
				if (fittedRect.w <= newRect.w && fittedRect.h <= newRect.h) {
					usedHeight = fittedRect.h;
					return;
				}
				if (curFontSize-- < 0) throw "WTF";
			}
		}

		// Currently, this messes up the internal state, so make sure you
		// always call resize() after calling this to clean it up again. (It's
		// not a huge deal since that's the usual use-case anyway)
		self.optimalHeight = function (width) {
			var rect = new Rect(0, 0, width, 0);
			curFontSize = fontSize;
			rect = measureText(rect);
			return rect.h;
		}

		//Todo: Handle Wrap set/not set. If wrap is set, it should figure out how many lines it can display without shrinking the text, and return that.
		//                               If not, shrink the single line if needed, and then return the width.
		self.optimalWidth = function (height) {
			if (!shrink) {
				c.font = makeFont(fontSize);
				measuredRect = c.measureText(text);
				return measuredRect.w;
			}

			var measuredRect = null;
			var fontSize = fontSize + 1;
			do {
				c.font = makeFont(--fontSize);
				measuredRect = c.measureText(text);
			} while (measuredRect.height > height);
			return measuredRect.width + 1;
		}

		function measureText(rect) {
			c.font = makeFont();
			if (wrap) {
				//TODO: Stop messing up our internal state here...
				lines = getLines(c, text, rect.w);

				rect.h = lineHeight() * lines.length;
				rect.w = 0;
				lines.forEach(function (line) {
					rect.w = Math.max(rect.w, c.measureText(line).width);
				});
				return rect;
			} else {
				rect.h = lineHeight();
				rect.w = c.measureText(text).width;
				return rect;
			}
		}

		var curFont = "Verdana";
		self.font = function (newFont) {
			curFont = newFont;
			dirty = true;
		}

		function makeFont(reqFontSize) {
			return (reqFontSize || curFontSize) + "px " + curFont;
		}

		function lineHeight() {
			return curFontSize * lineSpacing;
		}

		var element = document.createElement('canvas')
		var c = element.getContext('2d');
		c.font = makeFont();
		var lines = [];

		//http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
		//Set font before you call self.
		function getLines(ctx, text, maxWidth) {
			var words = text.split(" ");
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