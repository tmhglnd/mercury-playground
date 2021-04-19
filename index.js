
// const Tone = require('tone');
// const puppeteer = require('puppeteer');

// (async () => {
// 	const browser = await puppeteer.launch();
// 	const page = await browser.newPage();
// 	await page.goto('./index.html');
// 	// await page.goto('https://example.com');
// 	await page.screenshot({ path: 'example.png' });
   
// 	await browser.close();
// })();

const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

const fold = fg.sync('**/*.wav');
let samples = {};

for (let f in fold){
	let file = path.parse(fold[f]);
	samples[file.name] = fold[f];
}

fs.outputJSONSync('./data/samples.json', samples, { spaces: 2 });