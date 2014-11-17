/**
 * Created by fabrizio.invernizzi@telecomitalia.it on 21/10/14.
 * Reasoner imports net definitions from json an build a graph representation (graphlib) of it with some simple assumption.
 * Creating the graph, subnets of a net are considered "leafs" and a link is automaticcally created. Usefull for adding, for example, an host as a node to a subnet
 * No routing info are considered!
 * We can also add nodes adding /32 as subnet.
 */

var REACHABILITY_CAPABILITY = "delay.twoway";
var CONFIGFILE = "reasoner.json";
var PARAM_PROBE_SOURCE = "source.ip4";
var LEAF_GW = "__leaf__"; // ficticious gateway for labeling edges of LEAF nodes
var NET_STATUS_UNKNOWN = "gray";
var NET_STATUS_OK = "green";
var NET_STATUS_WARNING = "yellow";
var NET_STATUS_NOK = "red";
var DEFAULT_SAMPLE_TYPE = "delay.twoway"

var network=require("./network.js")
    ,_ = require("lodash")
    ,graphLib = require("graphlib")
    ,ip = require("ip")
    ,mplane = require('mplane')
    ,supervisor = require("mplane_http_transport")
    ,fs = require("fs")
    ,cli = require("cli")
    ,CBuffer = require("CBuffer")
    ,numbers = require("numbers")
    ,is = require('is-type-of')
    http = require('http'),
    url  = require('url')
    ,agent = require("./agent.js");

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

cli.enable("status");
// CLI params
cli.parse({
    supervisorHost:  ['b', 'Supervisor address', 'ip', configuration.supervisor.hostName],
    supervisorPort:  ['p', 'Supervisor port', 'int', configuration.supervisor.listenPort],
    SSL:['s', 'Use SSL in supervisor connections', 'bool', true],
    ca:['c' , 'Certificate file of the Certification Auth' , 'string' , configuration.ssl.ca],
    key:['k' , 'Key file of the client' , 'string' , configuration.ssl.key],
    cert:['t' , 'Certificate file of the client' , 'string' , configuration.ssl.cert],
    netFile:['n' , 'Network definition file' , 'string' , configuration.main.networkDefinitionFile],
    mode:['m' , 'Operational mode [AUTO|TRIGGERED]' , 'string' , configuration.main.mode],
    agent:['a' , 'Run the web agent' , 'bool' , false],
    triggerPort:['l' , 'Listen on this port for triggers in TRIGGERED mode' , 'int' , configuration.EXTTrigger.port],
    netStatusSamples:['u' , 'Number of samples for network status' , 'int' , configuration.smartAutoMeasure.netStatusSamples],
});


motd();
// Process name for ps
process.title = "mPlane reasoner";

// start the agent
if (cli.options.agent)
    agent.start();


// Maps a subnet(ip.cidr()) to network name(that is the label/id of nodes in netGraph/netDef)
// This is the base index for finding all nodes/edges
var __subnetIndex = {};
// The dual of __subnetIndex: from a  net name to a net index
var __netNameIndex = {};
// ARRAY with all available capability (DN added as feature)
var __availableProbes = [];
// Indexes for simply find available measures
var __IndexProbesByNet ={};
var __IndexProbesByType ={};
//  Shortest Paths Tree
var SPTree = null;

// Pending specifications (reasoner receipts)
var __specification_receipts__ = {};
// Measure already required.
// We can instantiate only 1 measure from one net to another
// After wait times it cannot instyantiate a new measure, the measure is considered dead and removed
var __registered_measures__ = {};

var netDef = network.importFromJson(cli.options.netFile);
if (!netDef){
    console.error("Error reading from network definition file");
    process.exit();
}
info("Network definitions loaded from "+cli.options.netFile+"\n");

// Import networks/gateways to generate a graph representation
var netGraph = new graphLib.Graph({ directed: true});

info("Checking for leafs ...");
checkForLeafs(netDef);

initNetGraph();

updateSPTree();

// Periodically dumps net status
dumpNetStatus();

// This find capabilities and then start scan and checkStatus
getCapabilities();



/********************************************************************************************************************/
// UTILITY FUNCTIONS
/********************************************************************************************************************/
/**
 * Scans the network
 * Tries to scan from any net to any net
 * @param config
 */
function scan(config){
    cli.info("NETWORK FULL SCAN STARTED\n");
    _.each(_.keys(SPTree) , function(fromLan){
        _.each(_.keys(SPTree[fromLan]) , function(toLan){
            if (fromLan != toLan){
                doPathMeasures(fromLan , toLan);
            }
        })
    });
}

/**
 * Get capabilities from supervisor.
 * Then start scan and checkStatus
 */
function getCapabilities(){
// Gets available capabilities and update indexes
    getSupervisorCapabilityes(function(err, caps){
        // Just for the ready message
        var descriptions = [];
        // Update indexes
        _.each(caps, function(capsDN , DN){
            capsDN.forEach(function(cap , index){
                var capability = mplane.from_dict(cap);
                if (!__availableProbes[DN])
                    __availableProbes[DN] = [];
                capability.DN = DN;
                // If source.ip4 param is not present we have no way to know where the probe is with respect of our net
                if (_.indexOf(capability.getParameterNames() , PARAM_PROBE_SOURCE) === -1){
                    showTitle("The capability has no "+PARAM_PROBE_SOURCE+" param");
                }else{
                    descriptions.push(capability.get_label() + " : " +capability.result_column_names().join(" , "));
                    var sourceParamenter = capability.getParameter(PARAM_PROBE_SOURCE);
                    var ipSourceNet = (new mplane.Constraints(sourceParamenter.getConstraints()['0'])).getParam();
                    capability.ipAddr= ipSourceNet;
                    // Add to the known capabilities
                    var index = (__availableProbes.push(capability))-1;
                    var netId = ipBelongsToNetId(ipSourceNet);
                    if (netId){
                        if (!__IndexProbesByNet[netId])
                            __IndexProbesByNet[netId] = [];
                        __IndexProbesByNet[netId].push(index);
                    }
                    var capTypes = capability.result_column_names();
                    capTypes.forEach(function(type , i){
                        if (!__IndexProbesByType[type])
                            __IndexProbesByType[type] = [];
                        __IndexProbesByType[type].push(index);
                    });
                }
            }); // caps of a DN
        });
        info(__availableProbes.length+" capabilities discovered on "+cli.options.supervisorHost);
        descriptions.forEach(function(desc , index){
            info("......... "+desc);
        });

        console.log("\n");
        console.log();
        cli.info("--------------------");
        cli.info("INIT PHASE COMPLETED");
        cli.info("--------------------");
        console.log();

        // Periodically scan all the net
        if (cli.options.mode == "AUTO"){
            setInterval(function(){
                    scan();
                }
                ,configuration.main.scan_period);
            setInterval(function(){
                    // Periodically check if results are ready
                    checkStatus();
                }
                ,configuration.main.results_check_period);
        }else{
            waitForTriggers();
        }
    });
}

/**
 * Inititalizes the net Graph
 */
function initNetGraph(){
    // Graph label
    netGraph.setGraph("mPlane DEMO NET");
    // Graph nodes
    _.each(netDef.networks , function(net , netName){
        var name = network.UNSPECIFIED_NET;
        netGraph.setNode(netName , net.description);
        if (net.subnet == network.UNSPECIFIED_NET){
            __subnetIndex[network.UNSPECIFIED_NET] = netName; //INDEXED
            __netNameIndex[netName] = network.UNSPECIFIED_NET;
        }
        else{
            __subnetIndex[ip.cidr(net.subnet)] = netName; //INDEXED
            __netNameIndex[netName] = ip.cidr(net.subnet);
            name = netName;
        }
    });
    info("Subnet nodes edges created");
    // LEAFS edges!
    _.each(netDef.networks , function(net , netName){
        if (net.leafOf){
            netGraph.setEdge(netName, networkName(net.leafOf) , LEAF_GW);
            netGraph.setEdge( networkName(net.leafOf) , netName , LEAF_GW);
        }
    });
    info("Leaf nodes linked");

    // Graph edges from gateways
    // Edges are identified using subnets
    _.each(netDef.gateways , function(gw , gwName){
        for (var i=0; i<gw.IPs.length ; i++){
            for (var j=0; j<gw.IPs.length;j++){
                if (i != j){
                    // Subnet is the id of the node
                    // We use the GW name as label of the edge for seamlessly retrive the connecting GW
                    netGraph.setEdge(networkName(ip.cidr(gw.IPs[i])) , networkName(ip.cidr(gw.IPs[j])) , gwName );
                    netGraph.setEdge( networkName(ip.cidr(gw.IPs[j])) , networkName(ip.cidr(gw.IPs[i])) ,gwName );
                }
            }
        }
    });
    info("Edges created");
    info("Graph created");
    info("..."+netGraph.nodeCount()+" networks");
    info("..."+netGraph.edgeCount()+" links");
}

/**
 * Given 2 known networks names, if there is a probe in fromNet, checks reachability of toNet
 * Basically it requires a probe to do some measure(s) (REACHABILITY_CAPABILITY) from A to B, including all net on the PATH
 * IF fromNet has more that one probe available, one is choosen RANDOMLY
 * The target for measure is the far-est IP of the GW from the source
 */
function doPathMeasures( fromNet , toNet){
    var fromNetID = getNetworkID(fromNet);
    var toNetID = getNetworkID(toNet);
    if (!fromNetID || !toNetID)
        return;
    var probesId = hasProbeType(fromNetID , REACHABILITY_CAPABILITY);
    // Are there any probes in the from net?
    if (probesId.length == 0){
        cli.debug("No available probes to do measure from \'"+getNetworkDescription(fromNetID)+"\' to \'"+getNetworkDescription(toNetID)+"\'");
        return;
    }
    // Randomly select a probe from available capabilities
    //var probe = __availableProbes[Math.floor(Math.random() * (probesId.length -1) )];
    var probe = __availableProbes[getRandomInt(0,(probesId.length -1))];
    try{
        var spec = new mplane.Specification(probe);
    }catch(e){
        cli.error("doPathMeasures: Error creating the specification");
        return;
    }

    // Do we have a path?
    if (!SPTree[fromNet][toNet]){
        showTitle("No PATH available "+fromNet +"(" + fromNetID + ") -> "+toNet+"("+toNetID+")");
    }else{
        cli.info("Considering a new measure: "+fromNet + "->" + toNet);
        // Array of IPs to be used ad target for our measures
        var targetIps = ipPath(fromNet , toNet);
        targetIps.forEach(function(curIP , index) {
            // If we can register the measure, proceed
            if (registerMeasure(fromNet , toNet) && curIP) {
                var destParam = probe.getParameter("destination.ip4");
                // Check if the destination is accepted by the probe
                if ((destParam.isValid(curIP) && destParam.met_by(curIP, undefined))) {
                    cli.info("     TARGET: " + curIP);
                    spec.set_when("now + 1s");
                    try {
                        spec.setParameterValue("destination.ip4", curIP);
                        spec.setParameterValue("source.ip4", probe.ipAddr);
                        spec.set_metadata_value("Destination_NET", toNet);
                        // Very bad... for now it works
                        if (probe.has_parameter("number"))
                            spec.setParameterValue('number', "5");
                        // We changed the params, so we should update the default token, or we will have a lot of specification with the same token!!!
                        spec.update_token();
                    } catch (e) {
                        cli.error("Error in parameter set");
                        cli.error(e);
                    }
                    supervisor.registerSpecification(
                        spec
                        , probe.DN
                        , {
                            host: cli.options.supervisorHost,
                            port: cli.options.supervisorPort,
                            keyFile: cli.options.key,
                            certFile: cli.options.cert,
                            caFile: cli.options.ca
                        },
                        function (err, receipt) {
                            if (err)
                                console.log(err);
                            else {
                                // Register the receipt
                                var rec = mplane.from_dict(JSON.parse(receipt));
                                rec._eventTime = new Date(); // Informational

                                // The RI does not set the label in the receipt
                                // Since we have it from the spec, simply set it in the receipt
                                rec.set_label(spec.get_label());
                                if (!(rec instanceof mplane.Receipt)) {
                                    cli.error("The returned message is not a valid Receipt");
                                } else {
                                    // We keep local registry of all spec and relative receipts
                                    if (rec) {
                                        rec._specification = spec;
                                        rec.fromNet = fromNet;
                                        rec.toNet = toNet;
                                        rec.destonationIP = curIP;
                                        rec.sourceIP = probe.ipAddr;
                                        registerReceipt(fromNet, toNet, rec);
                                    }
                                }
                            }
                        });
                } else {
                    cli.info("... " + curIP + " is not a valid value for this capability");
                }
            }else{
                cli.debug("     No slots available");
            }

        });
    }
}

/**
 * Periodically checks if any result is available and if needed triggers analysis module
 */
function checkStatus(){
    cli.debug("Check network status");
    _.each(_.keys(__specification_receipts__) , function(regID , index){
        var rec = __specification_receipts__[regID];
        cli.debug("... "+rec.fromNet+" -> "+rec.toNet)
        supervisor.showResults(new mplane.Redemption({receipt: rec}) , {
                host:cli.options.supervisorHost,
                port:cli.options.supervisorPort,
                ca:cli.options.ca,
                key:cli.options.key,
                cert:cli.options.cert
            },
            function(err , response){
                if (err){
                    if (err.message == 403){
                        // Not available
                        return;
                    }else{
                        showTitle("Error:"+body);
                        return;
                    }
                }else {
                    var supResponse = mplane.from_dict(body);
                    if (supResponse instanceof mplane.Result){
                        unRegisterMeasure(rec.fromNet, rec.toNet);
                        // Register the measure(s)
                        supResponse.get_result_column_values(REACHABILITY_CAPABILITY).forEach(function(sample,index){
                            //FIXME: select the sampleType
                            storeSample(rec.toNet , sample , DEFAULT_SAMPLE_TYPE);
                        });
                        //TODO: choose which analyzer has to be triggered from the resultType
                        analyzeDelay({
                            fromNet:rec.fromNet,
                            toNet:rec.toNet,
                            sampleType:DEFAULT_SAMPLE_TYPE
                        });
                    }

                }
            });
    });
}

/**
 * Periodically dumps on a json file the status of the network
 * The format is ready for vis.js
 */
function dumpNetStatus(){
    setInterval(function(){
        cli.debug("-- Dumping network status to "+configuration.dumpeToFile.file);
        var LENGTH_MAIN = 150;
        var netNodes = netGraph.nodes();
        var netEdges = netGraph.edges();
        var added = [];
        var color = "gray";
        var ret = {
            nodes : [],
            edges : []
        }
        ,tmpColor = {};

        netNodes.forEach(function(lan , index){
            var radius = 20,
                shape = "box",
                mass = 2,
                image = "";
            if (isLeaf(lan)){
                radius = 10;
                shape = "dot";
                mass= 2;
            }
            if (getNetworkDetail(getNetworkID(lan) , "shape") == "image"){
                shape = "image";
                image = getNetworkDetail(getNetworkID(lan) , "image");
            }
            color = getNetworkDetail(getNetworkID(lan) , "status") || "gray";
            // For leafs we color the edge
            if (isLeaf(lan)){
                tmpColor[lan] == color;
            }
            ret.nodes.push(
                {id: lan
                ,label: lan
                ,color: getNetworkDetail(getNetworkID(lan) , "status") || "gray"
                ,"color.border": getNetworkDetail(getNetworkID(lan) , "status") || "gray"
                ,title:getNetworkDescription(getNetworkID(lan))
                ,shape:shape
                ,radius:radius
                ,mass:mass
                ,image:image
                });
        });

        for (var i=0 ; i<netEdges.length ; i++){
            var edge = netEdges[i];

            var label = netGraph.edge(edge.v , edge.w)
                ,style = "line";

            if (label === LEAF_GW){
                label = "";
                style = "dash-line";
                if (tmpColor[edge.w])
                    color = tmpColor[edge.w];
                if (tmpColor[edge.v])
                    color = tmpColor[edge.v];
            }

            // We add only an edge between 2 nodes since we do not distinguish up/down
            if (_.indexOf(added, "from:"+edge.w+"to:"+edge.v ) == -1)
                ret.edges.push(
                    {
                        id: edge.v+edge.w
                        ,from: edge.v
                        ,to: edge.w
                         ,length: LENGTH_MAIN
                         ,color:"gray"
                         ,label:label
                         ,style:style
                   });
            added.push("from:"+edge.v+"to:"+edge.w)
        };

        fs.writeFile(configuration.dumpeToFile.file, JSON.stringify(ret), function(err) {
            if(err) {
                showTitle(err);
            } else {
                cli.debug("Network status dumped to file");
            }
        });

    }, configuration.dumpeToFile.period || 10000);
}

/**
 * Simple analyzer of rtt. Based on 2 thresholds (ok|warning|error)
 *
 * @param result
 * @param config
 *  fromNet: the net name from
 *  toNet: the net name to
 */
function analyzeDelay(config){
    // Read available samples for the toNet, for this type of measure
    var samples = getSamples(config.toNet, config.sampleType);

    var RTT = numbers.statistic.mean(samples);

    if (RTT <= configuration.delayAnalyzer.rttThresoldGood){
        setNetworkDetail(getNetworkID(config.toNet) , "status" , NET_STATUS_OK );
    }
    if ((RTT > configuration.delayAnalyzer.rttThresoldGood) && (RTT <= configuration.delayAnalyzer.rttThresoldBad)){
        setNetworkDetail(getNetworkID(config.toNet) , "status" , NET_STATUS_WARNING );
    }
    if (RTT > configuration.delayAnalyzer.rttThresoldBad){
        setNetworkDetail(getNetworkID(config.toNet) , "status" , NET_STATUS_NOK );
    }
    if (!RTT)
        setNetworkDetail(getNetworkID(config.toNet) , "status" , NET_STATUS_UNKNOWN );
    cli.info("... "+getNetworkDescription(getNetworkID(config.toNet)) + " status: " + getNetworkStatus(getNetworkID(config.toNet)));
}


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

/**
 * Given a netId (as stored in __subnetIndex, from ip.cidrSubnet(subnet)) returns a detail from netDef
 * @param netId
 * @param detail
 */
function getNetworkDetail(netId , detail){
    if (!__subnetIndex[netId])
        return null;
    return netDef.networks[__subnetIndex[netId]][detail];
}
function setNetworkDetail(netId , detail , value){
    if (!__subnetIndex[netId]){
        cli.err("netId not defined:"+netId);
        return;
    }
    netDef.networks[__subnetIndex[netId]][detail] = value;
}
// Wrap of getNetworkDetail for subnet info
function getNetworkSubnet(netID){
    return getNetworkDetail(netID , "subnet");
}
function getNetworkDescription(netID){
    return getNetworkDetail(netID , "description");
}
function getNetworkStatus(netID){
    return getNetworkDetail(netID , "status");
}
/**
 * Given a network name return the network ID, if any
 * @param netName
 */
function getNetworkID(netName){
    return __netNameIndex[netName];
}


/*************************************************************************************************
/**             SAMPLES MANAGEMENT   **/
/*************************************************************************************************

/**
 * Stores a sample of type sampleType in a netName structure
 * @param netName
 * @param sampleValue
 * @param sampleType
 */
function storeSample(netName , sampleValue , sampleType){
    if (!sampleType)
        sampleType = DEFAULT_SAMPLE_TYPE;
    // Initialize if needed
    if (!getNetworkDetail(getNetworkID(netName) , "samples"))
        setNetworkDetail(getNetworkID(netName) , "samples" , {});
    var netSamples = getNetworkDetail(getNetworkID(netName) , "samples");
    if (!netSamples[sampleType])
        netSamples[sampleType] = new CBuffer(cli.options.netStatusSamples);
    netSamples[sampleType].push(sampleValue);
}
/**
 * Given a netName and a sampleType returns the current ARRAY of DATA
 * @param netName
 * @param sampleType
 */
function getSamples(netName, sampleType){
    netSamples = getNetworkDetail(getNetworkID(netName) , "samples");
    if (netSamples){
        var ret=[];
        // Check are all numbers
        netSamples[sampleType].toArray().forEach(function(num){
            if (is.number(parseFloat(num)))
                ret.push(parseFloat(num));
        });
        return ret;
    }
    return null;
}

/*************************************************************************************************




/**
 * Builds a Shortest Path Tree on the network graph
 */
function updateSPTree(){
    if (!netGraph){
        throw new Error("Error computing the SP Tree: Network Tree is null");
        return false
    }
    //  Floyd-Warshall
    SPTree = graphLib.alg.floydWarshall(netGraph);
    info("SPTs calculated ( Floyd-Warshall )");
    return true;
}

/**
 * Returns IPs to be checked (destinations) on the path from fromNet to toNet.
 * Uses the SPTree
 */
function ipPath(fromNet , toNet){
    var ret = [];
    if (!SPTree)
        updateSPTree();
    if (!SPTree[fromNet][toNet]){
        showTitle("No path available from "+fromNet+" to " +toNet);
        return ret;
    }
    // We do a backward path, from destination do source
    var e2e = SPTree[fromNet][toNet];
    var next = toNet;
    for (var step=0; step<e2e.distance; step++){
        var target = SPTree[fromNet][next].predecessor,
            gwIP;
        if (next != fromNet){
            if (isLeaf(next)){
                // If it is a leaf we directly use the IP (it should be a /32)
                var sp = getNetworkSubnet((getNetworkID(next))).split("/");
                ret.push(sp[0]);
            }
            else{
                gwIP = gatewayIpOnNet(netGraph.edge(next , target) , next);
                if (gwIP){
                    ret.push(network.extractIp(gwIP));
                }
            }

        }
        next = SPTree[fromNet][next].predecessor;
    }
    return ret;
}

/**
 * Given an IP returns the indexID for __subnetIndex of the subnet it belongs, null if not belonging to any of the known nets
 * @param ip
 */
function ipBelongsToNetId(IPadd){
    var ret = null;
    _.each(_.keys(__subnetIndex) , function(netId , index){
        var netInfo = ip.cidrSubnet(getNetworkSubnet(netId));
        if ((ip.toLong(IPadd) >= ip.toLong(netInfo.firstAddress)) && (ip.toLong(IPadd) <= ip.toLong(netInfo.lastAddress))){
            ret =  netId;
        }
    });
    return ret;
}
/**
 * Which IP from gwName ones is on netName?
 */
function gatewayIpOnNet(gwName , netName){
    if (!gwName || !netName || (gwName == LEAF_GW))
        return null;
    if (!netDef['gateways'][gwName]){
        showTitle("Missing info about net gateway " + gwName);
        return null;
    }
    for (var i=0 ; i<netDef['gateways'][gwName].IPs.length ; i++){
        var curIP = netDef['gateways'][gwName].IPs[i];
        // If the net IP belongs to is the same of netName, I,ve found my IP
        if (ipBelongsToNetId(curIP) == getNetworkID(netName)){
            return curIP;
        }
    };
}


/**
 * Given a network definition looks for net that are leaf of other net (for example 192.168.1.1/32 is leaf of 192.168.123.0/24)
 * Leaf are marked with feature isLeaf:netID
 * This is a Greedy funcntion
 * @param netDefinition
 */
function checkForLeafs(netDefinition){
    var netNames = _.keys(netDefinition.networks);
   for (var i=0 ; i<netNames.length ; i++){
       for (var j=0 ; j<netNames.length ; j++){
            if (i != j){
               if (isLeafOf(netDefinition.networks[netNames[i]].subnet , netDefinition.networks[netNames[j]].subnet)){
                   info("..."+netNames[i] +" is leaf of "+netNames[j]);
                   netDefinition.networks[netNames[i]].leafOf = ip.cidr(netDefinition.networks[netNames[j]].subnet);
               }
            }
       }
   }
}

/**
 * return true if checked is leaf of leafOf
 * @param checked subnet to be checked
 * @param leafOf subnet to be checked toward
 */
function isLeafOf(checked , leafOf){
    var checkedInfo = ip.cidrSubnet(checked),
        leafOfInfo = ip.cidrSubnet(leafOf);
    if ((ip.toLong(checkedInfo.firstAddress) >= ip.toLong(leafOfInfo.firstAddress)) && (ip.toLong(checkedInfo.lastAddress) <= ip.toLong(leafOfInfo.lastAddress)) ){
        cli.debug("---- "+checked+" leaf of "+leafOf)
        return true;
    }
    return false;
}
/**
 * is the net a leaf?
 * @param netName
 */
function isLeaf(netName){
    if (!netDef.networks[netName])
        return false;
    if (netDef.networks[netName].leafOf){
        return true;
    }
    return false;
}

/**
 * Given a netName, if it is a leaf, returns the parent net ID (the real subnet net ID)
 * @param netName
 */
function parentNetIDOfLeaf(netName){
    if (!isLeaf(netName)){
        showTitle("parentOfLeaf-- "+netName+" is not a leaf");
        return false;
    }else
        return (netDefinition.networks[netName].leafOf);
}

/**
 * Checks if a net has a probe of given type
 * @param netId
 * @return an array of matching probeID if any
 */
function hasProbeType(netId , type){
    if (!type)
        type = DEFAULT_SAMPLE_TYPE;
    // Do we have the net and a valid probe?
    if ((!__IndexProbesByNet[netId]) || (!__IndexProbesByType[type]))
        return [];
    return _.intersection(__IndexProbesByType[type] , __IndexProbesByNet[netId]);
}

function networkName(netId){
    if (!__subnetIndex[netId])
        return null;
    return(__subnetIndex[netId]);
}


/****************************************************************************************************************/
/*          smart Auto Measure

In order to avoid to many measure instantiated, only a measure a time can be instantiate between 2 networks
After num_retries of instantiating a measure and the slot is not free, the registered measure is considered dead and removed

*/

function uniqueRegID(fromNet , toNet){
    return fromNet+toNet;
}

/**
 * Tries to register a measure. If no slot are available return false
  * @param fromNet NAME of the net
 * @param toNet NAME of the net
 */
function registerMeasure(fromNet , toNet ){
    var regID = uniqueRegID(fromNet , toNet);
    if (!__registered_measures__[regID]){
        __registered_measures__[regID]={
            fromNet: fromNet,
            toNet:toNet,
            numRetries : 0
        };
        return true;
    }else{
        if (__registered_measures__[regID].numRetries < configuration.smartAutoMeasure.numRetries){
            __registered_measures__[regID].numRetries++;
            return false;
        }else{
            // The registered measure is LOST!
            showTitle("MEASURE LOST! "+fromNet+" -> "+toNet)
            unRegisterMeasure(fromNet , toNet);
            return true; // We can add a new measure
        }
    }
}
// We need the receipt to remove it in case we should declare a measure lost
function registerReceipt(fromNet , toNet , receipt){
    if (!(receipt instanceof mplane.Receipt)){
        showTitle("registerReceipt ERROR: the provided object is not a valid receipt");
        return false;
    }
    var regID =uniqueRegID(fromNet , toNet);
    if (!__registered_measures__[regID]){
        return false;
    }
    __specification_receipts__[regID] = receipt;
    return true;
}
function unRegisterMeasure(fromNet , toNet){
    var regID = uniqueRegID(fromNet , toNet);
    if (!__registered_measures__[regID]){
        showTitle("The measure is not registered. "+fromNet+" -> "+toNet);
        return false;
    }
    delete __specification_receipts__[regID];
    delete __registered_measures__[regID];
    return true;
}


/****************************************************************************************************************/

/**
 * Waits for trigger messages in TRIGGERED mode
 */
function waitForTriggers(){
    var server = http.createServer(function (request, response) {
        //console.log(url.parse(request.url, true).query)

        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end("mPlane test PAGE");

        setInterval(function(){
                scan();
            }
            ,configuration.main.scan_period);
        setInterval(function(){
                // Periodically check if results are ready
                checkStatus();
            }
            ,configuration.main.results_check_period);

    });

    server.listen(cli.options.triggerPort);
    cli.info("Waiting someone triggers me at http://127.0.0.1:"+cli.options.triggerPort+"/");
}

/****************************************************************************************************************/

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
    console.log("               mPlane DEMO REASONER ");
    console.log();
    console.log("    An Intelligent Measurement Plane for Future \n         Network and Application Management");
    console.log();
    console.log();
}

function info(msg){
    cli.info(msg);
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
    console.log(pad("",text.length,"-"));
    console.log(text);
    console.log(pad("",text.length,"-"));
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
