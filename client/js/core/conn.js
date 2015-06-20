define(function(require) {

var Protocol = require("core/protocol");

function Conn(uri) {
	var self = this;
	var WS_OPEN = 1;

	if (!uri) {
		throw "URI required, but not provided to Conn constructor.";
	}
	var ws = new WebSocket(uri);
	ws.binaryType = "arraybuffer";

	var messageQueue = [];
	self.queue = function(message, data) {
		self.queueMessage(Protocol.marshalMessage(message, data));
	};
	self.queueMessage = function (dataView) {
		if (ws.readyState === WS_OPEN) {
			ws.send(dataView);
		} else {
			messageQueue.push(dataView);
		}
	};

	ws.onopen = function () {
		for (var i = 0; i < messageQueue.length; i++) {
			ws.send(messageQueue[i]);
		}
		messageQueue = [];
	};

	var handlers = {};
	self.on = function (id, cb) {
		handlers[id] = handlers[id] || [];
		handlers[id].push(cb);
	};

	function handleMessage(dataView) {
		var id = dataView.getUint8(0);
		if (!handlers[id]) {
			console.warn("Recieved server message of unknown id:", id, "with data", dataView);
			return;
		}
		var message = Protocol.unmarshalMessage(0, dataView).value;
		var h = handlers[id];
		for (var i = 0; i < h.length; h++) {
			h[i](message);
		}
	}


	// Should messages be parsed, and their handlers called, immediately?
	// If false, we wait until update() is called to process messages.
	var immediate = true;
	self.setImmediate = function (isImmediate) {
		immediate = !!isImmediate;
	};

	var incomingQueue = [];
	self.update = function () {
		while (incomingQueue.length) {
			var data = incomingQueue.shift();
			handleMessage(data);
		}
	};

	ws.onmessage = function (ev) {
		if (immediate) {
			handleMessage(new DataView(ev.data));
		} else {
			incomingQueue.push(new DataView(ev.data));
		}
	};

	ws.onerror = function (ev) {
		throw new Error("Alas, it seems I have errd. Forgive me master!", ev);
	};

	ws.onclose = function (ev) {
		throw new Error("Someone closed my websocket :(", ev);
	};
}

Conn.socketURI = function (path) {
	//self == window, but also works when in a worker.
	var loc = self.location;
	var uri = loc.protocol === "https:" ? "wss:" : "ws:";
	uri += "//" + loc.host + "/sockets/" + path;

	if (uri[uri.length - 1] !== '/') {
		uri += '/';
	}

	return uri;
};

return Conn;
});
