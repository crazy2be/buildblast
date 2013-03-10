function getWSURI(path) {
    path = path || "/ws/new";
    var loc = window.location;
    var uri = loc.protocol === "https:" ? "wss:" : "ws:";
    uri += "//" + loc.host + path;
    return uri;
}

function Conn(uri) {
    var self = this;
    var WS_OPEN = 1;

    if (!uri) uri = getWSURI();
    var ws = new WebSocket(uri);

    var messageQueue = [];
    self.queue = function (kind, payload) {
        var obj = {kind: kind, payload: payload};
        if (ws.readyState === WS_OPEN) {
            ws.send(JSON.stringify(obj));
        } else {
            messageQueue.push(obj);
        }
    }

    var handlers = {};
    self.on = function (kind, cb) {
        handlers[kind] = handlers[kind] || [];
        handlers[kind].push(cb);
    }

    ws.onopen = function () {
        for (var i = 0; i < messageQueue.length; i++) {
            ws.send(JSON.stringify(messageQueue[i]));
        }
    }

    ws.onmessage = function (ev) {
        var o = JSON.parse(ev.data);
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

    ws.onerror = function (ev) {
        throw new Error("Alas, it seems I have errd. Forgive me master!", ev);
    }

    ws.onclose = function (ev) {
        throw new Error("Someone closed my websocket :(", ev);
    }

}
