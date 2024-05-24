//// testing the 'webmidi' engine

global.window = global;
var _startTime = Date.now();
global.performance = { now: function() { return Date.now() - _startTime; } };

var WMT = require('web-midi-test');
WMT.sysex = false;
global.navigator = WMT;

var JZZ = require('..');

global.document = {
  handle: {},
  addEventListener: function(name, handle) { this.handle[name] = handle; },
  removeEventListener: function(name /*, handle*/) { delete this.handle[name]; },
};
window.dispatchEvent = function(evt) { if (document.handle[evt.name]) document.handle[evt.name](); };
window.webkitAudioContext = function() {
  return {
    resume: function() { this.state = 'running'; },
    close: function() { this.state = 'closed'; },
    createOscillator: function() { return { connect: function() {}, noteOn: function() {}, noteOff: function() {} }; },
    createGainNode: function() { return { connect: function() {}, gain: { setTargetAtTime: function() {} } }; }
  };
};

//var test = require('./tests.js')(JZZ, { engine: 'webmidi', sysex: true, degrade: true }, WMT);

//console.log('CHECKPOINT 1');

JZZ({ engine: 'webmidi', sysex: true, degrade: true }).wait(0).wait(1).and(function() {
  console.log(this.info());
  console.log('engine:', this.info().engine);
});