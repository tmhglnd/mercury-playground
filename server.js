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

app.get("/samples", (request, response) => {
	const fold = fg.sync('public/samples/**/*.wav');
	let samples = {};

	for (let f in fold){
		let file = path.parse(fold[f]);
		let rel = fold[f].split(path.sep).slice(1).join('/');
		samples[file.name] = rel;
	}
	response.json(samples);
});
// fs.outputJSONSync('./data/samples.json', samples, { spaces: 2 });