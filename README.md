#reasoner
========

mPlane DEMO reasoner.

It builds an internal static description of a network, interacts with a supervisor to collect capabilities availability and dinamically registers Specifications to be executed in order to have samples of network latencies.

Based on a simple threshold based analysis, it periodically build a map of network status that can publish through an integrated we server.

## Install


- git clone https://github.com/finvernizzi/reasoner.git
- install with npm these packages
	- lodash , graphLib , ip , mplane , mplane_http_transport , fs , cli , CBuffer , numbers , is-type-of , http , url

## Configuration


Create in the main directory a reasoner.json file as following example, changing relevant details for your environment.

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
      "netStatusSamples":5
    },
    "dumpeToFile":{
      "period": 5000,
      "file": "./www/network_status.json"
    },
    "supervisor":{
        "listenPort":2427,
        "hostName":"Supervisor-1.TI.mplane.org"
    },
    "registry":{
        "file":"./registry.json"
    },
    "ssl":{
        "key": "../ca/certs/Reasoner-TI-plaintext.key"
        ,"cert": "../ca/certs/Reasoner-TI.crt"
        ,"ca": [ "../ca/root-ca/root-ca.crt" ]
        ,"requestCert" : true
    },
    "delayAnalyzer":{
        "rttThresoldGood":0.50,
        "rttThresoldBad":1
    }
}
```

Certificates are very important since all access controll done by the supervisor is based on them. For a complete set of ready certificates and root certification authority files see [RI_PKI.](https://github.com/stepenta/RI/tree/master/PKI)

## NET configuration

The reasoner is able to build an internal network view based on a static file loaded in init phase. Net description is based upon gateways, nodes forwarding traffic netween interfaces, and L3 lans. You can also add leaf nodes that are simply nodes whith IP belongings to a LAN you defined.
Following is a working net description example.

```json
{
    "gateways":{
        "soekris-gw":{
            "IPs":["192.168.123.1/26" , "192.168.123.130/30" ,"192.168.123.65/26" ]
        },
        "internet-gw":{
            "IPs":["192.168.123.129/30" , "10.0.0.1/27"]
        },
        "google-gw":{
            "IPs":["173.194.112.127/24" , "10.0.0.1/27"]
        },
        "mplane-gw":{
            "IPs":["130.192.9.1/24" , "10.0.0.1/27"]
        }
    },
    "networks":{
        "serviceNet":{
            "description" : "LAN dedicated to auxiliary services",
            "subnet": "192.168.123.0/26",
            "gateways" : ["soekrisGW"]
        },
        "internetUplink":{
            "description" : "Uplink toward Internet access",
            "subnet": "192.168.123.128/30",
            "gateways" : ["internet-gw" , "soekris-gw"],
            "type": "p2p"
        },
        "internet":{
            "description" : "Internet",
            "subnet": "10.0.0.1/27",
            "gateways" : ["internet-gw"]
        },
        "userAccess":{
            "description" : "User access LAN",
            "subnet": "192.168.123.65/26",
            "gateways" : ["soekris-gw"]
        },
        "user_66":{
            "description" : "DHCP User 66",
            "subnet": "192.168.123.66/32",
            "gateways" : ["soekris-gw"]
        },
        "user_67":{
            "description" : "DHCP User 67",
            "subnet": "192.168.123.67/32",
            "gateways" : ["soekris-gw"]
        },
        "user_68":{
            "description" : "DHCP User 68",
            "subnet": "192.168.123.68/32",
            "gateways" : ["soekris-gw"]
        },
        "google_net":{
            "description" : "Google Network",
            "subnet": "173.194.112.1/24",
            "gateways" : ["google-gw"],
            "shape": "image",
            "image": "./img/google.png"
        },
        "google":{
            "description" : "Google Network",
            "subnet": "173.194.112.127/32",
            "gateways" : ["google-gw"],
            "shape": "image",
            "image": "./img/google.png"
        },
        "polito":{
            "description" : "mPlane site",
            "subnet": "130.192.9.1/24",
            "gateways" : ["mplane-gw"]
        },
        "mplane":{
            "description" : "mPlane site",
            "subnet": "130.192.9.200/32",
            "gateways" : ["mplane-gw"],
            "shape": "image",
            "image": "./img/mplane.png"
        }
    }
}
```

Be very carefull in subnetting that is the key for the reasoner for internally correcly associate nodes, gateways and leaf nodes.

## Registry
As any mplane component needs to have a registry, that should be a file correctly linked in the configuration.

[Here](https://github.com/finvernizzi/reasoner/blob/26429c1f33853b5f586b6de196eed1e7aded421a/registry.json) is a working example of a registry.


## Runtime options

The reasoner has a number of exposed otions that can override configuration file.
Just  type node ./reasoner.js -h to see the help.

One of the most important option is probabily -a that you shuld set to true if you want the integrated HTTP server to start.

##LICENSE

This software is released under the [BSD](http://en.wikipedia.org/wiki/BSD_licenses#2-clause_license_.28.22Simplified_BSD_License.22_or_.22FreeBSD_License.22.29) license.



