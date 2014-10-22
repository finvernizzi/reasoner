/**
 * Created by invernizzi on 21/10/14.
 */


var network=require("./network.js");

//network.importFromJson("./demoNet.json")

var soekrisGW = new network.Gateway({
    IPs:["192.168.123.1/26" , "192.168.123.130/30" ,"192.168.123.65/26"],
    hostName : "GW1"
});
var mplaneGw = new network.Gateway({
    IPs:["192.168.123.129/30" , "163.162.170.197/27"],
    hostName : "mplaneGw"
});
//var link1 = new network.Link(gw1 , mplaneGw , "Internet link");

var serviceNet = new network.Network({
    name : "Test net",
    subnet: "192.168.123.0/24",
    gateways : [soekrisGW]
});

var internetP2P = new network.Network({
    name : "Test net",
    subnet: "192.168.123.129/30",
    gateways : [soekrisGW , mplaneGw],
    type: network.P2P_NET
});

console.log(serviceNet);
console.log(internetP2P);