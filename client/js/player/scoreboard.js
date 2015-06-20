define(function(require) {

var Protocol = require("core/protocol");

return function Scoreboard(controls, conn, container) {
	var self = this;
	var scoreboard = document.getElementById("scoreboard");
	var scores = {};
	var dirty = false;

	conn.on(Protocol.MSG_SCOREBOARD_ADD, function(msg) {
		var name = msg.name;
		var score = msg.score;

		if (scores[name] !== undefined) {
			console.error("Server Error: Got scoreboard-add message for entity which is already on the scoreboard.");
			return;
		}
		scores[name] = score;
		dirty = true;
	});

	conn.on(Protocol.MSG_SCOREBOARD_SET, function(msg) {
		var name = msg.name;
		var score = msg.score;

		if (scores[name] === undefined) {
			console.error("Server error: got scoreboard-set message for entity which is not on the scoreboard.");
			return;
		}
		scores[name] = score;
		dirty = true;
	});

	conn.on(Protocol.MSG_SCOREBOARD_REMOVE, function(msg) {
		var name = msg.name;

		if (scores[name] === undefined) {
			console.error("Server error: got scoreboard-remove message for entity which is not on the scoreboard.");
			return;
		}
		delete scores[name];
		dirty = true;
	});

	var wasVisible = false;
	self.update = function () {
		var visible = controls.sample().scoreBoard();
		if (visible !== wasVisible) {
			scoreboard.style.display = visible ? 'table' : 'none';
			wasVisible = visible;
		}
		if (!dirty) return;
		var html = '<table>';
		html += '<tr><td colspan="2"><h2>Scoreboard</h2></td></tr>';
		for (var name in scores) {
			html += '<tr><td>' + name + '</td><td style="text-align: right">' + scores[name] + '</td></tr>';
		}
		html += '</table>';
		scoreboard.querySelector('#scores').innerHTML = html;
		dirty = false;
	}
}

});
