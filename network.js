/**
 * Created by invernizzi on 21/10/14.
 *
 * Network object representation and tools
 */




/**
 *
 * @param config
 *      subnet a string representation of the subnet associated to the network (a.b.c.d/x)
 *      description Text descripbing the net
 *      name net name
 *      gateways: array of gateways communicate con external nets.
 *          Each gateway is a json with
 *          {gwIP, extIP}, where gwIP of the router( should belong to subnet), extIP is the external IP directly connected
 *
 * @constructor
 */

var ip = require('ip');


exports.Network = function(config){

}
/**
 * A gateway is a router with 2 IPs able to interconnect at IP level the 2 IP.
 * @param config
 *  IPa:
 *  IPb:
 *  hostName: the name of the host
 */
exports.Gateway = function(config){
    this.IPa = config.IPa || null;
    this.IPb = config.IPb || null;
    this.hostName = config.hostName || "";
}

/**
 * * A Link between 2 routers
 * The routers should have one of the IPs on the same subnet or a ErrorConnectingRouters will be leveraged
 * @param gatewayA
 * @param gatewayB
 */
exports.Link = function(gatewayA , gatewayB){
    console.log(gatewayA)
   // Looks for a couple of IP in the same subnet
    console.log(ip.cidr(gatewayA.IPa))
    console.log(ip.cidr(gatewayA.IPb))
}