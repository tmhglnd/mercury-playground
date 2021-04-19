
const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/", (request, response) => {
	response.sendFile(__dirname + "/public/index.html");
});

// send the default array of dreams to the webpage
// app.get("/dreams", (request, response) => {
// 	// express helps us take JS objects and send them as JSON
// 	response.json(dreams);
// });

const port = process.env.PORT || 3000;
const listener = app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
