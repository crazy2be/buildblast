function Chat(controls, conn, container) {
    self = this;

    conn.on('chat', processChat);

    var enterPressed = false;

    self.update = function () {
        if (controls.sample().chat) {
            enterPressed = true;
        } else if (enterPressed) {
            enterPressed = false;
            $("#chatInput").focus();
        }
    };

    $("#chatInput").keyup(function(event) {
        if (event.which !== 13) return;

        if ($("#chatInput").val() !== "") {
            conn.queue('chat', {
                Message: $("#chatInput").val().replace("\n", ""),
            });
            $("#chatInput").val("");
        }
        $("#chatInput").blur();
        container.focus();
    });

    function processChat(payload) {
        $("#chatMessages").append(payload.ID + ": " + payload.Message + "\n");
    }
}