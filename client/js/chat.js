function Chat(controls, conn, gameContainer) {
    self = this;

    var enterPressed = false;
    var firstEnter = false;
    var focused = false;
    var container = document.getElementById("chat-container");
    var $input = $("#chat-container .input");

    conn.on('chat', processChat);

    $input.keydown(function (event) {
        if (!focused) return;

        if (event.which !== 13) {
            event.stopPropagation();
        }
    });

    $input.keyup(function(event) {
        if (!focused) return;

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
        gameContainer.focus();
    });

    $input.on('focus', function () {
        container.classList.add('active');
        focused = true;
    });

    $input.on('blur', function () {
        container.classList.remove('active');
        focused = false;
    });

    var accumulatedTime = 0.0;
    self.update = function (dt) {
        accumulatedTime += dt;
        if (accumulatedTime > 1.0) {
            accumulatedTime = 0.0;
            console.log(document.activeElement);
        }
        updateTweens(dt);

        if (!controls.sample().chat) return;

        if (focused) return;

        $input.focus();
        firstEnter = true;
    };

    function processChat(payload) {
        var message = document.createElement('div');
        message.className = "message";
        message.innerText = payload.DisplayName + ": " + payload.Message;
        addTween(message);

        var wrapper = document.createElement("div");
        wrapper.className = "message-wrapper";
        wrapper.appendChild(message);
        wrapper.setAttribute("data-time", payload.Time);

        var messages = container.querySelector(".messages");
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    var tweens = [];
    function addTween(elm) {
        var tween = new Tween(elm);
        tweens.push(tween);
    }
    function updateTweens(dt) {
        for (var i = 0; i < tweens.length; i++) {
            var tween = tweens[i];
            if (tween.finished()) {
                tween.end();
                tweens.splice(i, 1);
                continue;
            }
            tween.update(dt, focused);
        }
    }

    function Tween(elm) {
        var self = this;
        var totalTime = 1.0;
        var elapsedTime = 0.0;

        self.update = function (dt, focused) {
            elapsedTime += dt;
            var alpha = (1.0 - elapsedTime / totalTime) / 2;
            if (focused) alpha = 0.5;
            elm.style.background = rgba(255, 255, 255, alpha);
        }

        self.finished = function () {
            return elapsedTime >= totalTime;
        }

        self.end = function () {
            elm.style.background = '';
        }

        function rgba(r, g, b, alpha) {
            var a = (~~(Math.min(Math.max(alpha, 0), 1) * 100)) / 100
            return "rgba(" + ~~r + "," + ~~g + "," + ~~b + "," + a + ")";
        }
    }
}
