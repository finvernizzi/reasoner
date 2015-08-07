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
[![mPlane](https://github.com/finvernizzi/reasoner/blob/master/reasoner.png)](#)  
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
