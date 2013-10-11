define(function () {
//Takes a fully formed uri (ws://localhost:8080/sockets/stuff/) OR
//just the tip (stuff, which is converts to the the full uri).
function Conn(uri) {
	var self = this;
	var WS_OPEN = 1;

	if (uri.indexOf("wss:") !== 0 && uri.indexOf("ws:") !== 0) {
		uri = getWSURI(uri);
	}

	if (!uri) {
		throw "URI required, but not provided to Conn constructor.";
	}
	var ws = new WebSocket(uri);

	var messageQueue = [];
	self.queue = function (kind, payload) {
		var obj = { kind: kind, payload: payload };
		if (ws.readyState === WS_OPEN) {
			ws.send(JSON.stringify(obj));
		} else {
			messageQueue.push(obj);
		}
	};

	ws.onopen = function () {
		for (var i = 0; i < messageQueue.length; i++) {
			ws.send(JSON.stringify(messageQueue[i]));
		}
		messageQueue = [];
	};


	var handlers = {};
	self.on = function (kind, cb) {
		handlers[kind] = handlers[kind] || [];
		handlers[kind].push(cb);
	};

	function handleMessage(data) {
		var o = JSON.parse(data);
		var kind = o.Kind;
		if (!handlers[kind]) {
			console.warn("Recieved server message of unknown type: " + kind);
			return;
		}
		var h = handlers[kind];
		for (var i = 0; i < h.length; h++) {
			h[i](o.Payload);
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
			handleMessage(ev.data);
		} else {
			incomingQueue.push(ev.data);
		}
	};


	ws.onerror = function (ev) {
		throw new Error("Alas, it seems I have errd. Forgive me master!", ev);
	};

	ws.onclose = function (ev) {
		throw new Error("Someone closed my websocket :(", ev);
	};
}

function getWSURI(path) {
	//self == window, but also works when in a worker.
	var loc = self.location;
	var uri = loc.protocol === "https:" ? "wss:" : "ws:";
	uri += "//" + loc.host + "/sockets/" + path;

	if (uri[uri.length - 1] !== '/') {
		uri += '/';
	}

	return uri;
}

Conn.getWSURI = getWSURI;

return Conn;
});
