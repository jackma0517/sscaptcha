// Require dependencies
var path = require('path');
var express = require('express');

var generateImage = require('./generateImage');
//var http = require('http');
var fs = require('fs'); // for base64 image


// Declare application parameters
var PORT = process.env.PORT || 8080;
var STATIC_ROOT = path.resolve(__dirname, './public');

// Defining CORS middleware to enable CORS.
// (should really be using "express-cors",
// but this function is provided to show what is really going on when we say "we enable CORS")
function cors(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS,PUT");
  	next();
}


// Instantiate an express.js application
var app = express();

// Configure the app to use a bunch of middlewares
app.use(express.json());							// handles JSON payload
app.use(express.urlencoded({ extended : true }));	// handles URL encoded payload
app.use(cors);										// Enable CORS

app.use('/', express.static(STATIC_ROOT));			// Serve STATIC_ROOT at URL "/" as a static resource

app.get('/captcha', async function(request, response){
	console.log('Client requesting captcha');
	var [boardBase64, instructions, solution] = await generateImage.generateBoard();
	response.send(JSON.stringify(boardBase64));
});

app.post('/submit', function(request, response) {
	console.log("Mouse Movements: ");
	console.log(request.body.mouseMovements);
	console.log("Mouse Clicks: ");
	console.log(request.body.mouseClicks);
	response.status(200).send();
	//var boop = JSON.stringify({boop: request.body.name + " has booped the server!"})
	//response.send(boop);
});

app.post('/submitSurvey', function(request, response) {
	console.log("Survey Results: ");
	console.log(request.body.surveyResults);
	response.status(200).send();
});

// Start listening on TCP port
app.listen(PORT, function(){
    console.log('Express.js server started, listening on PORT '+PORT);
});