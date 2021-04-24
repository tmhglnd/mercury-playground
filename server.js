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
// const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

// get sample paths
app.get("/samples", (request, response) => {
	response.json(getFiles('public/assets/samples/**/*.wav'));
});

// get example paths
app.get("/assets", (request, response) => {
	response.json(getFiles('public/assets/examples/**/*.txt'));
});
// fs.outputJSONSync('./data/samples.json', samples, { spaces: 2 });

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