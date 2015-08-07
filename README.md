#reasoner
========

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
The reasoner works starting from a static description of the network done by means of a json file. On this description reasoner, interacting with a supervisor, maps available capabilities (delay.twoway) and tries to require measures in order to build a network status map. For each network node, a three level status is computed comparing average RTT with two static thresolds. 

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

