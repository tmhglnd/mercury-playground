//====================================================================
// Mercury parser
//
// Parse a textfile of Mercury code and return the .json syntax tree
// written by Timo Hoogland 2021, www.timohoogland.com
//====================================================================

const nearley = require('nearley');
// const util = require('util');

const grammar = require('./mercuryGrammar.js');
const worker = require('./mercuryIR.js');

const DEBUG = false;

function mercuryParser(code){
	// split multiple lines into array of strings
	let lines = code.split('\n');
	let syntaxTree = { '@main' : [] };
	let errors = [];
	let parseTree = {};

	for (let l in lines){
		if (lines[l] !== ''){
			// create a Parser object from our grammar
			let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

			try {
				// parse something!
				parser.feed(lines[l]);
				// parser.results is an array of possible parsings.
				let results = parser.results.length;

				if (DEBUG){
					if (results > 1){
						console.log("Warning, ambiguous grammar!");
						for (var i=0; i<results; i++){
							// console.log("Result", i+1, "of", results, "\n", util.inspect(parser.results[i], { depth: 10 }), "\n");
							console.log(parser.results[i]);
						}
					} else {
						console.log(parser.results[0]);
					}
				}
				// build the tokenized syntax tree
				syntaxTree['@main'].push(parser.results[0]);
			} catch (e) {
				// console.error(e)
				// column: ${e.token.col}
				let err = `Syntax error at line ${Number(l)+1}: Unexpected ${e.token.type}: ${e.token.value} at ${lines[l].slice(0, e.token.offset)}${e.token.text}<-`;
				if (DEBUG){
					console.error(err);
				}
				errors.push(err);
			}
		}
	}
	// traverse Syntax Tree and create Intermediate Representation
	parseTree = worker.traverseTreeIR(syntaxTree['@main']);

	errors = parseTree.errors.concat(errors);
	delete parseTree.errors;
	// return both the parseTree and syntaxTree in one object
	return { 
		'parseTree': parseTree, 
		'syntaxTree': syntaxTree, 
		'errors': errors 
	};
}
exports.mercuryParser = mercuryParser;