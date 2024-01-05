// 
// index.js creates the database of all the examples 
// and tutorials and exports a function used in the distribution
// to load the files via a json file as a dictionary
//

const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

fs.ensureDirSync('./data');

// load examples
let examples = getFiles('./data/examples/**/*.txt');
Object.keys(examples).forEach((f) => {
	examples[f] = fs.readFileSync(examples[f], 'utf-8');
});
fs.writeJSONSync('./data/examples.json', examples, {spaces : 2});

// load tutorials
let tuts = getFiles('./data/tutorials/**/*.txt');
Object.keys(tuts).forEach((f) => {
	tuts[f] = fs.readFileSync(tuts[f], 'utf-8');
});
fs.writeJSONSync('./data/tutorials.json', tuts, {spaces : 2});

// return a list of files in a json format
// with key: filename and value: path
function getFiles(glob){
	const fold = fg.sync(glob);
	let files = {};

	for (let f in fold){
		let file = path.parse(fold[f]);
		// let rel = fold[f].split(path.sep).slice(1).join('/');
		files[file.name] = fold[f];
	}
	return files;
}
