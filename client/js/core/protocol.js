define(function(require){

var Body = require("physics/body");
var EntityState = require("entities/model/entityState");
var Health = require("entities/model/health");
var BioticState = require("entities/model/bioticState");
var WorldItemState = require("entities/model/worldItemState");

var Protocol = {
	MSG_HANDSHAKE_REPLY:    0,
	MSG_HANDSHAKE_ERROR:    1,
	MSG_ENTITY_CREATE:      2,
	MSG_ENTITY_STATE:       3,
	MSG_ENTITY_REMOVE:      4,
	MSG_CHUNK:              5,
	MSG_BLOCK:              6,
	MSG_CONTROLS_STATE:     7,
	MSG_CHAT:               8,
	MSG_DEBUG_RAY:          9,
	MSG_NTP_SYNC:          10,
	MSG_INVENTORY_STATE:   11,
	MSG_INVENTORY_MOVE:    12,
	MSG_SCOREBOARD_ADD:    13,
	MSG_SCOREBOARD_SET:    14,
	MSG_SCOREBOARD_REMOVE: 15
};

Protocol.append = function(a, b) {
	var result = new Uint8Array(a.byteLength + b.byteLength);
	result.set(new Uint8Array(a), 0);
	result.set(new Uint8Array(b), a.byteLength);
	return result.buffer;
};

// Ported from varint.go
Protocol.marshalInt = function(x) {
	var buf = new Uint8Array(10);
	var ux = (x << 1) >>> 0;
	if (x < 0) {
		ux = ~ux;
	}

	var i = 0;
	while (ux >= 0x80) {
		buf[i] = ux | 0x80;
		ux >>>= 7;
		i++;
	}
	buf[i] = ux;
	return buf.subarray(0, i).buffer;
};

// Ported from varint.go
Protocol.unmarshalInt = function(offset, dataView) {
	function returnValue(ux, n) {
		var x = ux >>> 1;
		if (ux&1 !== 0) {
			x = ~x;
		}
		return { value: x, read: n };
	}

	var x = 0;
	var s = 0;
	var b;
	for (var i = 0; ; i++) {
		b = dataView.getUint8(offset + i);
		if (b < 0x80) {
			if (i > 9 || i === 9 && b > 1) {
				return returnValue(0, -(i + 1)); // overflow
			}
			return returnValue(x | (b << s) >>> 0, i + 1);
		}
		x |= ((b&0x7F) << s) >>> 0;
		s += 7;
	}
};

Protocol.marshalFloat64 = function(x) {
	var buf = new ArrayBuffer(8);
	var dataView = new DataView(buf);
	dataView.setFloat64(x);
	return buf;
};

Protocol.unmarshalFloat64 = function(offset, dataView) {
	return { value: dataView.getFloat64(offset), read: 8 }
};

Protocol.marshalString = function(s) {
	var result = Protocol.marshalInt(s.length*2);

	var buf = new ArrayBuffer(s.length*2); // 2 bytes for each char
	var bufView = new Uint16Array(buf);
	for (var i = 0, strLen=str.length; i < strLen; i++) {
		bufView[i] = s.charCodeAt(i);
	}
	return Protocol.append(result, buf);
};

Protocol.unmarshalString = function(offset, dataView) {
	function uintToString(uintArray) {
		var encodedString = String.fromCharCode.apply(null, uintArray);
		return decodeURIComponent(escape(encodedString));
	}
	var returned = Protocol.unmarshalInt(0, dataView);
	offset += returned.read;
	return { value: uintToString(new Uint8Array(dataView.buffer.slice(offset, offset + returned.value))),
			 read: returned.value + returned.read }
};

Protocol.parseBody = function(proto) {
	function threeVecFromProto(proto) {
		return new THREE.Vector3(proto.X || 0, proto.Y || 0, proto.Z || 0);
	}
	return new Body(
		threeVecFromProto(proto.Pos),
		threeVecFromProto(proto.Vel),
		threeVecFromProto(proto.Dir),
		threeVecFromProto(proto.HalfExtents),
		threeVecFromProto(proto.CenterOffset)
	)
};

Protocol.parseEntityState = function(proto) {
	return new EntityState(proto.EntityId, Protocol.parseBody(proto.Body), proto.LastUpdated);
};

Protocol.parseHealth = function(proto) {
	return new Health(proto.Life);
};

Protocol.parseBioticState = function(proto) {
	return new BioticState(Protocol.parseEntityState(proto.EntityState),
			Protocol.parseHealth(proto.Health));
};

Protocol.parseWorldItemState = function(proto) {
	return new WorldItemState(Protocol.parseEntityState(proto.EntityState), proto.ItemKind);
};

Protocol.threeVecFromBinProto = function(offset, dataView) {
	return new THREE.Vector3(dataView.getFloat64(offset),
		dataView.getFloat64(offset + 8), dataView.getFloat64(offset + 16));
};

return Protocol;

});
