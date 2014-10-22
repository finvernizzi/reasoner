/**
 * Created by invernizzi on 21/10/14.
 */


var network=require("./network.js");

//network.importFromJson("./demoNet.json")

var gw1 = new network.Gateway({
    IPs:["192.168.123.1/26" , "192.168.123.130/30" ,"192.168.123.65/26"],
    hostName : "GW1"
});
//var link1 = new network.Link(gw1 , gw2 , "Test link");
/*
var net1 = new network.Network({
    name : "Test net",
    subnet: "192.168.123.0/24",
    gateways : [gw1],
    links: [link1]
});

*/
console.log(gw1);