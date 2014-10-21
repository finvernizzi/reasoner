/**
 * Created by invernizzi on 21/10/14.
 */


var network=require("./network.js");

var gw1 = new network.Gateway({
    IPa:"192.168.123.1/24",
    IPb:"1.2.3.1/24",
    hostName : "GW1"
});
var gw2 = new network.Gateway({
    IPa:"192.168.123.2/24",
    IPb:"1.2.3.2/24",
    hostName : "GW2"
});

var link1 = new network.Link(gw1 , gw2);