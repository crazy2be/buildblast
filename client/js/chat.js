function Chat(controls, conn, container) {
    self = this;

    var enterPressed = false;

    var chatVisibleTime = 3.0; // In seconds
    var chatFadeTime = 3.0;    // In seconds
    var chatOpacity = 0.0;
    var visibleTimeRemaining = 0.0;

    conn.on('chat', processChat);

    $("#chat-input").blur(function() {
        $("#chat-input").css("visibility", "hidden");
    });

    $("#chat-input").focus(function() {
        $("#chat-input").css("visibility", "visible");
    });

    $("#chat-input").keyup(function(event) {
        if (event.which !== 13) return;
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

    self.update = function (dt) {
        if (controls.sample().chat) {
            enterPressed = true;
        } else if (enterPressed) {
            enterPressed = false;
            $("#chat-input").focus();
        }

        if ($("#chat-input").is(":focus")) {
            // When chatting keep the chat box opaque.
            chatOpacity = 1;
            visibleTimeRemaining = chatVisibleTime;
        } else {
            // When not chatting, fade based out based on activity of the chat.

            // If the opacity <= 0, don't need to do anything.
            if (chatOpacity <= 0) return;
            // The amount of time the box has faded this update.
            var fadeTime = 0;

            if (visibleTimeRemaining > 0) {
                // If there is still time left to be visible, update how much is left.
                visibleTimeRemaining -= dt;
                if (visibleTimeRemaining < 0) {
                    // All the visible time was used up, fade the amount of time we
                    // over used.
                    fadeTime = -visibleTimeRemaining;
                }
            } else {
                // No visible time left, just fade the passed time.
                fadeTime = dt;
            }
            chatOpacity -= fadeTime / chatFadeTime;
            chatOpacity = max(chatOpacity, 0);
        }
        $("#chat-messages").css("opacity", chatOpacity);
    };

    function processChat(payload) {
        // Create the message for display
        var $message = $("<div class='chat-message'></div>");
        $message.text(payload.DisplayName + ": " + payload.Message);
        $message = $("<div class='chat-message-wrapper'></div>").append($message);
        $message.attr("data-time", payload.Time);
        $("#chat-messages").append($message);

        // Sort the chat messages
        var elements = $("#chat-messages").children('div').sort(sortChat);
        $("#chat-messages").empty().append(elements);

        // Scroll to the last received message
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

        // Display the chat box for a couple seconds when you receive a message.
        chatOpacity = 1;
        visibleTimeRemaining = chatVisibleTime;
    }

    function sortChat(a, b) {
        var aTime = $(a).attr("data-time");
        var bTime = $(b).attr("data-time");
        return aTime > bTime ? 1 : -1;
    }
}