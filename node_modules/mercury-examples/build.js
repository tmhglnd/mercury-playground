// 
// index.js creates the database of all the examples 
// and tutorials and exports a function used in the distribution
// to load the files via a json file as a dictionary
//

const fs = require('fs-extra');
const fg = require('fast-glob');
const path = require('path');

fs.ensureDirSync('./data');
fs.ensureDirSync('./data/md');

//toMarkdown();

// load examples and store in json
let examples = getFiles('./data/examples/**/*.txt');
fs.writeJSONSync('./data/examples.json', examples, { spaces : 2 });

// load tutorials and store in json
let tuts = getFiles('./data/tutorials/**/*.txt');
fs.writeJSONSync('./data/tutorials.json', tuts, { spaces : 2 });

// return a list of files in a json format
// with key: filename and value: path
function getFiles(glob){
	const fold = fg.sync(glob);
	console.log('folder files', fold);

	let files = {};

	for (let f in fold){
		let file = path.parse(fold[f]);
		// read the file and store the text in the dictionary
		let txt = fs.readFileSync(fold[f], 'utf-8');
		files[file.name] = txt;
	}
	return files;
}

function toMarkdown(folder){
	let files = getFiles('./data/tutorials/**/*.txt');

	let chapter = 0;
	let md = '';	
	Object.keys(files).forEach((f) => {
		let text = fs.readFileSync(files[f], 'utf-8');
		md += markdownFromText(text);
	});

	fs.writeFileSync('./data/md/tutorials.md', md, 'utf-8');
}

// parse the code text files to a markdown file for the docs
function markdownFromText(text){
	// buffer for markdown txt
	let md = '\n';
	// all the lines separated
	let lines = text.split('\n');
	// when inside a block of code
	let codeblock = false;
	// variables for storage
	let chapter;
	let title;

	try {
		lines.forEach((l) => {
			// console.log(l);
			if (l.match(/^\/\/ === (.+) ===$/g)){
				let full = l.match(/^\/\/ === (.+) ===$/)[1];
				title = full.match(/\: (.+)$/)[1];
				chapter = full.match(/(\d).(\d+)/);
				md += `### ${chapter[1]}.${chapter[2]}: ${title}\n\n`;
				console.log('title', title, chapter[1], chapter[2]);
			} else if (l.match(/^\/\//g)){
				if (codeblock){
					codeblock = false;
					md += '```\n'
				}
				// console.log('comment', l);
				md += l.match(/[^/]+/g)[0]; //.trim();
			} else if (l === ''){
				// console.log('empty');
				md += '\n';
			} else {
				// console.log('code', l)
				if (!codeblock){
					codeblock = true;
					md += '\n```js\n';
				}
				md += l + '\n';
			}
		});
		// when last line is done but it is still in a codeblock
		md += (codeblock)? '```\n' : '\n';

	} catch (e) {
		console.log('error converting', e);
	}
	return md;
	// console.log(md);
	// fs.writeFileSync(`./data/md/${chapter[1]}.${String(chapter[2]).padStart(2, "0")}.md`, md, 'utf-8');
}
