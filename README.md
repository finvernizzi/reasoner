Reasoner
=================
[![mPlane](http://www.ict-mplane.eu/sites/default/files//public/mplane_final_256x_0.png)](http://www.ict-mplane.eu/)


This package contains a working example of a demo REASONER Component of the[mPlane](http://www.ict-mplane.eu/) architecture. This implementation includes also a GUI backend.
The implementation leverages mPlane nodejs library and mPlane HTTPS transport library.

#Installation
Get all the code from github

```git clone https://github.com/finvernizzi/reasoner.git```

This command will install all the components and needed stuff in the supervisor folder.

```
README.md        agent.js         reasoner.json    var
.gitignore       demoNet.json     network.js       reasoner.js      registry.json    www
```

Now you need to install all the nodejs dependencies
```
cd ./reasoner
npm install
```
Done. You are ready to run the reasoner.

#How does it work
[![reasoner](https://github.com/finvernizzi/reasoner/blob/master/reasoner.png)](#)  
The reasoner works starting from a static description of the network done by means of a json file. On this description the reasoner, interacting with a supervisor, maps available capabilities (*delay.twoway*) and tries to require measures in order to build a network status map. For each network node, a three level status is computed comparing average RTT with two static thresolds. 

The work of the reasoner can be described in two main phases:

 * Init phase

		* Build network topology graph
		* Calculate SPTs (any to any)
		* Discover available measures from supervisor
		* Map measures on network graph
 * Run phase

		* Iteratively run measures from usefull vantage points to any other points
		* Keep Samples (circular array) per LAN (graph nodes)
		* Periodically do stats and decide the status of a LAN

When in Run phase the Reasoner periodically:

	* Calculates means values per node
	* On the stored samples
		* Compares means with 2 thresholds good, bad
		* Tags the node as 
			* ok (green)
			* warning (yellow)
			* nok (red)
		* Build a vis.js description of the net

The vis.js description is available through an embedded HTTP agent.  This file, visualized by [vis.js](http://visjs.org/) is a representation of the status of the netwrok as seen by the Reasoner.

[![netstat](https://github.com/finvernizzi/reasoner/blob/master/network_status.png)](#) 

#Configuration

Configuration of the Reasoner is done on the reasoner.json file.
```json
{
    "main":{
        "logFile":"/var/log/mplane/reasoner.log",
        "version":"1.0",
        "description": "mPlane REASONER",
        "prompt_separator":"#",
        "results_check_period": 10000,
        "scan_period": 10000,
        "process_name": "mPlane Reasoner",
        "networkDefinitionFile":"./demoNet.json",
        "mode":"AUTO"
    },
    "EXTTrigger":{
      "address":"127.0.0.1",
       "port":"7001"
    },
    "smartAutoMeasure":{
      "numRetries":10,
      "netStatusSamples":3
    },
    "dumpeToFile":{
      "period": 5000,
      "file": "./www/network_status.json"
    },
    "supervisor":{
        "listenPort":2427,
        "hostName":"Supervisor-1.SSB.mplane.org"
    },
    "registry":{
         "url": "http://ict-mplane.eu/registry/demo",
    },
    "ssl":{
        "key": "../ca/certs/Reasoner-TI-plaintext.key"
        ,"cert": "../ca/certs/Reasoner-TI.crt"
        ,"ca": [ "../ca/root-ca/root-ca.crt" ]
        ,"requestCert" : true
    },
    "delayAnalyzer":{
        "rttThresoldGood":300,
        "rttThresoldBad": 500
    }
}
```

##Main

This section contains generic configuration information.
`networkDefinitionFile` is the location if the file describing the static knowloedge of the network. See Below for an example.
`mode` set the activation model of the reasoner activities. In auto mode (default) the reasoner start automatically the run phase after initialization, in triggered mode an HTTP listener waiting for a GET triggering the run status.

##EXTTrigger

Details for trigger mode.

##delayAnalyzer

Here you define thresholds for declaring the status of a network node. Values are in milliseconds.
`rttThresoldGood` is the status below which a nde is considered in good status.
`rttThresoldBad` is the status above which a nde is considered in bad status.


#Network description

In this section you can find an example of network description file.
Netowrks are intended as LAN interconnected by gateways. The three is built automatically by the Reasoner comparing the subnet property of a network with the IPs of a gateway.  
If a network hash a /32 IP, it is considered a leaf. Router are assumed to forward traffic between all the interconnected networks.

```json
{
    "gateways":{
        "access-gw":{
            "IPs":["192.168.123.130/30" ,"192.168.123.65/26" ]
        },
        "service-gw":{
            "IPs":["192.168.123.1/26" , "192.168.123.130/30" ]
        },
        "internet-gw":{
            "IPs":["192.168.123.129/30" , "217.57.160.197/27"]
        },
        "google-gw":{
            "IPs":["173.194.112.1/24" , "217.57.160.197/27"]
        }
    },
    "networks":{
        "ServiceNet":{
            "description" : "LAN dedicated to auxiliary services",
            "subnet": "192.168.123.0/26",
            "gateways" : ["service-gw"]
        },
        "Internet_Service_Provider":{
            "description" : "Your Preferred Internet Service Provider",
            "subnet": "192.168.123.128/30",
            "gateways" : ["internet-gw" , "access-gw","service-gw"],
            "type": "p2p"
        },
        "Internet":{
            "description" : "Internet",
            "subnet": "217.57.160.197/27",
            "gateways" : ["internet-gw"]
        },
        "Access_net":{
            "description" : "Access net",
            "subnet": "192.168.123.65/26",
            "gateways" : ["access-gw"]
        },
        "ServiceNode":{
            "description" : "Node for services",
            "subnet": "192.168.123.4/32",
            "gateways" : ["service-gw"]
        },
        "user_66":{
            "description" : "DHCP User 66",
            "subnet": "192.168.123.66/32",
            "gateways" : ["access-gw"]
        },
        "user_67":{
            "description" : "DHCP User 67",
            "subnet": "192.168.123.67/32",
            "gateways" : ["access-gw"]
        },
        "user_68":{
            "description" : "DHCP User 68",
            "subnet": "192.168.123.68/32",
            "gateways" : ["access-gw"]
        },
        "user_69":{
            "description" : "DHCP User 69",
            "subnet": "192.168.123.69/32",
            "gateways" : ["access-gw"]
        },
        "user_70":{
            "description" : "DHCP User 70",
            "subnet": "192.168.123.70/32",
            "gateways" : ["access-gw"]
        },
        "user_71":{
            "description" : "DHCP User 71",
            "subnet": "192.168.123.71/32",
            "gateways" : ["access-gw"]
        },
        "user_72":{
            "description" : "DHCP User 72",
            "subnet": "192.168.123.72/32",
            "gateways" : ["access-gw"]
        },
        "user_72":{
            "description" : "DHCP User 72",
            "subnet": "192.168.123.72/32",
            "gateways" : ["access-gw"]
        },
        "user_73":{
            "description" : "DHCP User 73",
            "subnet": "192.168.123.73/32",
            "gateways" : ["access-gw"]
        },
        "user_74":{
            "description" : "DHCP User 74",
            "subnet": "192.168.123.74/32",
            "gateways" : ["access-gw"]
        },
        "google_cdn":{
            "description" : "Google CDN Network",
            "subnet": "173.194.112.0/24",
            "gateways" : ["google-gw"],
            "__shape": "image",
            "__image": "./img/google.png"
        },
        "google":{
            "description" : "Google Network",
            "subnet": "173.194.112.127/32",
            "gateways" : ["google-gw"],
            "__shape": "image",
            "__image": "./img/google.png"
        }
    }
}
```



#LICENSE
This software is released under the [BSD](https://en.wikipedia.org/wiki/BSD_licenses#2-clause_license_.28.22Simplified_BSD_License.22_or_.22FreeBSD_License.22.29) license.
