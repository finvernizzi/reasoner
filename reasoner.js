/**
 * Created by fabrizio.invernizzi@telecomitalia.it on 21/10/14.
 */

var NETWORK_DEFINITION = "./demoNet.json";


var network=require("./network.js")
    ,_ = require("lodash")
    ,graphLib = require("graphlib")
    ,ip = require("ip");

motd();
// Process name for ps
process.title = "mPlane reasoner";

// Maps a subnet to network name(that is the label/id of nodes in netGraph)
var __subnetIndex = {};
var netDef = network.importFromJson(NETWORK_DEFINITION);
if (!netDef){
    console.error("Error reading from network definition file");
    process.exit();
}

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
// Graph edges from gateways
_.each(netDef.gateways , function(gw , gwName){
    for (var i=0; i<gw.IPs.length ; i++){
        for (var j=i+1; j<gw.IPs.length;j++){
            // Subnet is the id of the node
            // Label of the node
            netGraph.setEdge(__subnetIndex[ip.cidr(gw.IPs[i])] , __subnetIndex[ip.cidr(gw.IPs[j])]);
        }
    }
});

// Spanning tree , Dijstra tree from internet. All edge has the same weigth
var spanTree = graphLib.alg.prim(netGraph, function(){return 1;});
var dijkstraTree = graphLib.alg.dijkstra(netGraph, "internet" , function(){return 1;});
console.log(dijkstraTree)

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