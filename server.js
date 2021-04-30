// The Mercury web-app server
const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/", (request, response) => {
	response.sendFile(__dirname + "/public/index.html");
});

const port = process.env.PORT || 3000;
const listener = app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

// Read all the audio-files and serve the data sheet
const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

// get sample paths
app.get("/samples", (request, response) => {
	response.json(getFiles('public/assets/samples/**/*.wav'));
});

// get example paths
app.get("/examples", (request, response) => {
	let examples = getFiles('public/assets/examples/**/*.txt');
	Object.keys(examples).forEach((f) => {
		examples[f] = fs.readFileSync(`./public/${examples[f]}`, 'utf-8');
	});
	response.json(examples);
});
// fs.outputJSONSync('./data/samples.json', samples, { spaces: 2 });

app.get("/tutorial", (request, response) => {
	let tut = getFiles('public/assets/tutorial/**/*.txt');
	Object.keys(tut).forEach((f) => {
		tut[f] = fs.readFileSync(`./public/${tut[f]}`, 'utf-8');
	});
	response.json(tut); 
});

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