/**
 * Created by invernizzi on 04/09/14.
 *
 * Agent ofr web pages
 */

/***********************
 *
 *  SETTINGS e CONSTANTS
 *
 **********************/
var LISTENPORT = 8081;
var STATIC_CONTENT_DIR = __dirname+"/www/";
var LOG_FILE = '/var/log/mplane/agent.log'

var BAD_REQUEST = 400;

process.name = "Network status agent";

var expresss = require('express')
    ,_ = require("lodash")
    ,bodyParser = require('body-parser');

var app = expresss();

/***************************/
// DEVELOPMENT - PRODUZIONE
//app.set('env' , "development");
app.set('env' , "production");
/***************************/

app.set("name" , "Network Status Agent");

// DEBUG o PRODUZIONE?
switch(app.get('env')){
    case 'development':
        console.log("Static content dir:"+STATIC_CONTENT_DIR);
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        app.use(require('express-logger')({
            path: LOG_FILE
        }));
        break;
}

app.listen(LISTENPORT);
console.log()
console.log("------------------------------------------------------");
console.log("       Working in "+app.get("env") + " mode");
console.log("------------------------------------------------------");
console.log()
console.log("Server listening on "+LISTENPORT);


/***********************************************************************************************************************
 *
 *  ROUTING
 *
 ***********************************************************************************************************************/

/**
 * STATIC CONTENT
 */
app.use(expresss.static(STATIC_CONTENT_DIR));
app.use( bodyParser.json() );
/**
 * Applicato a ogni risposta. Eventualmente sovrascritto nelle risposte puntuali
 */
app.use(function (err, req, res, next) {
    res.type("text/plain");
    next;
});

/**
 * Missing route
 */
app.use(function(req , res){
    res.type("text/plain");
    res.status(400);
    res.send("400 - BAD REQUEST");
});

/**
 * SERVER ERROR
 */
app.use(function(err , req , res , next){
    console.log(err.stack);
    res.type("text/plain");
    res.status(500);
    res.send("500 - SERVER ERROR");
});


