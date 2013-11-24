define(function(require) {

	var $ = require("jquery");

	return function Chat(controls, conn, container) {
		var self = this;

		var firstEnter = false;
		var focused = false;
		var chat = document.getElementById("chat");

		conn.on('chat', processChat);

		var $input = $("#chat .input");
		$input.on('keydown', keydown);
		$input.on('keyup'  , keyup  );
		$input.on('focus'  , focus  );
		$input.on('blur'   , blur   );

		self.update = function (dt) {
			updateTweens(dt);

			if (!controls.sample().chat) return;

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
				conn.queue('chat', {
					Message: $input.val(),
				});
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

		function processChat(payload) {
			var message = document.createElement('div');
			message.className = "message";
			message.innerText = payload.DisplayName + ": " + payload.Message;

			var wrapper = document.createElement("div");
			wrapper.className = "message-wrapper";
			wrapper.appendChild(message);

			//TODO: Figure out how to do this naturally in html/css
			//	(there must be a way to align the bottom of the div)
			//	as... messages.scrollHeight takes a lot of time.
			var messages = chat.querySelector(".messages");
			messages.appendChild(wrapper);
			messages.scrollTop = messages.scrollHeight;
			
			while(messages.children.length > 50) {
				messages.removeChild(messages.children[0]);
			}
		}
	}
});