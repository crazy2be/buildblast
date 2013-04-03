function Chat(controls, conn, container) {
    self = this;

    conn.on('chat', processChat);

    var enterPressed = false;

    var chatVisibleTime = 3; // In seconds
    var chatFadeTime = 3;    // In seconds
    var chatOpacity = 0;
    var currentTime = 0;

    self.update = function (dt) {
        if (controls.sample().chat) {
            enterPressed = true;
        } else if (enterPressed) {
            enterPressed = false;
            $("#chatInput").css("visibility", "visible");
            $("#chatInput").focus();
        }

        if ($("#chatInput").is(":focus")) {
            chatOpacity = 1;
            currentTime = chatVisibleTime;
            $("#chatMessages").css("opacity", 1);
        } else {
            if (chatOpacity > 0) {
	            var reduceTime = 0;
	            if (currentTime > 0) {
	                 currentTime -= dt;
	                 if (currentTime < 0) {
	                     reduceTime = -currentTime;
	                 }
	            } else {
	                reduceTime = dt;
	            }
	            chatOpacity -= reduceTime / chatFadeTime;
                chatOpacity = max(chatOpacity, 0);
	            $("#chatMessages").css("opacity", chatOpacity);
            }
        }
    };

    $("#chatInput").keyup(function(event) {
        if (event.which !== 13) return;
        $("#chatInput").css("visibility", "hidden");
        var text = $.trim($("#chatInput").val());
        if (text !== '') {
            conn.queue('chat', {
                Message: $("#chatInput").val(),
            });
        }
        $("#chatInput").val("");
        $("#chatInput").blur();
        container.focus();
    });

    function processChat(payload) {
        $("#chatMessages").append("<div class='chatMessageWrapper'><div class='chatMessage'>"
                + payload.ID + ": " + payload.Message
                + "</div></div>");
        $("#chatMessages").scrollTop($("#chatMessages")[0].scrollHeight);
        chatOpacity = 1;
        currentTime = chatVisibleTime;
    }
}