/**
 * Created by invernizzi on 21/10/14.
 */


var network=require("./network.js");

network.importFromJson("./demoNet.json")

var gw1 = new network.Gateway({
    IPa:"192.168.123.1/24",
    IPb:"1.2.3.1/24",
    hostName : "GW1"
});
var gw2 = new network.Gateway({
    IPa:"192.168.123.2/24",
    IPb:"163.162.170.222/24",
    hostName : "firewall"
});
var link1 = new network.Link(gw1 , gw2 , "Test link");

var net1 = new network.Network({
    name : "Test net",
    subnet: "192.168.123.0/24",
    gateways : [gw1],
    links: [link1]
});


console.log(net1);