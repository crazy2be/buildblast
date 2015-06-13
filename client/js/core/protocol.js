define(function(require){

var THREE = require("THREE");
var PROTO = require("proto");

var Body = require("physics/body");
var EntityState = require("entities/model/entityState");
var Health = require("entities/model/health");
var BioticState = require("entities/model/bioticState");
var WorldItemState = require("entities/model/worldItemState");

var Protocol = {
	MSG_HANDSHAKE_REPLY:    0, // CLIENT <--- SERVER
	MSG_HANDSHAKE_ERROR:    1, // CLIENT <--- SERVER
	MSG_ENTITY_CREATE:      2, // CLIENT <--- SERVER
	MSG_ENTITY_STATE:       3, // CLIENT <--- SERVER
	MSG_ENTITY_REMOVE:      4, // CLIENT <--- SERVER
	MSG_CHUNK:              5, // CLIENT <--- SERVER
	MSG_BLOCK:              6, // CLIENT <--> SERVER
	MSG_CONTROLS_STATE:     7, // CLIENT ---> SERVER
	MSG_CHAT_SEND:          8, // CLIENT ---> SERVER
	MSG_CHAT_BROADCAST:     9, // CLIENT <--- SERVER
	MSG_DEBUG_RAY:         10, // CLIENT <--- SERVER
	MSG_NTP_SYNC_REQUEST:  11, // CLIENT ---> SERVER
	MSG_NTP_SYNC_REPLY:    12, // CLIENT <--- SERVER
	MSG_INVENTORY_STATE:   13, // CLIENT <--- SERVER
	MSG_INVENTORY_SELECT:  14, // CLIENT ---> SERVER
	MSG_INVENTORY_MOVE:    15, // CLIENT ---> SERVER
	MSG_SCOREBOARD_ADD:    16, // CLIENT <--- SERVER
	MSG_SCOREBOARD_SET:    17, // CLIENT <--- SERVER
	MSG_SCOREBOARD_REMOVE: 18  // CLIENT <--- SERVER
};

Protocol.EntityKindPlayer    = 0;
Protocol.EntityKindBiotic    = 1;
Protocol.EntityKindWorldItem = 2;

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
		buf[i++] = ux | 0x80;
		ux >>>= 7;
	}
	buf[i++] = ux;
	return buf.buffer.slice(0, i);
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
	dataView.setFloat64(0, x);
	return buf;
};

Protocol.unmarshalFloat64 = function(offset, dataView) {
	return { value: dataView.getFloat64(offset), read: 8 }
};

Protocol.marshalString = function(s) {
	var utf8 = unescape(encodeURIComponent(s));
	var result = Protocol.marshalInt(utf8.length);

	var buf = new ArrayBuffer(utf8.length);
	var bufView = new Uint8Array(buf);
	for (var i = 0, len = utf8.length; i < len; i++) {
		bufView[i] = utf8.charCodeAt(i);
	}
	return Protocol.append(result, buf);
};

Protocol.unmarshalString = function(offset, dataView) {
	function uintToString(uintArray) {
		var encodedString = String.fromCharCode.apply(null, uintArray);
		return decodeURIComponent(escape(encodedString));
	}
	var returned = Protocol.unmarshalInt(offset, dataView);
	return { value: uintToString(
				new Uint8Array(
					dataView.buffer.slice(offset + returned.read, offset + returned.read + returned.value))),
			 read: returned.value + returned.read }
};

Protocol.unmarshalByteArray = function(offset, dataView) {
	var sizeResult = Protocol.unmarshalInt(offset, dataView);
	var arrayLength = sizeResult.value;
	offset += sizeResult.read;
	var array = new Uint8Array(dataView.buffer.slice(offset, offset + arrayLength));
	return { value: array, read: sizeResult.read + arrayLength }
};

Protocol.parseState = function(result) {
	var entityState = Protocol.parseEntityState(result.state.entityState);
	var health;
	var state;
	if (result.kind === Protocol.EntityKindPlayer || result.kind === Protocol.EntityKindBiotic) {
		health = Protocol.parseHealth(result.state.health);
		state = new BioticState(entityState, health);
	} else if (result.kind == Protocol.EntityKindWorldItem) {
		state = new WorldItemState(entityState, result.state.itemKind);
	}

	result.state = state;
};

Protocol.parseEntityState = function(result) {
	var body = Protocol.parseBody(result.body);
	return new EntityState(result.entityId, body, result.lastUpdated)
};

Protocol.parseBody = function(result) {
	var pos = Protocol.parseVec3Float(result.pos);
	var vel = Protocol.parseVec3Float(result.vel);
	var dir = Protocol.parseVec3Float(result.dir);
	var halfExtents = Protocol.parseVec3Float(result.halfExtents);
	var centerOffset = Protocol.parseVec3Float(result.centerOffset);
	return new Body(pos, vel, dir, halfExtents, centerOffset);
};

Protocol.parseVec3Float = function(result) {
	return new THREE.Vector3(result.x, result.y, result.z);
};

Protocol.parseHealth = function(result) {
	new Health(result.life)
};

Protocol.unmarshalMessage = function(offset, dataView) {
	var fields = PROTO.messages[dataView.getUint8(offset)];
	offset++;
	var type = Protocol.unmarshalFields(offset, dataView, fields);
	return { value: type.value, read: type.read + 1 };
};

Protocol.unmarshalFields = function(offset, dataView, fields) {
	var result = {};
	var totalRead = 0;
	var fieldData;
	for (var i = 0; i < fields.length; i++) {
		fieldData = Protocol.unmarshalField(offset, dataView, result, fields[i]);
		result[fields[i].name] = fieldData.value;
		offset += fieldData.read;
		totalRead += fieldData.read;
	}

	return { value: result, read: totalRead };
};

Protocol.unmarshalField = function(offset, dataView, result, field) {
	function retVal(val, off) {
		return { value: val, read: off };
	}

	var inner;
	switch (field.type) {
		case 0:
			throw "I don't know how to unmarshal this unknown field";
		case 1: // byte
			return retVal(dataView.getUint8(offset), 1);
		case 2: // slice
			return Protocol.unmarshalByteArray(offset, dataView);
		case 3: // int
			return Protocol.unmarshalInt(offset, dataView);
		case 4: // float
			return Protocol.unmarshalFloat64(offset, dataView);
		case 5: // string
			return Protocol.unmarshalString(offset, dataView);
		case 6: // bool
			return retVal(dataView.getUint8(offset) === 1, 1);
		case 7: // interface
			var struct = Protocol.unmarshalFields(offset, dataView, PROTO.kinds[result.kind]);
			result.state = struct.value;
			Protocol.parseState(result);
			return retVal(result.state, struct.read + 1);
		case 8: // struct
			inner = Protocol.unmarshalFields(offset, dataView, field.fields);
			return retVal(inner.value, inner.read);
		case 9: // message
			return Protocol.unmarshalMessage(offset, dataView);
	}
};

Protocol.marshalMessage = function(message, data) {
	var fields = PROTO.messages[message];
	var buf = new ArrayBuffer(1);
	var dataView = new DataView(buf);
	dataView.setUint8(0, message);
	if (fields.length > 0) {
		buf = Protocol.append(buf, Protocol.marshalFields(fields, data, 0).buf);
	}
	return new DataView(buf);
};

Protocol.marshalFields = function(fields, data, consumed) {
	var result = { buf: null, consumed: consumed };
	for (var i = 0; i < fields.length; i++) {
		var temp = Protocol.marshalField(fields[i], data, result.consumed);
		result.buf = (i === 0 ? temp.buf : Protocol.append(result.buf, temp.buf));
		result.consumed = temp.consumed;
	}
	return result;
};

Protocol.marshalField = function(field, data, consumed) {
	var result = { buf: null, consumed: consumed + 1 };
	var value = data[consumed];
	switch (field.type) {
		case 1: // byte
			result.buf = new ArrayBuffer(1);
			var temp = new DataView(result.buf);
			temp.setUint8(0, value);
			return result;
		case 3: // int
			result.buf = Protocol.marshalInt(Math.floor(value));
			return result;
		case 4: // float
			result.buf = Protocol.marshalFloat64(value);
			return result;
		case 5: // string
			result.buf = Protocol.marshalString(value);
			return result;
		case 8: // struct
			return Protocol.marshalFields(field.fields, data, consumed);
		default:
			throw "Field not supported for marshalling " + field.type;
	}
};

return Protocol;

});
