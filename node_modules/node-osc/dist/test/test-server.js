'use strict';

var tap = require('tap');
var util = require('./util.js');
var nodeOsc = require('node-osc');

tap.beforeEach(util.bootstrap);

tap.test('server: create and close', (t) => {
  t.plan(1);
  const oscServer = new nodeOsc.Server(t.context.port, '127.0.0.1');
  oscServer.close((err) => {
    t.error(err);
  });
});

tap.test('client: listen to message', (t) => {
  const oscServer = new nodeOsc.Server(t.context.port, '127.0.0.1');
  const client = new nodeOsc.Client('127.0.0.1', t.context.port);

  t.plan(3);

  t.teardown(() => {
    oscServer.close();
    client.close();
  });

  oscServer.on('message', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });
  
  oscServer.on('/test', (msg) => {
    t.same(msg, ['/test'], 'We should receive expected payload');
  });

  client.send('/test', (err) => {
    t.error(err, 'there should be no error');
  });
});

tap.test('server: bad message', (t) => {
  t.plan(2);
  const oscServer = new nodeOsc.Server(t.context.port, '127.0.0.1');
  t.throws(() => {
    oscServer._sock.emit('message', 'whoops');
  }, /can't decode incoming message:/);
  oscServer.close((err) => {
    t.error(err);
  });
});
