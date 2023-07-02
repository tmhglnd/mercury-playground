'use strict';

var node_dgram = require('node:dgram');
var oscMin = require('osc-min');
var Message = require('./Message.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var oscMin__default = /*#__PURE__*/_interopDefaultLegacy(oscMin);

const { toBuffer } = oscMin__default["default"];

class Client {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this._sock = node_dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
  }
  close(cb) {
    this._sock.close(cb);
  }
  send(...args) {
    let message = args[0];
    let callback;
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }
    else {
      callback = () => {};
    }

    if (message instanceof Array) {
      message = {
        address: message[0],
        args: message.splice(1)
      };
    }
    
    let mes;
    let buf;
    try {
      switch (typeof message) {
        case 'object':
          buf = toBuffer(message);
          this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          break;
        case 'string':
          mes = new Message(args[0]);
          for (let i = 1; i < args.length; i++) {
            mes.append(args[i]);
          }
          buf = toBuffer(mes);
          this._sock.send(buf, 0, buf.length, this.port, this.host, callback);
          break;
        default:
          throw new TypeError('That Message Just Doesn\'t Seem Right');
      }
    }
    catch (e) {
      if (e.code !== 'ERR_SOCKET_DGRAM_NOT_RUNNING') throw e;
      const error = new ReferenceError('Cannot send message on closed socket.');
      error.code = e.code;
      callback(error);
    }
  }
}

module.exports = Client;
