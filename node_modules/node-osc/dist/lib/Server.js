'use strict';

var node_dgram = require('node:dgram');
var node_events = require('node:events');
var decode = require('./internal/decode.js');

class Server extends node_events.EventEmitter {
  constructor(port, host, cb) {
    super();
    if (!cb) cb = () => {};
    let decoded;
    this.port = port;
    this.host = host;
    this._sock = node_dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this._sock.bind(port);
    this._sock.on('listening', () => {
      this.emit('listening');
      cb();
    });
    this._sock.on('message', (msg, rinfo) => {
      try {
        decoded = decode(msg);
      }
      catch (e) {
        const error = new Error(`can't decode incoming message: ${e.message}`);
        this.emit('error', error, rinfo);
        return;
      }
      if (decoded.elements) {
        this.emit('bundle', decoded, rinfo);
      }
      else if (decoded) {
        this.emit('message', decoded, rinfo);
        this.emit(decoded[0], decoded, rinfo);
      }
    });
  }
  close(cb) {
    this._sock.close(cb);
  }
}

module.exports = Server;
