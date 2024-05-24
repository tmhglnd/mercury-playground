var jazz = require('.');
console.log('Node.js version:', process.versions.node);
console.log('Package version:', jazz.package.version);
console.log('Jazz-MIDI version:', jazz.version);
console.log('isJazz:', jazz.isJazz);
console.log('midi.out:', jazz.Support('midi.out'));
console.log('midi.in:', jazz.Support('midi.in'));
console.log('Supported functions:');
console.log(jazz.Support());
console.log('MIDI-Out ports:');
console.log(jazz.MidiOutList());
console.log('MIDI-In ports:');
console.log(jazz.MidiInList());

var count = 0;
var outs = jazz.MidiOutList();
var ins = jazz.MidiInList();
var ports = [];

function test_midi_out() {
 if (count < outs.length) {
  var name = outs[count];
  count++;
  var port = new jazz.MIDI();
  if (port.MidiOutOpen(name) != name) {
   console.log('Testing:', name, '- Cannot open!');
   setTimeout(test_midi_out, 0);
  } else {
   console.log('Testing:', name, '- OK!');
   port.MidiOut(0x90, 60, 100); port.MidiOut(0x90, 64, 100); port.MidiOut(0x90, 67, 100);
   ports.push(port);
   setTimeout(test_midi_out, 3000);
  }
 } else {
  for (var i in ports) {
   ports[i].MidiOut(0x80, 60, 0); ports[i].MidiOut(0x80, 64, 0); ports[i].MidiOut(0x80, 67, 0);
   ports[i].MidiOutClose();
  }
  test_midi_in();
 }
}

function test_midi_in(){
 ports = [];
 console.log('\n=== MIDI-In test ===');
 if (!ins.length) {
  console.log('No MIDI-In ports found.');
  close_midi_in();
  return;
 }
 for (var i in ins) {
  var name = ins[i];
  var port = new jazz.MIDI();
  var call = function(str) {
   return function(t, a) {
    for(var i in a) a[i] = (a[i] < 16 ? '0' : '') + a[i].toString(16);
    console.log(str + ':\t' + a.join(' '));
   };
  }(name);
  if (port.MidiInOpen(name, call) == name) {
   console.log('Opening:', name, '- OK!');
   ports.push(port);
  } else {
   console.log('Opening:', name, '- Cannot open!');
  }
 }
 setTimeout(close_midi_in, 10000);
}

function close_midi_in() {
 for (var i in ports) ports[i].MidiInClose();
 console.log('\nThank you for using Jazz-MIDI!');
}

console.log('\n=== MIDI-Out test ===');
if (outs.length) {
 test_midi_out();
} else {
 console.log('No MIDI-Out ports found.');
 test_midi_in();
}
