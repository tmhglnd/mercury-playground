
const CodeMirror = require('codemirror');
const { AutoFilter } = require('tone');
const code = require('./worker.js');

// require('codemirror/lib/codemirror.css');
// require('codemirror/theme/ayu-dark.css');
// require('codemirror/theme/material-darker.css');
// require('codemirror/theme/base16-dark.css');
// require('codemirror/theme/material-ocean.css');
// require('codemirror/theme/moxer.css');	

require('codemirror/mode/javascript/javascript.js');
require('codemirror/addon/mode/simple.js');
require('codemirror/addon/comment/comment.js');

const defaultTheme = 'moxer';

// the simple mode lexer for Mercury syntax-highlighting
CodeMirror.defineSimpleMode("mercury", {
	meta: {
		lineComment: '//'
	},
	start: [
		// string
		{ regex: /["'`](?:\\["\\]|[^\n"'``])*["'`]/, token: "string" },
		// keywords
		{ regex: /(?:new|make|add|ring|list|array|set|apply|give)\b/, token: "keyword", next: "object" },
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

const Editor = function({ context, engine }) {
	// this._engine = engine;

	console.log('=> Created Editor()');

	let container = document.createElement('div');
	container.id = 'code-editor';
	let text = document.createElement('textarea');
	document.body.appendChild(container);
	container.appendChild(text);

	this.options = {
		// options for the editor
		cursorHeight: 0.85,
		lineNumbers: true,
		theme: defaultTheme,
		cursorHeight: 1,
		indentUnit: 4,
		firstLineNumber: 0,
		undoDepth: 50,
		cursorScrollMargin: 20,
		mode: "mercury",
		// keymaps for execute/stopping/commenting code
		extraKeys: {
			'Ctrl-/': 'toggleComment',
			'Ctrl-Enter': () => { this.evaluate() },
			'Ctrl-.': () => { this.silence() },
			'Alt-/': 'toggleComment',
			'Alt-Enter': () => { this.evaluate() },
			'Alt-.': () => { this.silence() },
		}
	}

	this.cm = CodeMirror.fromTextArea(text, this.options);

	this.set = function(v){
		this.cm.setValue(v);
	}

	this.get = function(){
		return this.cm.getValue();
	}

	this.clear = function(){
		this.cm.setValue('// start coding here ^^');
	}

	this.evaluate = function(){
		console.log('evaluating code...');
		engine.resume();
		code({ file: this.cm.getValue(), engine: engine });
	}

	this.silence = function(){
		console.log('silence code');
		engine.silence();
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
		example.onclick = () => {
			// initialize editor with some code
			this.set(
				'// Welcome to the Mercury Playground ^^\n' + 
				'// click "play" to execute the code\n' +
				'// and adjust the code below:\n' +
				'\n' +
				'list kickBeat [1 0.01 0.1 1 0]\n' +
				'new sample kick_min time(1/16) play(kickBeat)\n' +
				'\n' +
				'list hatBeat euclid(16 7)\n' +
				'new sample hat_min time(1/16) play(hatBeat)\n' +
				'\n' +
				'new sample snare_min time(1 3/4)\n'
			);
			this.evaluate();
		};

		div.appendChild(play);
		div.appendChild(stop);
		div.appendChild(clear);
		div.appendChild(example);
	}

	// theme menu for editor
	this.themeMenu = function(){
		let div = document.getElementById('menu');
		let menu = document.createElement('select');
		menu.id = 'themes';
		menu.onchange = () => { this.changeTheme() };
		
		let themes = ['ayu-dark', 'base16-dark', 'material-darker', 'material-ocean', 'moxer'];

		for (let t in themes){
			let option = document.createElement('option');
			option.value = themes[t];
			option.innerHTML = themes[t];
			menu.appendChild(option);
		}
		div.appendChild(menu);

		menu.value = defaultTheme;
	}

	this.controls();
	this.themeMenu();
	this.clear();
}
module.exports = Editor;

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