
const CodeMirror = require('codemirror');
const { code, removeSound, getSound } = require('./worker.js');
const saver = require('file-saver');

require('codemirror/mode/javascript/javascript.js');
require('codemirror/addon/mode/simple.js');
require('codemirror/addon/comment/comment.js');

const defaultTheme = 'material-darker';

let _rand;

// get the example code files
console.log('loading examples...');
let examples = require('./data/examples.json');
console.log('=> examples loaded');

// get the tutorial files
console.log('loading tutorials...');
let tutorials = require('./data/tutorials.json');
console.log('=> tutorials loaded');

let samples = require('./data/samples.json');
const { mod } = require('total-serialism/src/utility.js');

// the simple mode lexer for Mercury syntax-highlighting
CodeMirror.defineSimpleMode("mercury", {
	meta: {
		lineComment: '//'
	},
	start: [
		// string
		{ regex: /["'`](?:\\["\\]|[^\n"'``])*["'`]/, token: "string" },
		// keywords
		{ regex: /(?:new|make|ring|list|array|set|apply|give)\b/, token: "keyword", next: "object" },
		// global
		{ regex: /(?:print|post|log|display|view|audio|record|silence|mute|killAll|default)\b/, token: "operator" },
		// numbers
		{ regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i, token: "number" },
		// comments
		{ regex: /(?:\/\/|\$).*?$/, token: "comment" },
		// osc-addresses
		{ regex: /(\/[^0-9/\s)][^/)\s]*){1,}/, token: "string" },
		// operators
		{ regex: /[-+\/*=:]+/, token: "number" },
		// brackets for array
		{ regex: /[\[\]<>!]+/, token: "operator" },
		// parenthesis for functions
		{ regex: /[()]/, token: "variable-3" }
	], 
	object: [
		// instrument and variable names after keywords
		{ regex: /[^0-9\s][^\s\(\)\[\]]*/, token: "tag", next: "start" }
	]
});

const Editor = function({ context, engine, canvas, p5canvas }) {
	// this._engine = engine;
	console.log('=> Created Editor()');

	// let container = document.createElement('div');
	// container.id = 'code-editor';
	this.container = document.getElementById('code-editor');
	let text = document.createElement('textarea');
	// document.body.appendChild(container);
	this.container.appendChild(text);
	this.container.style.opacity = 1;

	this.options = {
		// options for the editor
		cursorHeight: 0.85,
		cursorWidth: 0.5,
		lineNumbers: true,
		theme: defaultTheme,
		cursorHeight: 1,
		indentUnit: 4,
		indentWithTabs: false,
		firstLineNumber: 1,
		undoDepth: 50,
		cursorScrollMargin: 20,
		mode: "mercury",
		showCursorWhenSelecting: true,
		lineWrapping: true,
		// keymaps for execute/stopping/commenting code
		extraKeys: {
			'Tab': 'insertSoftTab',
			'Ctrl-/': 'toggleComment',
			'Alt-/': 'toggleComment',
			'Shift-Ctrl-7': 'toggleComment',
			'Shift-Alt-7': 'toggleComment',
			'Ctrl-Enter': () => { this.evaluate() },
			'Alt-Enter': () => { this.evaluate() },
			'Ctrl-.': () => { this.silence() },
			'Alt-.': () => { this.silence() },
			'Alt-R': () => { this.randomize() },
			'Ctrl-R': () => { this.randomize() },
			'Shift-Alt-Enter': () => { this.evaluateBlock() },
			'Shift-Ctrl-Enter': () => { this.evaluateBlock() },
			'Shift-Alt-H': () => { this.hideEditor() },
			'Shift-Ctrl-H': () => { this.hideEditor() },
			'Shift-Ctrl-E': () => { this.set('') },
			'Shift-Alt-E': () => { this.set('') },
			'Shift-Ctrl-X': () => { this.example() },
			'Shift-Alt-X': () => { this.example() },
			'Shift-Ctrl-S': () => { this.save() },
			'Shift-Alt-S': () => { this.save() },
			'Shift-Ctrl-R': () => { this.record() },
			'Shift-Alt-R': () => { this.record() },
			'Shift-Ctrl-D': () => { document.getElementById('switch').click() },
			'Shift-Alt-D': () => { document.getElementById('switch').click() },
			// 'Shift-Ctrl-T': () => { 
				// let e = new Event('click');
				// console.log('tutorials!');
				// document.getElementById('recButton').click();
				// b.dispatchEvent(e);
			// }
			// 'Ctrl-S': () => { this.tutorial() } open tutorial menu ???
			// 'Ctrl-S': () => { this.sounds() } open sounds menu ???
			'Shift-Ctrl-P' : () => { 
				document.getElementById('help').click() },
			'Shift-Alt-P' : () => { 
				document.getElementById('help').click() },
			'Shift-Ctrl-C': () => { 
				document.getElementById('collaborate').click() },
			'Shift-Alt-C': () => { 
				document.getElementById('collaborate').click() },
			'Shift-Ctrl-A': () => { this.addSounds() },
			'Shift-Alt-A': () => { this.addSounds() },
			'Shift-Ctrl-Z': () => { document.getElementById('zen').click() },
			'Shift-Alt-Z': () => { document.getElementById('zen').click() }
			// 'Ctrl-S': () => { this.hydra() }
		}
	}

	this.cm = CodeMirror.fromTextArea(text, this.options);

	this.cm.markText({line: 0, ch: 0}, {line: 6, ch: 42}, {className: 'styled-background'})

	this.set = function(v){
		// get the current cursor position
		let crs = this.cm.getCursor();
		// change the text content of the editor
		this.cm.setValue(v);
		// place the cursor back where it was
		this.cm.setCursor(crs);
	}

	this.setHash = function(v){
		// set the code from a hash
		this.set(hash2code(v.substr(1)));
	}

	this.get = function(){
		return this.cm.getValue();
	}

	this.clear = function(){
		// this.cm.setValue('// start coding here ^^');
		this.set(
			'// Welcome to the Mercury Playground! ^^\n' + 
			'// click "play" to start the sound and start coding\n' +
			'// or open the tutorials or a random example\n' +
			'\n' +
			'list kickBeat [1 0.01 0.1 1 0]\n' +
			'new sample kick_house time(1/16) play(kickBeat)\n' +
			'new sample snare_hvy time(1/2 1/4)\n' +
			'\n' +
			'new synth saw time(1/16) shape(1 1/20) name(bass) note([0 3 7] 0)\n' +
			'    set bass fx(filter low random(5 50 5000) 0.2)\n' +
			'    set bass fx(delay 2/16 3/16 0.9) super(0.13212 5)\n'
		);
	}

	this.randomize = function(){
		// regex to find variable numbers/divisions
		// first check for comments, tempo, keywords, then filter the numbers/divisions
		let tokens = /\/\/.+|tempo.+|out[^\)]+\)|[A-Za-z_-]+[A-Za-z0-9]*|[0-9]+[0-9:/.]*/g;
		// updated with latest find
		let find;
		// code from the editor
		let code = this.get();
		// percentage of change for the numbers (+/-)
		let deviation = 0.2;

		// check the code for all instances of the variables
		while ((find = tokens.exec(code)) !== null) {
			let v = find[0];
			let rnd = Math.random();
			let sign = (Math.random() > 0.5) * 2 - 1;
			// check type of found value (Integer, Float, Division)
			if (isNaN(v)){
				if (v.match(/^[0-9]+\/[0-9]+/)){
					v = v.split('/').map(x => Number(x));

					// choose either numerator or denominator to change
					if (Math.random() < 0.75){
						let dQ = Math.log2(v[1]);
						let dT = Math.log2(v[1]/3);
						if (Number.isInteger(dQ)){
							v[1] = 2 ** Math.min(5, Math.max(0, Math.round(dQ + rnd * sign)));
						} else if (Number.isInteger(dT)){
							v[1] = 2 ** Math.min(3, Math.max(0, Math.round(dT + rnd * sign))) * 3;
						} else {
							v[1] = Math.max(1, Math.round(v[1] + rnd));
						}
					} else {
						v[0] = Math.max(1, v[0] + (rnd < 0.5) * sign);
					}
					// v = find[0];
					v = `${v[0]}/${v[1]}`;
				}
				// if not a number check for division
			} else {
				v = Number(v);
				let _v = v + v * deviation * rnd * sign;
				v = Number.isInteger(v) ? _v.toFixed(0) :_v.toFixed(3);
			}
			// add the random value on the location of the found number
			code = code.substring(0, find.index) + v + code.substring(tokens.lastIndex);
			// update the lastIndex to account for length change in code string
			tokens.lastIndex = find.index + v.length;
		}
		// update the code in the editor
		this.set(code);
		// evaluate the new code
		// this.evaluate();
	}

	this.evaluate = function(){
		this.flash(this.cm.firstLine(), this.cm.lastLine()+1);

		code({ file: this.cm.getValue(), engine: engine, canvas: canvas, p5canvas: p5canvas });
		engine.resume();
		
		// store code in localstorage upon evaluating
		localStorage.setItem('code', this.cm.getValue());

		// convert to base64 and append to url
		let href = document.location.href.split('#')[0];
		let url = `${href}#${code2hash(this.cm.getValue())}`;
		window.history.pushState({}, "", url);
	}

	this.evaluateBlock = function(){
		let c = this.getCurrentBlock();
		this.flash(c.start.line, c.end.line);

		code({ file: c.text, engine: engine, canvas: canvas, p5canvas: p5canvas });
		engine.resume();
	}

	// thanks to graham wakefield + gibber
	this.getCurrentBlock = function(){ 
		let pos = this.cm.getCursor();
		let start = pos.line;
		let end = pos.line;
		while (start > 0 && this.cm.getLine(start) !== '') {
			start--;
		}
		while (end < this.cm.lineCount() && this.cm.getLine(end) !== '') {
			end++;
		}
		let p1 = { line: start, ch: 0 };
		let p2 = { line: end, ch: 0};
		let block = this.cm.getRange(p1, p2);

		return { start: p1, end: p2, text: block };
	}

	this.flash = function(from, to){
		let start = { line: from, ch: 0 };
		let end = { line: to, ch: 0 };
		// console.log(start, end);

		let marker = this.cm.markText(start, end, { className: 'editorFlash' });

		setTimeout(() => marker.clear(), 250);
	}

	this.silence = function(){
		// console.log('silence code');
		// fade out and remove code after 0.1
		removeSound(getSound(), 0.1);
		engine.silence();
		canvas.clear();
	}

	// hide the editor on shortkey
	this.hideEditor = function(){
		if (this.container.style.opacity == 1){
			this.container.style.opacity = 0;
		} else {
			this.container.style.opacity = 1;
		}
	}

	this.changeTheme = function(){
		let t = document.getElementById('themes').value;
		this.cm.setOption('theme', t);
		// cEditor.setOption('theme', t);
	}

	this.example = function(){
		// initialize editor with some code
		let names = Object.keys(examples);
		let amount = names.length;
		let rand = Math.floor(Math.random() * amount);
		rand = (rand === _rand)? (rand + 1) % amount : rand;

		this.set(examples[names[rand]]);
		_rand = rand;

		this.evaluate();
	}

	this.save = function(){
		let f = `mercury-sketch_${ date() }`;
		saver.saveAs(new File([this.cm.getValue()], `${f}.txt`, { type: 'text/plain;charset=utf-8' }));
	}

	this.record = function(){
		let f = `mercury-recording_${ date() }`;
		let r = document.getElementById('recButton');

		if (engine.isRecording() !== 'started'){
			engine.record(true);
			r.className = 'recording';
		} else {
			engine.record(false, f);
			r.className = 'button';
		}
	}

	this.addSounds = function(){
		let input = document.createElement('input');
		// input.id = 'load';
		input.style.display = 'none';
		input.type = 'file';
		input.multiple = true;
		input.onchange = (e) => {
			if (e.target.files.length > 0){
				engine.addBuffers(e.target.files);
			}
		}
		input.click();
	}

	// play/silence/empty/example/save/record buttons
	this.controls = function(){
		let div = document.getElementById('menu');
		let play = document.createElement('button');
		play.innerHTML = 'play';
		play.title = 'Evaluate code (Alt/Ctrl-Enter)';
		play.onclick = () => { this.evaluate() }

		let stop = document.createElement('button');
		stop.innerHTML = 'silence';
		stop.title = 'Stop sound (Alt/Ctrl-.)';
		stop.onclick = () => { this.silence() }

		let clear = document.createElement('button');
		clear.id = 'emptyButton';
		clear.innerHTML = 'empty';
		clear.title = 'Empty editor (Alt/Ctrl-Shift-E)';
		clear.onclick = () => { 
			this.set(''); 
			this.silence(); 
		};
		
		let example = document.createElement('button');
		example.innerHTML = 'example';
		example.title = 'Open random example (Alt/Ctrl-Shift-X)';
		example.onclick = () => { this.example() }

		let save = document.createElement('button');
		save.style.width = '9%';
		save.innerHTML = 'save';
		save.title = 'Download code as text (Alt/Ctrl-Shift-S)';
		save.onclick = () => { this.save() }
		
		let rec = document.createElement('button');
		rec.id = 'recButton';
		rec.style.width = '9%';
		rec.innerHTML = 'record';
		rec.title = 'Start/Stop recording sound (Alt/Ctrl-Shift-R)';
		rec.onclick = () => { this.record() }

		div.appendChild(play);
		div.appendChild(stop);
		div.appendChild(clear);
		div.appendChild(example);
		div.appendChild(save);
		div.appendChild(rec);
	}

	this.links = function(){
		let div = document.getElementById('links');
		let p = document.createElement('p');
		div.appendChild(p);

		let menu = document.createElement('select');
		menu.id = 'tutorials';
		menu.onchange = () => { this.loadTutorial() }
		p.appendChild(menu);

		let snds = document.createElement('select');
		snds.id = 'sounds';
		snds.onchange = () => { this.insertSound() }
		p.appendChild(snds);

		let help = document.createElement('button');
		help.id = help.innerHTML = 'help';
		help.title = 'Open the documentation (Alt/Ctrl-Shift-P)';
		help.onclick = () => { 
			window.open('https://tmhglnd.github.io/mercury/docs/', '_blank');
		}
		p.appendChild(help);
		
		let collab = document.createElement('button');
		collab.id = collab.innerHTML = 'collaborate';
		collab.title = 'Collaborate in flok.cc (Alt/Ctrl-Shift-C)';
		collab.onclick = () => {
			window.open('https://flok.cc', '_blank');
		}
		p.appendChild(collab);

		let load = document.createElement('button');
		load.id = 'load';
		load.innerHTML = 'add sounds';
		load.title = 'Load sounds from the computer (Alt/Ctrl-Shift-A)'
		// load.innerHTML = 'settings';
		load.onclick = () => {
			this.addSounds();
			// input.click();
			// let modal = document.getElementById('modalbox');
			// modal.style.display = "block";
		}
		p.appendChild(load);
	}

	this.tutorialMenu = function(){
		let menu = document.getElementById('tutorials');

		Object.keys(tutorials).forEach((t) => {
			let option = document.createElement('option');
			option.value = t;
			option.innerHTML = t.split('-').join(' ');
			menu.appendChild(option);
		});
	}

	this.loadTutorial = function(){
		let t = document.getElementById('tutorials').value;
		this.set(tutorials[t]);
		this.evaluate();
	}

	this.soundsMenu = function(){
		let menu = document.getElementById('sounds');

		let values = ['sounds'].concat(Object.keys(samples));
		values.forEach((t) => {
			let option = document.createElement('option');
			option.value = option.innerHTML = t;
			menu.appendChild(option);
		});
	}

	this.insertSound = function(){
		let s = document.getElementById('sounds').value;
		document.getElementById('sounds').value = 'sounds';
		// console.log(this.cm.getSelection());
		if (this.cm.getSelection() !== ''){
			this.cm.replaceSelection(s);
		} else {
			this.cm.replaceRange(s, this.cm.getCursor());
		}
	}

	this.menuHidden = false;

	this.hide = function(){
		let div = document.getElementById('hide');
		let p = document.createElement('p');
		div.appendChild(p);

		let btn = document.createElement('button');
		btn.innerHTML = 'zen mode';
		btn.id = 'zen';
		btn.title = 'Hide or show the menu bars (Alt/Ctrl-Shift-Z)';
		btn.onclick = () => {
			this.menuHidden = !this.menuHidden;

			let divs = [ 'header', 'settings', 'menu', 'links', 'hydra-ui', 'switch' ];
			for (let i=0; i<divs.length; i++){
				let d = document.getElementById(divs[i]);
				d.style.display = this.menuHidden ? 'none' : 'inline';
			}
			btn.innerHTML = this.menuHidden ? 'exit zen mode' : 'zen mode';
		}
		p.appendChild(btn);
	}

	// theme menu for editor
	// this.themeMenu = function(){
	// 	let div = document.getElementById('menu');
	// 	let menu = document.createElement('select');
	// 	menu.id = 'themes';
	// 	menu.onchange = () => { this.changeTheme() };
		
	// 	let themes = ['ayu-dark', 'base16-dark', 'material-darker', 'material-ocean', 'moxer', 'tomorrow-night-eighties', 'panda-syntax', 'yonce'];

	// 	let lightThemes = ['elegant', 'duotone-light', 'base16-light']

	// 	for (let t in themes){
	// 		let option = document.createElement('option');
	// 		option.value = themes[t];
	// 		option.innerHTML = themes[t];
	// 		menu.appendChild(option);
	// 	}
	// 	div.appendChild(menu);

	// 	menu.value = defaultTheme;
	// }

	// settings menu with more options and some explanation
	this.settingsMenu = function(){
		let modal = document.getElementById('modalbox');
		// let m = document.createElement('div');
		// m.className = "settings-menu";
		let m = document.getElementsByClassName('settings-menu')[0];
		m.innerHTML = `
		<span class="close">&times;</span>
		<p>
			Theme <select id="themes" style="width:30%"></select>
		</p>`;

		let menu = document.getElementById('themes');
		menu.onchange = () => { this.changeTheme() };

		let themes = ['ayu-dark', 'base16-dark', 'material-darker', 'material-ocean', 'moxer', 'tomorrow-night-eighties', 'panda-syntax', 'yonce'];

		// 	let lightThemes = ['elegant', 'duotone-light', 'base16-light']
		
		for (let t=0; t<themes.length; t++){
			let option = document.createElement('option');
			option.value = themes[t];
			option.innerHTML = themes[t];
			menu.appendChild(option);
		}
		menu.value = defaultTheme;

		// close the window when clicking the cross or outside of the box
		let span = document.getElementsByClassName('close')[0];
		span.onclick = () => modal.style.display = "none";
		
		window.onclick = (event) => {
			if (event.target === modal) modal.style.display = "none";
		}
		modal.appendChild(m);
	}

	// light/dark mode switcher
	this.modeSwitch = function(){
		// let b = document.body;
		let b = document.getElementById('ui');
		let btn = document.createElement('button');
		btn.id = 'switch';
		btn.className = 'themeswitch';
		btn.title = 'Switch display mode Ctrl/Alt-Shift-D';
		btn.onclick = () => {
			if (localStorage.getItem('theme') === 'darkmode'){
				switchTheme('lightmode');
				this.cm.setOption('theme', 'elegant');
			} else {
				switchTheme('darkmode');
				this.cm.setOption('theme', 'material-darker');
			}
		}
		b.appendChild(btn);
	}
}
module.exports = Editor;

function date(){
	let now = new Date();
	let dd = String(now.getDate()).padStart(2, '0');
	let mm = String(now.getMonth()+1).padStart(2, '0');
	let yyyy = now.getFullYear();
	let hh = String(now.getHours()).padStart(2, '0');
	let mi = String(now.getMinutes()).padStart(2, '0');
	let ss = String(now.getSeconds()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}_${hh}.${mi}.${ss}`
}

// 
// Thanks to https://github.com/tidalcycles/strudel/blob/main/website/src/repl/helpers.mjs !!!
// 
function code2hash(code) {
	const utf8Bytes = new TextEncoder().encode(code);
	const base64String = btoa(String.fromCharCode(...utf8Bytes));
	return encodeURIComponent(base64String);
}

function hash2code(hash) {
	const utf8Bytes = new Uint8Array(
		atob(decodeURIComponent(hash))
		.split('')
		.map((char) => char.charCodeAt(0)),
	);
	const decodedText = new TextDecoder().decode(utf8Bytes);
	return decodedText;
}

// the codemirror editor
// let editor = CodeMirror.fromTextArea(document.getElementById('code'), options);

// keymaps for execute/stopping/commenting code
// editor.setOption();

// options['readOnly'] = "nocursor";
// options['mode'] = "none";
// let cEditor = CodeMirror.fromTextArea(document.getElementById('console'), options);

// function changeTheme(){
// 	let t = document.getElementById('themes').value;
// 	editor.setOption('theme', t);
// 	cEditor.setOption('theme', t);
// }