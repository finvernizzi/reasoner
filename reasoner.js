/**
 * Created by fabrizio.invernizzi@telecomitalia.it on 21/10/14.
 * Reasoner imports net definitions from json an build a graph representation (graphlib) of it with some simple assumption.
 * No routing info are considered!
 * We can also add nodes adding /32 as subnet.
 */

var NETWORK_DEFINITION = "./demoNet.json";
var RTT_CAPABILITY = "delay.twoway";
var CONFIGFILE = "reasoner.json";
var PARAM_PROBE_SOURCE = "source.ip4";

var network=require("./network.js")
    ,_ = require("lodash")
    ,graphLib = require("graphlib")
    ,ip = require("ip")
    ,mplane = require('mplane')
    ,supervisor = require("mplane_http_transport")
    ,fs = require("fs")
    ,cli = require("cli");

//-----------------------------------------------------------------------------------------------------------
// READ CONFIG
var configuration;
try {
    configuration = JSON.parse(fs.readFileSync(CONFIGFILE));
}
catch (err) {
    console.log('There has been an error parsing the configuration file.')
    console.log(err);
    process.exit();
}
//-----------------------------------------------------------------------------------------------------------

// Load the reference registry
mplane.Element.initialize_registry(configuration.registry.file);

// CLI params
cli.parse({
    supervisorHost:  ['b', 'Supervisor address', 'ip', configuration.supervisor.hostName],
    supervisorPort:  ['p', 'Supervisor port', 'int', configuration.supervisor.listenPort],
    SSL:['s', 'Use SSL in supervisor connections', 'bool', true],
    ca:['c' , 'Certificate file of the Certification Auth' , 'string' , configuration.ssl.ca],
    key:['k' , 'Key file of the client' , 'string' , configuration.ssl.key],
    cert:['t' , 'Certificate file of the client' , 'string' , configuration.ssl.cert],
    user:['u' , 'Login as user' , 'string' , 'demo']
});


motd();
// Process name for ps
process.title = "mPlane reasoner";

// Maps a subnet to network name(that is the label/id of nodes in netGraph)
var __subnetIndex = {};
var __availableProbes = {};
// Indexes for simply find available measures
var __IndexProbesByNet ={};
var __IndexProbesByType ={};

var netDef = network.importFromJson(NETWORK_DEFINITION);
if (!netDef){
    console.error("Error reading from network definition file");
    process.exit();
}
info("Network definitions loaded");

// Import networks/gateways to generate a graph representation
var netGraph = new graphLib.Graph({ directed: false});
// Graph label
netGraph.setGraph("mPlane DEMO NET");
// Graph nodes
_.each(netDef.networks , function(net , netName){
    netGraph.setNode(netName , net.description);
    if (net.subnet == network.UNSPECIFIED_NET)
        __subnetIndex[network.UNSPECIFIED_NET] = netName; //INDEXED
    else
        __subnetIndex[ip.cidr(net.subnet)] = netName; //INDEXED
});
info("...Subnet nodes edges created");
// add edges for /32 subnets. These nets should have only 1 gw
_.each(netDef.networks , function(net , netName){
    var netInfo = ip.cidrSubnet(net.subnet)
    if (netInfo.subnetMaskLength == 32){
        var gw = netDef.gateways[net.gateways[0]]; // Default gw of the host
        for (var i=0; i<gw.IPs.length;i++) {
            if (netInfo.networkAddress != ip.cidr(gw.IPs[i])){
                netGraph.setEdge(netName, __subnetIndex[ip.cidr(gw.IPs[i])] , net.gateways[0]);
            }
        }
    }
});
info("...Host nodes linked");
// Graph edges from gateways
// Edges are identified using subnets
_.each(netDef.gateways , function(gw , gwName){
    for (var i=0; i<gw.IPs.length ; i++){
        for (var j=i+1; j<gw.IPs.length;j++){
            // Subnet is the id of the node
            // We use the GW name as label of the edge
            netGraph.setEdge(__subnetIndex[ip.cidr(gw.IPs[i])] , __subnetIndex[ip.cidr(gw.IPs[j])] , gwName );
        }
    }
});
info("...Edges created");

// Gets available capabilities and update indexes
getSupervisorCapabilityes(function(err, caps){
    __availableProbes = caps;
     // Update indexes
    _.each(caps, function(cap , DN){
        console.log(cap.getParameterNames())
        //console.log(DN)
        //console.log(cap)
        // If source.ip4 param is not present we have no way to know shere the probe is with respect of our net
        if (_.indexOf(cap.getParameterNames , PARAM_PROBE_SOURCE) === -1){
            showTitle("The capability has no "+PARAM_PROBE_SOURCE+" param");
            console.log(cap);
        }else{
            var sourceNet = cap.get_parameter_value(PARAM_PROBE_SOURCE);
            console.log(sourceNet)
            //if (!__IndexProbesByNet[])

        }

    });
    info(caps.length+" capabilities loaded from "+cli.options.supervisorHost);
});



// Spanning tree , Dijstra tree from internet. All edge has the same weigth
// TODO: use measure to change node weihtght?
//var spanTree = graphLib.alg.prim(netGraph, function(){return 1;});
//var dijkstraTree = graphLib.alg.dijkstra(netGraph, DESTINATION_NET , function(){return 1;});
info("Graph created");
info("..."+netGraph.nodeCount()+" networks");
info("..."+netGraph.edgeCount()+" links");


/********************************************************************************************************************/
// UTILITY FUNCTIONS
/********************************************************************************************************************/

/**
 * Requests all the capabilities registered on the supervisor
 * @param callback the function to call on completion
 */
function getSupervisorCapabilityes(callback){
    supervisor.showCapabilities({
            caFile : cli.options.ca,
            keyFile : cli.options.key,
            certFile : cli.options.cert,
            host : cli.options.supervisorHost,
            port: cli.options.supervisorPort
        },
        function(error , caps){
            if (error){
                showTitle("Error connecting to the supervisor."+error.toString());
                callback(new Error("Error connecting to the supervisor."+error.toString()), null);
            }
            if (_.keys(caps).length == 0){
                showTitle("NO CAPABILITY registered on the supervisor");
            }else{
                callback(null, caps);
            }

        });
}


function motd(){
    console.log();
    console.log();
    console.log("    ###########################################");
    console.log("    ###$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$$$$      $$$$$$$$$$$$$$$$$$$$##");
    console.log("    ##$$$$$$$$$$   ;$$$$   $$$$$$       $$$$$##");
    console.log("    ##$$$$$$$$   $$$$$$$$  $$$$   $$$$$  $$$$##");
    console.log("    ##$$$$$$   $$$$$$$$$$!      $$$$$$$   $$$##");
    console.log("    ##$$$$   $$$$$$$$$$$$$$  $$$$$$$$$$$  $$$##");
    console.log("    ##$$$  $$$$$$$$$$$$$$$$$$$$$$$$$$$$$  $$$##");
    console.log("    ##$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ###$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$##");
    console.log("    ###########################################");

    console.log();
    console.log("               mPlane REASONER ");
    console.log();
    console.log("    An Intelligent Measurement Plane for Future \n         Network and Application Management");
    console.log();
    console.log();
}

function info(msg){
    console.log("..."+msg);
}

var pad = function (str, len , padChar) {
    if (!padChar)
        padChar = " ";
    if (typeof len === 'undefined') {
        len = str;
        str = '';
    }
    if (str.length < len) {
        len -= str.length;
        while (len--) str += padChar;
    }
    return str;
};

// Utility function to show a title somehow formatted
function showTitle(text){
    console.log("\n\n"+pad("",text.length,"-"));
    console.log(text);
    console.log(pad("",text.length,"-")+"\n");
}