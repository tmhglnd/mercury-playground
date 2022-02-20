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
