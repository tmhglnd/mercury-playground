
const CodeMirror = require('codemirror');
const code = require('./worker.js');
const saver = require('file-saver');

// require('codemirror/lib/codemirror.css');
// require('codemirror/theme/ayu-dark.css');
// require('codemirror/theme/material-darker.css');
// require('codemirror/theme/base16-dark.css');
// require('codemirror/theme/material-ocean.css');
// require('codemirror/theme/moxer.css');	

require('codemirror/mode/javascript/javascript.js');
require('codemirror/addon/mode/simple.js');
require('codemirror/addon/comment/comment.js');
require('codemirror/addon/hint/show-hint.js');
require('codemirror/addon/hint/anyword-hint.js');

const defaultTheme = 'material-darker';

let _rand;

// get the example code files
console.log('loading examples...');
let examples = require('./data/examples.json');
console.log('=> examples loaded');

// get the tutorial files
console.log('loading tutorials...');
let tutorials = require('./data/tutorials.json');
const { ToneAudioBuffer } = require('tone');
console.log('=> tutorials loaded');

// the simple mode lexer for Mercury syntax-highlighting
CodeMirror.defineSimpleMode("mercury", {
	meta: {
		lineComment: '//'
	},
	start: [
		// string
		{ regex: /["'`](?:\\["\\]|[^\n"'``])*["'`]/, token: "string" },
		// keywords
		{ regex: /(?:new |make |add |ring |list |array |set |apply |give )\b/, token: "keyword", next: "object" },
		// global
		{ regex: /(?:print|post|log|audio|record|silence|mute|killAll|default)\b/, token: "variable-2" },
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

// CodeMirror.commands.autocomplete = function(cm) {
// 	cm.showHint({hint: CodeMirror.hint.anyword});
// }

var WORD = /[\w$]+/, RANGE = 500;

CodeMirror.registerHelper("hint", "anyword", function(editor, options) {

	var word = options && options.word || WORD;
	var range = options && options.range || RANGE;
	var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
	var end = cur.ch, start = end;
	
	// while (start && word.test(curLine.charAt(start - 1))) --start;
	// 	var curWord = start != end && curLine.slice(start, end);

	// 	var list = options && options.list || [], seen = {};
	// 	var re = new RegExp(word.source, "g");
	// 	for (var dir = -1; dir <= 1; dir += 2) {
	// 		var line = cur.line, endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
	// 		for (; line != endLine; line += dir) {
	// 			var text = editor.getLine(line), m;
	// 			while (m = re.exec(text)) {
	// 				if (line == cur.line && m[0] === curWord) continue;
	// 				if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
	// 				seen[m[0]] = true;
	// 				list.push(m[0]);
	// 				}
	// 			}
	// 		}
	// 	}
	list = ['new', 'set', 'synth'];
	return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
});

const Editor = function({ context, engine, canvas }) {
	// this._engine = engine;
	console.log('=> Created Editor()');

	// let container = document.createElement('div');
	// container.id = 'code-editor';
	let container = document.getElementById('code-editor');
	let text = document.createElement('textarea');
	// document.body.appendChild(container);
	container.appendChild(text);

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
		// keymaps for execute/stopping/commenting code
		extraKeys: {
			'Ctrl-/': 'toggleComment',
			'Ctrl-Enter': () => { this.evaluate() },
			'Ctrl-.': () => { this.silence() },
			'Alt-/': 'toggleComment',
			'Alt-Enter': () => { this.evaluate() },
			'Alt-.': () => { this.silence() },
			'Tab': 'insertSoftTab',
			'Ctrl-,': 'autocomplete',
		},
	}

	this.cm = CodeMirror.fromTextArea(text, this.options);

	this.cm.markText({line: 0, ch: 0}, {line: 6, ch: 42}, {className: 'styled-background'})

	this.cm.on('change', () => { 
		//console.log('hi')
		// this.cm.execCommand('autocomplete');
		// this.cm.showHint();
		setTimeout(() => { this.cm.execCommand('autocomplete'), 10 }); 
	});

	this.set = async function(v){
		this.cm.setValue(v);
	}

	this.get = function(){
		return this.cm.getValue();
	}

	this.clear = function(){
		// this.cm.setValue('// start coding here ^^');
		this.set(
			'// Welcome to the Mercury Playground ^^\n' + 
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

	this.evaluate = async function(){
		this.flash();

		// console.log('evaluating code...');
		await code({ file: this.cm.getValue(), engine: engine, canvas: canvas });
		await engine.resume();
	}

	this.flash = async function(){
		let start = { line: this.cm.firstLine(), ch: 0 };
		let end = { line: this.cm.lastLine()+1, ch: 0 };
		// console.log(start, end);

		let marker = this.cm.markText(start, end, { className: 'editorFlash' });

		setTimeout(() => marker.clear(), 250);
	}

	this.silence = async function(){
		// console.log('silence code');
		await engine.silence();
		canvas.clear();
	}

	this.changeTheme = function(){
		let t = document.getElementById('themes').value;
		this.cm.setOption('theme', t);
		// cEditor.setOption('theme', t);
	}

	// play/silence/empty buttons
	this.controls = function(){
		let div = document.getElementById('menu');
		let play = document.createElement('button');
		play.innerHTML = 'play';
		play.onclick = () => { this.evaluate() };

		let stop = document.createElement('button');
		stop.innerHTML = 'silence';
		stop.onclick = () => { this.silence() };

		let clear = document.createElement('button');
		clear.innerHTML = 'empty';
		clear.onclick = () => { 
			this.set(''); 
			this.silence(); 
		};
		
		let example = document.createElement('button');
		example.innerHTML = 'example';
		example.onclick = async () => {
			// initialize editor with some code
			let names = Object.keys(examples);
			let amount = names.length;
			let rand = Math.floor(Math.random() * amount);
			rand = (rand === _rand)? (rand + 1) % amount : rand;

			await this.set(examples[names[rand]]);
			_rand = rand;

			this.evaluate();
		};

		let save = document.createElement('button');
		save.innerHTML = 'download';
		save.onclick = () => {
			let f = `mercury-sketch_${date()}.txt`
			saver.saveAs(new File([this.cm.getValue()], f, { type: 'text/plain;charset=utf-8' }));
		}

		div.appendChild(play);
		div.appendChild(stop);
		div.appendChild(clear);
		div.appendChild(example);
		div.appendChild(save);
	}

	this.links = function(){
		let urls = {
			// 'tutorial': 'https://tmhglnd.github.io/mercury/tutorial.html',
			'sounds' : 'https://github.com/tmhglnd/mercury/blob/master/mercury_ide/media/README.md',
			'help': 'https://tmhglnd.github.io/mercury/reference.html',
			'full version': 'https://github.com/tmhglnd/mercury'
		}

		let div = document.getElementById('links');
		let p = document.createElement('p');
		div.appendChild(p);

		let menu = document.createElement('select');
		menu.id = 'tutorials';
		menu.onchange = () => { this.loadTutorial() }
		p.appendChild(menu);

		Object.keys(urls).forEach((k) => {
			let btn = document.createElement('button');
			btn.innerHTML = k;
			btn.onclick = () => {
				window.open(urls[k], '_blank');
			}
			p.appendChild(btn);
		});

		let load = document.createElement('button');
		load.innerHTML = 'add sounds';
		load.onclick = () => {
			input.click();
		}
		let input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		input.multiple = true;
		input.onchange = (e) => {
			if (e.target.files.length > 0){
				engine.addBuffers(e.target.files);
			}
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

	this.loadTutorial = async function(){
		let t = document.getElementById('tutorials').value;
		await this.set(tutorials[t]);
		this.evaluate();
	}

	this.menuHidden = false;

	this.hide = function(){
		let div = document.getElementById('hide');
		let p = document.createElement('p');
		div.appendChild(p);

		let btn = document.createElement('button');
		btn.innerHTML = 'hide menu';
		btn.onclick = () => {
			this.menuHidden = !this.menuHidden;

			let divs = [ 'header', 'settings', 'menu', 'links', 'hydra-ui' ];
			for (let i=0; i<divs.length; i++){
				let d = document.getElementById(divs[i]);
				d.style.display = this.menuHidden ? 'none' : 'inline';
			}
			btn.innerHTML = this.menuHidden ? 'show menu' : 'hide menu';
		}
		p.appendChild(btn);
	}

	// theme menu for editor
	this.themeMenu = function(){
		let div = document.getElementById('menu');
		let menu = document.createElement('select');
		menu.id = 'themes';
		menu.onchange = () => { this.changeTheme() };
		
		let themes = ['ayu-dark', 'base16-dark', 'material-darker', 'material-ocean', 'moxer', 'tomorrow-night-eighties'];

		for (let t in themes){
			let option = document.createElement('option');
			option.value = themes[t];
			option.innerHTML = themes[t];
			menu.appendChild(option);
		}
		div.appendChild(menu);

		menu.value = defaultTheme;
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