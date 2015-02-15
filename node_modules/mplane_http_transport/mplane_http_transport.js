/**
 * This library contains methods for a component to interact with a supervisor
 */

var SUPERVISOR_PATH_REGISTER_CAPABILITY = '/register/capability';
var SUPERVISOR_PATH_SHOW_SPECIFICATION = '/show/specification';
var SUPERVISOR_PATH_SHOW_CAPABILITY = '/show/capability';
var SUPERVISOR_PATH_SHOW_RESULT = '/show/result';
var SUPERVISOR_PATH_REGISTER_SPECIFICATION = '/register/specification';
var SUPERVISOR_PATH_REGISTER_RESULT = '/register/result';
var SUPERVISOR_PATH_INFO = '/info/all';

var https = require("https")
    ,mplane = require("mplane"),
    ssl_files = require("./ssl_files.js")
    ,request = require('request')
    ,async = require('async');

var MIME_TYPE = "application/x-mplane+json";


/**********************************************************************************************************************/

/**
 * Register an array of capabilities to a supervisor
 * On completion, calls a callback function with err, response
 * options MUST include (or an INVALID parameters error is thrown):
 *  - options.host
 *  - options.port
 *  - options.caFile
 *  - options.keyFile
 *  - options.certFile
 */
 function registerCapabilities( capabilities , options ,callback) {
    if ((!options.host) || (!options.port) || (!options.caFile) || (!options.keyFile) || (!options.certFile))
        callback(new Error("Invalid parameters"), null);
    else{
        var post_data = [];
        capabilities.forEach(function(capability , index){
            // Serialize the capability Object
            //post_data[capability.get_label()] = JSON.parse(capability.to_dict());
            post_data.push(JSON.parse(capability.to_dict()));
        });
        var post_options = {
            path: SUPERVISOR_PATH_REGISTER_CAPABILITY
            ,method: 'POST'
            ,host: options.host
            ,port: options.port
            ,ca: ssl_files.readCaChain(options.caFile)
            ,agent: false,
            key: ssl_files.readFileContent(options.keyFile)
            ,cert: ssl_files.readFileContent(options.certFile)
            ,headers: {
                //'Content-Type': 'application/json; charset=utf-8',
                'Content-Type': MIME_TYPE,
                'Content-Length': Buffer.byteLength(JSON.stringify(post_data))
                ,'Accept': '*/*'
            }
        };
        // Set up the request
        var post_req = https.request(post_options, function(res) {
            if (res.statusCode != 200){
                callback(new Error(res.statusCode), res.statusCode);
            }
            callback(null,res.statusCode );
        });
        post_req.on("error", function(err){
            callback(err,null)
        });
        post_req.write(JSON.stringify( post_data));
        post_req.end();
    }
}

/**
 * Checks if a specification is ready for a capability
 * It activates a period check and action to be done when something has been found
 *  * options MUST include (or an INVALID parameters error is thrown):
 *  - options.host
 *  - options.port
 *  - options.caFile
 *  - options.keyFile
 *  - options.certFile
 *  CheckPeriod can be choosen with period (default 10000)
 *  Verbose: if options.verbose, will log on console
 *  For each specification obtained by the supervisor, action is called with
 *      - specification
 *  On completion the callback function is called with err, null
 */
function checkSpecifications(options , action , callback){
    if ((!options.host) || (!options.port) || (!options.caFile) || (!options.keyFile) || (!options.certFile))
        callback(new Error("Invalid parameters"), null);
    else {
        var period = options.period || 10000;
        setInterval(function () {
            var get_options = {
                path: SUPERVISOR_PATH_SHOW_SPECIFICATION,
                method: 'GET',
                host: options.host,
                port: options.port,
                followRedirect: false,
                ca: ssl_files.readCaChain(options.caFile),
                key: ssl_files.readFileContent(options.keyFile),
                cert: ssl_files.readFileContent(options.certFile)
            };

            var req = https.get(get_options, function (res) {
                // For some reason we have no capability registered!
                if (res.statusCode == 428){
                    callback(new Error(428) , null);
                }else{
                    // Buffer the body entirely for processing as a whole.
                    var bodyChunks = [];
                    var spec = null;
                    res.on('data', function (chunk) {
                        bodyChunks.push(chunk);
                    }).on('end', function () {
                        body = Buffer.concat(bodyChunks);
                        body = JSON.parse(body);
                        if (body.length == 0) {
                            console.log("+");
                        } else {
                            async.eachSeries(body
                                ,function(curSpec , cb){
                                    var spec = mplane.from_dict(curSpec);
                                    action(spec , cb);
                                }
                                , function(err){
                                    if (err)
					                    console.log("An error occured appling action to specification");
                                });
                        }
                    });
                }// else of 428
            });
            req.on('error', function (e) {
                callback(e , null);
            });

        }, period);
    }
}

/**
 * Show specifications
 * @param options
 * @param callback
 */
function showSpecifications(options , callback){
    options.url  = 'https://'+options.host+':'+options.port+SUPERVISOR_PATH_SHOW_SPECIFICATION;
    options.ca = ssl_files.readCaChain(options.caFile);
    options.key = ssl_files.readFileContent(options.keyFile);
    options.cert = ssl_files.readFileContent(options.certFile);

    request(options, function (error, response, body) {
        if (!error && (response.statusCode == 200)) {
            var spec = (JSON.parse(body));
                callback(null , spec);
        }else{
            callback(new Error("Error connecting to the supervisor") , null);
        }
    });
}

/**
 * Register with a POST a specification to the supervisor
 * @param specification an mPlane Spcification
 * options MUST include (or an INVALID parameters error is thrown):
 *  - options.host
 *  - options.port
 *  - options.caFile
 *  - options.keyFile
 *  - options.certFile
 */
function registerSpecification(specification, remoteDN , options , callback){
    // Serialize the capability Object
    var post_data = {};
    post_data[remoteDN] = JSON.parse(specification.to_dict());
    post_data = JSON.stringify(post_data);

    var proto = https;
    var post_options = {
        path: SUPERVISOR_PATH_REGISTER_SPECIFICATION,
        method: 'POST',
        host: options.host,
        port: options.port,
        followRedirect:false,
        headers: {
            'Content-Type': MIME_TYPE,
            'Content-Length': Buffer.byteLength(post_data)
        } ,
        key: ssl_files.readFileContent(options.keyFile)
        ,cert: ssl_files.readFileContent(options.certFile)
        ,ca: ssl_files.readCaChain(options.caFile)
    };
    // Set up the request
    var post_req = proto.request(post_options, function(res) {
        var body = "";
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if (chunk)
                body +=chunk;
        });
        res.on('end', function (chunk) {
            if (chunk)
                body +=chunk;
            if (res.statusCode == 200){
                // Send back the receipt
                callback(null, body);
            }else{
                callback(new Error(res.statusCode), null);
            }
        });
    });
    // post the data
    post_req.write(post_data);
    post_req.end();
}


/**
 * Register with a POST a result
 * @param specification an mPlane Specification. The specification we are registering a result for. Can be in string or obj format
 * options MUST include (or an INVALID parameters error is thrown):
 *  - options.host
 *  - options.port
 *  - options.caFile
 *  - options.keyFile
 *  - options.certFile
 *
 *  result is an object in the format: {reulstParam:value , ...}
 */
function registerResult( specification , options, results , callback) {
    if (typeof specification !== 'object')
        specification = new mplane.Specification(specification);

    var ret = new mplane.Result(specification);
    var resultsName = specification.result_column_names();

    resultsName.forEach(function(resName){
        ret.set_result_value(resName,results[resName] || "");
    });

    var post_data = ret.to_dict();
    var post_options = {
        path: SUPERVISOR_PATH_REGISTER_RESULT ,
        method: 'POST',
        host: options.host,
        port: options.port,
        followRedirect:false,
        headers: {
            'Content-Type': MIME_TYPE,
            'Content-Length': post_data.length
        }
        ,key: ssl_files.readFileContent(options.keyFile)
        ,cert: ssl_files.readFileContent(options.certFile)
        ,ca: ssl_files.readCaChain(options.caFile)
    };
    // Set up the request
    var post_req = https.request(post_options, function(res) {
        if (res.statusCode == 200){
            callback(null,null);
        }else{
            callback(new Error(res.statusCode),null);
        }
    });
    // post the data
    post_req.write(post_data);
    post_req.end();
}

/**
 * Given a redeem, ask if results are ready
 * @param redeem
 * @param options
 * @param callback
 */
function showResults(redeem , options , callback){
    if (typeof redeem !== 'object')
            redeem = new mplane.Redemption(redeem);
    var post_data = redeem.to_dict();
    var post_options = {
        path: SUPERVISOR_PATH_SHOW_RESULT,
        method: 'POST',
        host: options.host,
        port: options.port,
        followRedirect:false,
        headers: {
            'Content-Type': MIME_TYPE,
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    post_options.ca = ssl_files.readCaChain(options.ca);
    post_options.key = ssl_files.readFileContent(options.key);
    post_options.cert = ssl_files.readFileContent(options.cert);
    // Try to redeem the specification
    var post_req = https.request(post_options, function(res) {
        var bodyChunks=[];
        res.on('data', function (chunk) {
            bodyChunks.push(chunk);
        }).on('end', function () {
            body = Buffer.concat(bodyChunks);
            if (res.statusCode != 200){
                if (res.statusCode == 403){
                    callback(new Error(403),null);
                    return;
                }else{
                    callback(new Error("Error from server"),null);//Wrong answer
                    return;
                }
            }
            var result = mplane.from_dict(body);
            callback(null,result);
        });
    });
    post_req.on("error", function(err){
        callback(err,null)
    });
    post_req.write(post_data);
    post_req.end();
}

/**
 * Contact the supervisor for requesting all the registered capabilities
 * @param options
 * @param callback
 */
function showCapabilities( options, callback){
    options.url  = 'https://'+options.host+':'+options.port+SUPERVISOR_PATH_SHOW_CAPABILITY;
    options.ca = ssl_files.readCaChain(options.caFile);
    options.key = ssl_files.readFileContent(options.keyFile);
    options.cert = ssl_files.readFileContent(options.certFile);

    request(options, function (error, response, body) {
        if (!error && (response.statusCode = 200)) {
            var caps = (JSON.parse(body));
            callback(null, caps);
        }else{
            console.log(error);
            callback(new Error("Error connecting to the supervisor"), null);
        }
    });
}

// Reads supervisor informations
function info(options , callback){
    options.url  = 'https://'+options.host+':'+options.port+SUPERVISOR_PATH_INFO;
    options.key = ssl_files.readFileContent(options.keyFile);
    options.cert = ssl_files.readFileContent(options.certFile);
    options.ca = ssl_files.readCaChain(options.ca);

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        }else{
            callback(new Error("Error connecting to the supervisor:"+error.toString()) , null);
        }
    });

}



/*
                ---- EXPORTS ----
 */

module.exports.registerCapabilities = registerCapabilities;
module.exports.checkSpecifications = checkSpecifications;
module.exports.showSpecifications = showSpecifications;
module.exports.showResults = showResults;
module.exports.registerSpecification = registerSpecification;
module.exports.registerResult = registerResult;
module.exports.info = info;
module.exports.showCapabilities = showCapabilities;
module.exports.SUPERVISOR_PATH_REGISTER_CAPABILITY = SUPERVISOR_PATH_REGISTER_CAPABILITY;
module.exports.SUPERVISOR_PATH_SHOW_SPECIFICATION = SUPERVISOR_PATH_SHOW_SPECIFICATION;
module.exports.SUPERVISOR_PATH_SHOW_CAPABILITY = SUPERVISOR_PATH_SHOW_CAPABILITY;
module.exports.SUPERVISOR_PATH_SHOW_RESULT = SUPERVISOR_PATH_SHOW_RESULT;
module.exports.SUPERVISOR_PATH_REGISTER_SPECIFICATION = SUPERVISOR_PATH_REGISTER_SPECIFICATION;
module.exports.SUPERVISOR_PATH_REGISTER_RESULT = SUPERVISOR_PATH_REGISTER_RESULT;
module.exports.SUPERVISOR_PATH_INFO = SUPERVISOR_PATH_INFO;
module.exports.MIME_TYPE = MIME_TYPE;
