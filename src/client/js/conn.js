function Conn() {
    var self = this;
    var WS_OPEN = 1;
    
    var ws = (function () {
        var loc = window.location;
        var uri = loc.protocol === "https:" ? "wss:" : "ws:";
        uri += "//" + loc.host + "/ws";
        return new WebSocket(uri);
    }());
    
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
        console.log(ev.data);
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
        console.error(ev);
    }
    
    ws.onclose = function (ev) {
        console.error("Someone closed my websocket :(", ev);
    }
    
}