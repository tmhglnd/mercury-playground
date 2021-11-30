//====================================================================
// Mercury Intermediate Representation
// written by Timo Hoogland (c) www.timohoogland.com
//
// Returns results for the parsing tree when parsing a line of code
// Inspired by the SEMA language Intermediate Representation by
// Chris Kiefer, Thor Magnuson & Francesco Bernardo
//====================================================================

// const bind = require('./bind-functions.gen.json');

// total-serialism library functions
const tsIR = require('./totalSerialismIR.js').functionMap;
// included instrument/object defaults
const instruments = require('../data/objects.js').objects;
// keyword bindings, use custom keywords for functions
const keywords = require('../data/bind-functions.json');
// mini language, use single characters for keywords and functions
const miniLang = require('../data/mini-functions.json');

let keywordBinds = {};
keywordBinds = keywordBindings(keywords, keywordBinds);
keywordBinds = keywordBindings(miniLang, keywordBinds);

// keywordBinds = keywordBindings(langDutch, keywordBinds);
// console.log(keywordBinds);

// processing for identifiers
function identifier(obj){
	let v = obj[0].value;
	if (v.match(/^[a-gA-G](?:#+|b+|x)?(?:[0-9])?$/)){
		// is the identifier a note?
		return { "@note" : v }
	} else if (v.match(/^~[^\s]*$/)){
		// is the identiefer a signal?
		return { "@signal" : v }
	}
	return { "@identifier" : v };
}

// processing for division
function division(obj){
	// concatenate division numbers to string
	return { "@division" : obj[0].value + '/' + obj[2].value };
}

// processing for numbers
function num(obj){
	// parse string to number
	return { "@number" : Number(obj[0].value) };
}

// check if the function is part of mapped functions
// else return original value
function keyBind(f){
	return (keywordBinds[f]) ? keywordBinds[f] : f;
}

// Generate a dictionary of keyword and binding pairs based on 
// input dictionary of categorized keybindings 
function keywordBindings(dict, obj){
	// console.log('Generating keyword bindings...');
	let binds = { ...obj };
	Object.keys(dict).forEach((k) => {
		// store itself first
		binds[k] = k;
		dict[k].forEach((b) => {
			if (binds[b]) {
				// if already exists ignore and print warning
				console.log('Warning! Duplicate keyword: [ '+b+' ] \nfor: [ '+binds[b]+' ] and: [ '+k+' ] \n => BIND IGNORED');
			} else {
				// store binding name with resulting keyword
				binds[b] = k;
			}
			// console.log('mapped: [ '+b+' ] to: [ '+k+' ]');
		});
	});
	// console.log('...done!');
	return binds;
}

// code accepted global parameters
const globals = 'tempo signature volume scale root randomSeed highPass lowPass silence sound'.split(' ');

// code defaults
let code = {
	'global' : {
		// 'tempo' : [ 90 ],
		// 'volume' : [ 0.8 ],
		// 'scale' : [ 'chromatic', 'c' ],
		// 'root' : [ 'c' ],
		// 'signature' : [ '4/4' ],
		'randomSeed' : [ 0 ],
		'highPass' : [ 20000, 0 ],
		'lowPass' : [ 1, 0 ],
		'silence' : false,
	},
	'variables' : {},
	'objects' : {},
	'groups' : {},
	'print' : [],
	'comments' : [],
	'errors' : []
}

function deepCopy(o){
	return JSON.parse(JSON.stringify(o));
}

function traverseTreeIR(tree){
	// deepcopy the syntax tree
	let tmp = deepCopy(tree);
	// deepcopy the code template
	let ccode = deepCopy(code);
	tmp.map((t) => {
		// console.log(t);
		tmp = traverseTree(t, ccode);
	})
	return ccode;
}

function traverseTree(tree, code, level){
	// console.log(`tree at level ${level}`, tree, code);
	let map = {
		'@global' : (ccode, el) => {
			// if global code (comments, numbers, functions)
			// console.log('@global', el);
			Object.keys(el).forEach((k) => {
				// console.error("Unknown function:", JSON.stringify(el[k]));
				ccode = map[k](ccode, el[k], '', '@setting');
			});
			return ccode;
		},
		'@comment' : (ccode, el) => {
			// if a comment, just return
			ccode.comments.push(el);
			return ccode;
		},
		'@print' : (ccode, el) => {
			// console.log('@print', traverseTree(el, ccode));
			// let prints = ccode.print;
			let log = '> ';
			el.map((e) => {
				Object.keys(e).forEach((k) => {
					let p = map[k](ccode, e[k]);
					// log += (Array.isArray(p)? p.flat(Infinity).join(' ') : p) + ' ';
					ccode.print.push(p);
				});
			});
			// console.log(log);
			// ccode.print = prints;
			return ccode;
		},
		'@settings' : (ccode, el) => {
			// console.log('@settings', traverseTree(el, ccode));
			let name = keyBind(traverseTree(el, ccode));
			if (globals.includes(name)){
				ccode.global[name] = true;
			} else {
				ccode.errors.push(`Unkown setting name: ${name}`);
			}
			return ccode;
		},
		'@list' : (ccode, el) => {
			// if list/ring/array is instantiated store in variables

			// console.log('@list', el);
			let r = traverseTree(el['@params'], ccode, '@list');
			ccode.variables[el['@name']] = r;
			return ccode;
		},
		'@object' : (ccode, el) => {
			// if object is instantiated or set (new/make, set/apply)

			// console.log('@object', el);
			Object.keys(el).forEach((k) => {
				ccode = map[k](ccode, el[k]);
			});
			return ccode;
		},
		'@new' : (ccode, el) => {
			// when new instrument check for instrument 
			// name and apply functions

			// console.log('@new', el);
			let inst = map['@inst'](ccode, el['@inst']);
			delete el['@inst'];

			Object.keys(el).forEach((k) => {
				inst = map[k](ccode, el[k], inst, '@object');
			});
			// generate unique ID name for instrument if no name()
			if (!inst.functions.name){
				inst.functions.name = [ uniqueID(8) ];
			}
			ccode.objects[inst.functions.name] = inst;

			return ccode;
		},
		'@set' : (ccode, el) => {
			// when an instrument or global parameter is set
			// check if part of instruments, otherwise check if part of
			// environment settings, otherwise error log

			// console.log('@set', el);
			// let name = el['@name'];
			let name = keyBind(el['@name']);
			delete el['@name'];

			if (ccode.objects[name]){
				let inst = ccode.objects[name];
				Object.keys(el).forEach((k) => {
					inst = map[k](ccode, el[k], inst, '@object');
				});
				ccode.objects[inst.functions.name] = inst;
			} else if (name === 'all'){
				Object.keys(ccode.objects).forEach((o) => {
					let inst = ccode.objects[o];
					Object.keys(el).forEach((k) => {
						inst = map[k](ccode, el[k], inst, '@object');
					});
					ccode.objects[inst.functions.name] = inst;
				});
			// } else if (ccode.global[name]){
			} else if (globals.includes(name)){
				let args;
				Object.keys(el).forEach((k) => {
					args = map[k](ccode, el[k], args, '@setting');
				});
				// if name is a total-serialism function
				if (tsIR[name]){
					if (args){
						tsIR[name](...args);
					} else {
						tsIR[name]();
					}
				}
				ccode.global[name] = args;
			} else {
				// console.error(`Unkown instrument or setting name: ${name}`);
				ccode.errors.push(`Unkown instrument or setting name: ${name}`);
			}
			return ccode;
		},
		'@inst' : (ccode, el) => {
			// check instruments for name and then deepcopy to output
			// if not a valid instrument return empty instrument

			// console.log('@name', ccode, el, level);
			let obj = el;
			let inst;
			
			if (!instruments[obj]){
				inst = deepCopy(instruments['empty']);
				// console.error(`Unknown instrument type: ${obj}`);
				ccode.errors.push(`Unknown instrument type: ${obj}`);
			} else { 
				inst = deepCopy(instruments[obj]);
			}
			inst.object = obj;

			return inst;
		},
		'@type' : (ccode, el, inst) => {
			// return the value of the type, can be identifier, string, array

			// console.log('@type', ccode, el);
			Object.keys(el).forEach((e) => {
				inst.type = map[e](ccode, el[e]);
			});
			return inst;
		},
		'@functions' : (ccode, el, inst, level) => {
			// add all functions to object or parse for settings
			// console.log('@f', ccode, '@e', el, '@i', inst, '@l', level);
			if (level === '@setting'){
				// set arguments from global settings
				let args = [];

				el.map((e) => {
					Object.keys(e).map((k) => {
						args.push(map[k](ccode, e[k]));
					});
				});
				return args;
			}
			let funcs = inst.functions;
			el.map((e) => {
				Object.keys(e).map((k) => {
					funcs = map[k](ccode, e[k], funcs, level);
				});
			});
			inst.functions = funcs;

			return inst;
		},
		'@function' : (ccode, el, funcs, level) => {
			// for every function check if the keyword maps to other
			// function keyword from keyword bindings.
			// if function is part of ts library execute and parse results

			// console.log('@func', el);
			let args = [];
			let func = keyBind(el['@name']);

			if (el['@args'] !== null){
				el['@args'].map((e) => {
					Object.keys(e).map((k) => {
						args.push(map[k](ccode, e[k], level));
					});
				});
			}
			// console.log('@func', el, '@args', args, '@level', level);
			if (tsIR[func] && level !== '@object'){
				if (args){
					return tsIR[func](...args);
				}
				return tsIR[func]();
			} else if (level === '@list'){
				// console.error(`Unknown list function: ${func}`);
				ccode.errors.push(`Unknown list function: ${func}`);
				return [0];
			} else if (level === '@object'){
				if (func === 'add_fx'){
					funcs[func].push(args);
				} else {
					if (func === 'name'){
						if (!ccode.groups.all){
							ccode.groups.all = [];
						}
						ccode.groups.all.push(...args);
					}
					else if (func === 'group'){
						// console.log('@group', args);
						// args.forEach((g) => {
						// 	if (!ccode.groups[g]){
						// 		ccode.groups[g] = [];
						// 	}
						// });
						// if (!ccode.groups)
					}
					funcs[func] = args;
				}
				return funcs;
			} else {
				el['@args'] = args;
				return el;
			}
		},
		'@array' : (ccode, el) => {
			let arr = [];
			// if not an empty array parse all items
			if (el){
				el.map((e) => {
					Object.keys(e).map((k) => {
						arr.push(map[k](ccode, e[k]));
					});
				});
			}
			return arr;
		},
		'@identifier' : (ccode, el) => {
			// console.log('@identifier', ccode, el);
			if (code.variables[el]){
				return code.variables[el];
			}
			return el;
		},
		'@string' : (ccode, el) => {
			return el;
		},
		'@number' : (ccode, el) => {
			return el;
		},
		'@division' : (ccode, el) => {
			return el;
		},
		'@note' : (ccode, el) => {
			return el;
		}
	}

	if (Array.isArray(tree)) {
		// console.log('array process of', tree);
		tree.map((el) => {
			Object.keys(el).map((k) => {
				code = map[k](code, el[k], level);
			});
		})
	} else {
		// console.log('object process of', tree);
		if (tree){
			Object.keys(tree).map((k) => {
				// console.log(k);
				code = map[k](code, tree[k], level);
			});
		}
	}
	return code;
}

function uniqueID(length){
	let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
	let s = '';

	for (let l=0; l<length; l++){
		s += chars[Math.floor(Math.random() * chars.length)];
	}
	return s;
}

module.exports = { identifier, division, num, keyBind, traverseTreeIR };