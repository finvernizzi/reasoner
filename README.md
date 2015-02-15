reasoner
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
cd ./supervicor
npm install
```
Done. You are ready to run the supervisor.

    
#Configuration
    
In order to change the configuration edit the supervisor.json file.
This an example of working config

```json
{
    "main":{
        "logFile":"/var/log/mplane/supervisor.log",
        "listenPort":2427,
        "hostName":"Supervisor-1.TI.mplane.org",
        "cli":true,
		"keep_claimed_results" : true
    },
	"reasoner":{
		"url":"127.0.0.1",
		"port":"8081",
		"path":"/network_status.json"
	},
    "gui":{
    	"defaultUrl":"/gui/static/login.html"
    	,"staticContentDir":"/www"	
    },
    "ssl":{
        "key": "../ca/certs/Supervisor-TI-plaintext.key"
        ,"cert": "../ca/certs/Supervisor-TI.crt"
        ,"ca": [ "../ca/root-ca/root-ca.crt" ]
        ,"hostName":"Supervisor-1.TI.mplane.org."
        ,"requestCert" : true
    }
}
```


The configuration is a plain JSON file conataining 4 main sections described below.
###main
This section contains general configuration such as the log file location, the listen IP and PORT (are the same for supervisor and GUI agent). The cli configuration enables an interactive simple cli while if disabled the supervisor after starting simply goes in backgrouond.
If `keep_claimed_results` is true, the supervisor does not delete a result after it has been calimed with the correct receipt.

###reasoner
The configurations for interacting with the reasoner and in partcular for expose in the GUI backend the network status as known by the reasoner.

###gui
Some details about the gui backend.

###SSL
Where to find ssl certificates and if they should be honoured or not.

#Run
To start the supervisor simply digit
```
node ./supervisor
```

