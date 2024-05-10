
//
// index.js creates a database of all the 
// soundfiles, tutorials, examples and stores
// in separate json files under src/data
//

// Configure variables for custom filepaths and settings through .ini file
const { parse } = require('ini');

// Read all the audio-files and serve the data sheet
const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

// make sure the data folder exists, otherwise create it
fs.ensureDirSync('src/data');

// load custom paths through ini file
fs.ensureFileSync('./mercury.ini');
let ini = fs.readFileSync('./mercury.ini', 'utf-8');
const config = parse(ini);

// get soundfile paths from default location
// let samples = {};
let samples = getFiles('public/assets/samples/**/*.wav');
// if custom paths are provided load those samples
// config.samples?.paths.forEach((p) => {
// 	samples = {...samples, ...getFiles(`${p}/**/*.wav`)}
// });
fs.writeJSONSync('src/data/samples.json', samples, {spaces : 2});

// load example
let examples = getFiles('public/assets/examples/**/*.txt');
Object.keys(examples).forEach((f) => {
	examples[f] = fs.readFileSync(`./public/${examples[f]}`, 'utf8');
});
fs.writeJSONSync('src/data/examples.json', examples, {spaces : 2});

// load tutorials
let tuts = getFiles('public/assets/tutorial/**/*.txt');
Object.keys(tuts).forEach((f) => {
	tuts[f] = fs.readFileSync(`./public/${tuts[f]}`, 'utf8');
});
fs.writeJSONSync('src/data/tutorials.json', tuts, {spaces : 2});

// return a list of files in json format 
// with key: filename value: path
function getFiles(glob){
	const fold = fg.sync(glob);
	let files = {};

	for (let f in fold){
		let file = path.parse(fold[f]);
		let rel = fold[f].split(path.sep).slice(1).join('/');
		files[file.name] = rel;
	}
	return files;
}
