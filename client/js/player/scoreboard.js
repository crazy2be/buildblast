define(function(require) {

return function Scoreboard(controls, conn, container) {
	var self = this;
	var scoreboard = document.getElementById("scoreboard");
	var scores = {};
	var dirty = false;

	conn.on('scoreboard-add', handleAdd);
	conn.on('scoreboard-set', handleSet);
	conn.on('scoreboard-remove', handleRemove);

	function handleAdd(payload) {
		var name = payload.Name;
		var score = payload.Score || 0;
		if (scores[name] !== undefined) {
			console.error("Server Error: Got scoreboard-add message for entity which is already on the scoreboard.");
			return;
		}
		scores[name] = score;
		dirty = true;
	}

	function handleSet(payload) {
		var name = payload.Name;
		var score = payload.Score;
		if (scores[name] === undefined) {
			console.error("Server error: got scoreboard-set message for entity which is not on the scoreboard.");
			return;
		}
		scores[name] = score;
		dirty = true;
	}

	function handleRemove(payload) {
		var name = payload.Name;
		if (scores[name] === undefined) {
			console.error("Server error: got scoreboard-remove message for entity which is not on the scoreboard.");
			return;
		}
		delete scores[name];
		dirty = true;
	}

	var wasVisible = false;
	self.update = function () {
		var visible = controls.sample().scoreBoard;
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
