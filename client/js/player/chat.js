define(function(require) {

var $ = require("jquery");

var Protocol = require("core/protocol");

return function Chat(controls, conn, container) {
	var self = this;

	var firstEnter = false;
	var focused = false;
	var chat = document.getElementById("chat");

	conn.on(Protocol.MSG_CHAT_BROADCAST, function(result) {
		var message = document.createElement('div');
		message.className = "message";
		message.innerText = result.displayName + ": " + result.message;
		addTween(message);

		var wrapper = document.createElement("div");
		wrapper.className = "message-wrapper";
		wrapper.appendChild(message);

		var messages = chat.querySelector(".messages");
		messages.appendChild(wrapper);
		messages.scrollTop = messages.scrollHeight;
	});

	var $input = $("#chat .input");
	$input.on('keydown', keydown);
	$input.on('keyup'  , keyup  );
	$input.on('focus'  , focus  );
	$input.on('blur'   , blur   );

	self.update = function (dt) {
		updateTweens(dt);

		if (!controls.sample().chat()) return;

		if (focused) return;

		$input.focus();
		firstEnter = true;
	};

	function keydown(event) {
		if (event.which !== 13) event.stopPropagation();
	}

	function keyup(event) {
		if (event.which !== 13) return;

		if (firstEnter) {
			firstEnter = false;
			return;
		}

		var text = $.trim($input.val());
		if (text !== '') {
			conn.queue(Protocol.MSG_CHAT_SEND, [text]);
		}

		$input.val("").blur();
		container.focus();
	}

	function focus(event) {
		chat.classList.add('active');
		focused = true;
	}

	function blur(event) {
		chat.classList.remove('active');
		focused = false;
	}

	var tweens = [];
	function addTween(elm) {
		var tween = new Tween(elm);
		tweens.push(tween);
	}
	function updateTweens(dt) {
		for (var i = 0; i < tweens.length; i++) {
			var tween = tweens[i];
			tween.update(dt, focused);
			if (tween.finished()) {
				tween.end();
				tweens.splice(i, 1);
			}
		}
	}

	function Tween(elm) {
		var self = this;
		var totalTime = 6000.0;
		var elapsedTime = 0.0;

		self.update = function (dt, focused) {
			elapsedTime += dt;
			var completion = elapsedTime / totalTime;
			var alpha = 1.0;
			if (!focused && completion > 0.75) {
				alpha = (1.0 - completion) * 4;
			}
			elm.style.opacity = alpha;
		};

		self.finished = function () {
			return elapsedTime >= totalTime;
		};

		self.end = function () {
			elm.style.opacity = '';
		};
	}
}
});
