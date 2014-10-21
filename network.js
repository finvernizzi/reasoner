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

var ip = require('ip');

exports.Network = function(config){
    this.subnet = config.subnet || null;
    this.name = config.name || null;
    var self = this;
    // For each gws check that at least an IP is onNet
    if (config.gateways){
        config.gateways.forEach(function(gw , index){
            console.log(gw);
            if (!(gw.ipOnSubnet(self.subnet))){
                throw new Error("Error adding routers "+gw.hostName+" to network "+self.subnet+": no interfaces on net");
            }
        });
    }
    this.gws = config.gateways || null;
    this.links = config.links || null;
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
    // Utility function for checking which, if any, of my IPs is on subnet
    this.ipOnSubnet = function(subnet){
        if (ip.cidr(this.IPa) === ip.cidr(subnet))
            return this.IPa;
        if (ip.cidr(this.IPb) === ip.cidr(subnet))
            return this.IPb;
        return null;
    }
}

/**
 * * A Link between 2 routers
 * The routers should have one of the IPs on the same subnet or the IPa and IPb will be null
 * @param gatewayA
 * @param gatewayB
 */
exports.Link = function(gatewayA , gatewayB , label){
    this.IPa = null;
    this.IPb = null;
    this.label = label || "";
    // Looks for a couple of IP in the same subnet
    if (ip.cidr(gatewayA.IPa) === ip.cidr(gatewayB.IPa)){
        this.IPa = gatewayA.IPa;
        this.IPb = gatewayB.IPa;
    }
    if (ip.cidr(gatewayA.IPa) === ip.cidr(gatewayB.IPb)){
        this.IPa = gatewayA.IPa;
        this.IPb = gatewayB.IPb;
    }
    if (ip.cidr(gatewayA.IPb) === ip.cidr(gatewayB.IPa)){
        this.IPa = gatewayA.IPb;
        this.IPb = gatewayB.IPa;
    }
    if (ip.cidr(gatewayA.IPb) === ip.cidr(gatewayB.IPb)){
        this.IPa = gatewayA.IPb;
        this.IPb = gatewayB.IPb;
    }
    if (this.IPa === null || this.IPb === null)
        throw new Error("Error creating a link between router "+gatewayA.hostName + " and " + gatewayB.hostName);
}
