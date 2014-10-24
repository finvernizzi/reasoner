/**
 * Created by invernizzi on 21/10/14.
 *
 * Network object representation and utility functions
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

var ip = require('ip'),
    fs = require('fs');

var BROADCAST_NET = "lan";
var P2P_NET = "p2p";
exports.BROADCAST_NET = BROADCAST_NET;
exports.P2P_NET = P2P_NET;

var UNSPECIFIED_NET = "*";
exports.UNSPECIFIED_NET = UNSPECIFIED_NET;

/**
 * A network (LAN). By default type is BROADCAST_NET, but can also be a p2p
 * @param config
 *      subnet: the subnet associated with this network
 *      type: BROADCAST_NET | P2P_NET
 *      name: name of the network
 * @constructor
 */
exports.Network = function(config){
    this.subnet = config.subnet || UNSPECIFIED_NET;
    this.name = config.name || "";
    this.type = config.type || BROADCAST_NET;
    this.description = config.description || "";

    var self = this;
    // For each gws check that at least an IP is onNet
    if (config.gateways){
        config.gateways.forEach(function(gw , index){
            if ((gw.ipOnSubnet(self.subnet).length) == 0){
                throw new Error("Error adding routers "+gw.hostName+" to network "+self.subnet+": no interfaces on net");
            }
        });
    }
    this.gws = config.gateways || null;
}
/**
 * A gateway is a router with a number of IPs able to interconnect at IP level the differemt subtending networks.
 * @param config
 *  IPs: array of IPs assigned to the gateway
 *  hostName: the name of the host
 */
exports.Gateway = function(config){
    if (Array.isArray(config.IPs))
        this.IPs = config.IPs;
    else
        this.IPs = [];
    var self = this;

    this.hostName = config.hostName || "";
    // Utility function for checking which, if any, of my IPs is on subnet
    // Returns an array containing all the subnet
    this.ipOnSubnet = function(subnet){
        var ret = [];
        for (var i=0 ; i<self.IPs.length; i++){
            if ((ip.cidr(self.IPs[i]) === ip.cidr(subnet)) || (subnet == UNSPECIFIED_NET))
                ret.push(self.IPs[i]);
        }
        return ret;
    }
}

/**
 * Simply read from a file a configuration(JSON format)
 * @param fileName
 * @returns {json definition|false}
 */
exports.importFromJson = function(fileName){
    var definitions;
    try {
        definitions = JSON.parse(fs.readFileSync(fileName));
    }
    catch (err) {
        console.log('There has been an error parsing the fileName file '+fileName)
        return false;
    }
    return definitions;
}
/**
 * if the net includes a prefixlen, returns only the IP (es 192.168.123.1 out of 192.168.123.1/24)
 * @param net
 */
exports.extractIp = function(net){
    var ipSplit=net.split("/");
    return ipSplit[0];
}
