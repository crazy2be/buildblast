function Chat(controls, conn, container) {
    self = this;

    var enterPressed = false;

    var chatVisibleTime = 3.0; // In seconds
    var chatFadeTime = 3.0;    // In seconds
    var chatOpacity = 0.0;
    var currentTime = 0.0;

    conn.on('chat', processChat);

    self.update = function (dt) {
        if (controls.sample().chat) {
            enterPressed = true;
        } else if (enterPressed) {
            enterPressed = false;
            $("#chat-input").css("visibility", "visible");
            $("#chat-input").focus();
        }

        if ($("#chat-input").is(":focus")) {
            // When chatting keep the chat box opaque.
            chatOpacity = 1;
            currentTime = chatVisibleTime;
            $("#chat-messages").css("opacity", 1);
        } else {
            // When not chatting, fade based out based on activity of the chat.

            // If the opacity <= 0, don't need to do anything.
            if (chatOpacity <= 0) return;
            // The amount of time the box has faded this update.
            var fadeTime = 0;

            if (currentTime > 0) {
                // If there is still time left to be visible, update how much is left.
                currentTime -= dt;
                if (currentTime < 0) {
                    // All the visible time was used up, fade the amount of time we
                    // over used.
                    fadeTime = -currentTime;
                }
            } else {
                // No visible time left, just fade the passed time.
                fadeTime = dt;
            }
            chatOpacity -= fadeTime / chatFadeTime;
            chatOpacity = max(chatOpacity, 0);
            $("#chat-messages").css("opacity", chatOpacity);
        }
    };

    $("#chat-input").keyup(function(event) {
        if (event.which !== 13) return;
        $("#chat-input").css("visibility", "hidden");
        var text = $.trim($("#chat-input").val());
        if (text !== '') {
            conn.queue('chat', {
                Message: $("#chat-input").val(),
            });
        }
        $("#chat-input").val("");
        $("#chat-input").blur();
        container.focus();
    });

    function processChat(payload) {
        var $message = $("<div class='chat-message'></div>");
        $message.text(payload.DisplayName + ": " + payload.Message);
        $message = $("<div class='chat-message-wrapper'></div>").append($message);
        $message.attr("data-time", payload.Time);
        $("#chat-messages").append($message);
        var elements = $("#chat-messages").children('div').sort(sortChat);
        $("#chat-messages").empty();
        $.each(elements, function(i, elm) { $("#chat-messages").append(elm); });
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
        chatOpacity = 1;
        currentTime = chatVisibleTime;
    }

    function sortChat(a, b) {
        var aTime = $(a).attr("data-time");
        var bTime = $(b).attr("data-time");
        return aTime > bTime ? 1 : -1;
    }
}