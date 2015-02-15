//(c) 2013-2014 mPlane Consortium (http://www.ict-mplane.eu)
//           Author: Fabrizio Invernizzi <fabrizio.invernizzi@telecomitalia.it>
//
//                                  
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//1. Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.
//2. Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the distribution.
//3. All advertising materials mentioning features or use of this software
//   must display the following acknowledgement:
//   This product includes software developed by the <organization>.
//4. Neither the name of the <organization> nor the
//   names of its contributors may be used to endorse or promote products
//   derived from this software without specific prior written permission.
//
//THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ''AS IS'' AND ANY
//EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
//DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
//SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

//#mPlane nodeJS reference library
//
//This is the mPlane nodejs library. 
//The architecture and software structure is freely inspired by [mPlane reference implementation](http://fp7mplane.github.io/protocol-ri/) written in python by Brian Trammell <brian@trammell.ch>.


// ##External libraries
// > These are support libraries
var _ = require("lodash"),
    util = require('util'),
    CronJob = require('cron').CronJob,
    fs = require("fs"),
    url = require("url"),
    sha1 = require("sha-1");
// --------------------------


////////////////////////////////////////////////////////////////////////////
// #Constants
////////////////////////////////////////////////////////////////////////////
//>Duration regular expression
var _dur_re = /((\d+)d)?((\d+)h)?((\d+)m)?((\d+)s)?/;
var _dur_seclabel = {
    'd' : 86400,
    'h' : 3600,
    'm' : 60,
    's' : 1
};

var KEY_PARAMETERS = "parameters";
var KEY_METADATA = "metadata";
var KEY_RESULTS = "results";
var KEY_RESULTVALUES = "resultvalues";
var KEY_TOKEN = "token";
var KEY_MESSAGE = "message";
var KEY_LINK = "link";
var KEY_WHEN = "when";
var KEY_SCHEDULE = "schedule";
var KEY_REGISTRY = "registry";
var KEY_LABEL = "label";

var KEY_MONTHS = "months";
var KEY_DAYS = "days";
var KEY_WEEKDAYS = "weekdays";
var KEY_HOURS = "hours";
var KEY_MINUTES = "minutes";
var KEY_SECONDS = "seconds";


var ELEMENT_SEP = ".";
var RANGE_SEP = " ... ";
var DURATION_SEP = " + ";
var PERIOD_SEP = " / ";
var SET_SEP = ",";


var KIND_CAPABILITY = "capability";
var KIND_SPECIFICATION = "specification";
var KIND_RESULT = "result";
var KIND_RECEIPT = "receipt";
var KIND_REDEMPTION = "redemption";
var KIND_INDIRECTION = "indirection";
var KIND_WITHDRAWAL = "withdrawal";
var KIND_INTERRUPT = "interrupt";
var KIND_EXCEPTION = "exception";
var KIND_PARAMETER = "parameter";
var KIND_CONSTRAIN = "constrain";

// Usefull for simpler coding...
var supported_kinds = [KIND_CAPABILITY , KIND_SPECIFICATION , KIND_RESULT , KIND_RECEIPT , KIND_REDEMPTION , KIND_INDIRECTION , KIND_WITHDRAWAL , KIND_INTERRUPT , KIND_EXCEPTION , KIND_PARAMETER , KIND_CONSTRAIN] ;

var _dow_label = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
//CHECKME: non sono sicuro di cosa volesse fare con questo
//var _dow_number = _dow_label.length();

var __DEFAULT_REGISTRY_FILE = "./registry.json";


//////////////////////////////////////////////////////////////////////////////////////////////
//
// #time class
var time = function(){
}
// String rapresentation of past, now, future
time.TIME_PAST      = "past";
time.TIME_NOW       = "now";
time.TIME_FUTURE    = "future"
time.TIME_INVALID    = "invalid";

//##time_past
//> is strVal a TIME_PAST vlaue?
time.time_past = function(strVal){
    return (strVal === time.TIME_PAST);
}
//##time_now
//> is strVal a TIME_NOW vlaue?
time.time_now = function(strVal){
     return (strVal === time.TIME_NOW);
}
//##time_future
//> is strVal a TIME_FUTURE vlaue?
time.time_future = function(strVal){
   return (strVal === time.TIME_FUTURE);
}

// ##parse_time (parseTime)
// Given a valid datetime string or PAST/FUTURE/NOW string return a new Date obj or PAST/FUTURE/NOW
// Static function. CHECKME: verificare quali funzioni serve lasciare statiche
time.parse_time = function(valStr){
    if (!valStr)
        return null;
    switch(valStr){
        case time.TIME_PAST:
            return time.TIME_PAST;
            break;
        case time.TIME_FUTURE:
            return time.TIME_FUTURE;
            break;
        case time.TIME_NOW:
            return time.TIME_NOW;
            break;
        default:
            try{
                return  new Date(valStr);
            }catch(e){
                return time.TIME_INVALID;
            }
    }
}

// ##unparse_time (unParseTime)
// Given a valid datetime or PAST/FUTURE/NOW string return a string representation
// Static function
time.unparse_time = function(valts){
    if (!valts)
        return time.TIME_INVALID;
    if (valts instanceof Date)
             return  valts.toString();
   switch(valStr){
        case time.TIME_PAST:
            return time.TIME_PAST;
            break;
        case time.TIME_FUTURE:
            return time.TIME_FUTURE;
            break;
        case time.TIME_NOW:
            return time.TIME_NOW;
            break;
        default:
            return time.TIME_INVALID;
    } 
    
}


// ##Duration functions
// ### parse_dur (parseDur)
// Converts a string representing a duration in seconds
time.parse_dur = function(valstr){
    if (!valstr)
        return null
    var valsec = 0;
    m = _dur_re.exec(valstr);
    var durSecLabels = _.keys(_dur_seclabel);
    // The returned obj has the input in position 0 
    for (var i=1 ; i<5; i++){
        if (!isNaN(m[2*i])){
            valsec += (parseInt(_dur_seclabel[durSecLabels[i-1]]) * parseInt(m[2*i]));
        }
    }
    return valsec;
}

// ### unparse_dur (unParseDur)
// Converts a string representing a duration in seconds
time.unparse_dur = function(valtd){
    var valstr = "";
    var durSecLabels = _.keys(_dur_seclabel);
    // The returned obj has the input in position 0 
    for (var i=1 ; i<5; i++){
        if (valtd >= _dur_seclabel[durSecLabels[i-1]]){
            valunit = parseInt(valtd / _dur_seclabel[durSecLabels[i-1]]);
            valstr += valunit.toString() + durSecLabels[i-1];
            valtd -= valunit * _dur_seclabel[durSecLabels[i-1]]
        }
    }
    if (!valstr.length)
        valstr = "0s";
    return valstr;
}
time.unParseDur = time.parse_dur;

// This is not defined in Javascript
time.total_seconds = function(valInt){
    return valInt;
}

//##areEqual
//>Given 2 date (in string or Date format) compares them and return true if they are equal
time.areEqual = function(date_A , date_B){
    // Are special case string?
    if ((_.isString(date_A)) && ((date_A == time.TIME_FUTURE) ||  (date_A == time.TIME_NOW) || (date_A == time.TIME_PAST))  ){
        return (date_A === date_B);
    }
    
    var dA , dB;
    // We convert all to Date
    if (!_.isDate(date_A))
        dA = new Date(date_A);
    else    
        dA = date_A;
    if (!_.isDate(date_B))
        dB = new Date(date_B);
    else    
        dB = date_B;
    return (dB.getTime() === dA.getTime());
}

//////////////////////////////////////////////////////////////////////////////////////////////
//#when class
//> Defines the temporal scopes for capabilities, results, or 
//> single measurement specifications.
//> a and b could be strings (past,now,future) or Date obj
var when = function(valstr , a , b , d , p){
    this.setDate("_a" , a || null);
    this.setDate("_b" , b || null);
   
    this._d = d || null; // duration
    this._p = p || null; // period

    if (valstr){
        this.__string__ = valstr;
        this.parse(valstr)
    }
}
when.prototype.toString = function(){
    if ("__string__" in this)
        return  this.__string__;
    else{
        return("")
    }
}

// Set one of the to date in when depending on the type of value we pass
when.prototype.setDate = function(whichDate , value){
    if (!value){
        this[whichDate] = null;
        return;
    }
     if (value && (value === time.TIME_PAST || value === time.TIME_NOW || value === time.TIME_FUTURE))
        this[whichDate] = value ;
    else
        (_.isDate(value))?this[whichDate]=value:this[whichDate] = new Date(value);
}

//##parse
// From a valid when string , set the details in the when instance
when.prototype.parse = function(valstr){

        // First separate the period from the value and parse it
        var valsplit = valstr.split(PERIOD_SEP);
        if (valsplit.length > 1){
            this._p = time.parse_dur(valsplit[1]);
        }else
            this.p = null;
    
        // then try to split duration or range
        valsplit = valsplit[0].split(DURATION_SEP); //+
       
        if (valsplit.length > 1){
            this._d = time.parse_dur(valsplit[1]);
            this.setDate("_a" , valsplit[0]);
            this._b = null;
        }else{
            this._d = null
            valsplit = valsplit[0].split(RANGE_SEP);
             if (valsplit.length > 1){
                 this.setDate("_a" , time.parse_time(valsplit[0]));
                 this.setDate("_b" , time.parse_time(valsplit[1]));
            }
            else{
                this.setDate("_a" , time.parse_time(valsplit[0]));
                this._b = null;
            }
        }
}

when.prototype.is_immediate = function(){
    return this._a === time.TIME_NOW;
}
when.prototype.is_forever = function(){
    return this._a === time.TIME_FUTURE;
}
when.prototype.is_past = function(){
   return ((this._a === time.TIME_PAST) && (this._b === time.TIME_NOW));
}
when.prototype.is_future = function(){
   return ((this._a === time.TIME_NOW) && (this._b === time.TIME_FUTURE));
}
when.prototype.is_infinite = function(){
   return ((this._a === time.TIME_PAST) && (this._b === time.TIME_FUTURE));
}
//>Return True if this scope defines a definite time 
//>or a definite time interval.
when.prototype.is_definite = function(){
    if (!this._b)
        return _.isNumber(this._d);
    else
        return ((this._a instanceof Date) && (this._b instanceof Date));
}
//
//> Return True if this temporal scope refers to a
//> singleton measurement. Used in scheduling an enclosing
//> Specification; has no meaning for Capabilities 
//> or Results.
when.prototype.is_singleton = function(){
    return (this._a && !this._b && !this._d);
}

//##_datetimes
//> Based on current state of when, return a Json with start and end (as Date obj)
when.prototype._datetimes = function(tzero){
    var start=null,end=null;
    if (!tzero)
        tzero = new Date();
    else    
        (_.isDate(tzero))?tzero=tzero:tzero = new Date(tzero);
    switch(this._a){
        case time.TIME_NOW:
            start = tzero;
            break;
        case time.TIME_PAST:
            start = null;
            break;
        default:
            start = this._a;
    }
    switch (this._b){
        case (time.TIME_FUTURE):
            end = null;
            break;
        case (null):
            if (this._d){
                end = new Date((start.getTime() + this._d*1000));//_d is in seonds, getTime in millisec
            }
            else
                end = start;
            break;
        default:
            end = this._b;
    }
    return { "start":start , 
             "end" : end};
}

//##duration
//>Return the duration in seconds of this temporal scope.
when.prototype.duration = function(tzero){
    if (this._d)
        return this._d;
    if (this._b === time.TIME_FUTURE)
            return null;
    if (!this._b)
        return 0;
    else{
        var se = this._datetimes(tzero);
       //return (se[1].getTime() - se[0].getTime());
       return (se.end.getTime() - se.start.getTime());
    }
}

//##timer_delays
// Returns a tuple with delays for timers to signal the start and end of
//  a temporal scope, given a specified time zero, which defaults to the
//  current system time. 
//
// The start delay is defined to be zero if the scheduled start time has
// already passed or the temporal scope is immediate (i.e., starts now).
// The start delay is None if the temporal scope has expired (that is,
// the current time is after the calculated end time)
//
// The end delay is defined to be None if the temporal scope has already
// expired, or if the temporal scope has no scheduled end (is infinite or
// a singleton). End delays are calculated to give priority to duration 
// when a temporal scope is expressed in terms of duration, and to 
//  prioritize end time otherwise.
// 
//  Used in scheduling an enclosing Specification for execution. 
//  Has no meaning for Capabilities or Results.
when.prototype.timer_delays = function(tzero){
    var se=null,sd=null,ed=null;
    if (!tzero) 
        tzero = new Date();

    var se = this._datetimes(tzero);

    sd = time.total_seconds(se.start - tzero);
    if (sd < 0)
        sd = 0;

    if (this._b && (!time.time_future(this._b))){
        ed = time.total_seconds(se.end - tzero);
    }else{
        if (this._d){
            ed = (sd + time.total_seconds(this._d)*1000); // everything in millisec
        }
    }
    //detect expired temporal scope
    if (ed && ed<0){
        sd = null;
        ed = null;
    }
    
    return {
        sd: sd/1000,
        ed: ed/1000
    };
}


when.prototype.period = function(){
    return this._p;
}

//## in_scope
//>Return True if time t falls within this scope.
when.prototype.in_scope = function(t, tzero){
        return ((this.sort_scope(t, tzero) == 0));
}

//#sort_scope
//> Return < 0 if time t falls before this scope,
//> 0 if time t falls within the scope, 
//> or > 0 if time t falls after this scope. 
when.prototype.sort_scope = function(t, tzero){
    if (t === time.TIME_NOW){
        if ((this._a === time.TIME_NOW) || (this._b === time.TIME_NOW))
            return 0;
        else{
            if (!tzero)
                tzero = new Date();
             t = tzero;
        }   
    }

    var se = this._datetimes(tzero);
    if (se.start && (t < se.start))
        return time.total_seconds(t - se.start);
    else{
        if (se.end && (t > se.end))
            return time.total_seconds(t - se.end);
        else
            return 0;
    } 
}

//##follows
//>Return True if this scope follows (is contained by) another.
when.prototype.follows = function(s,tzero){
    if ((s.in_scope(this._a, tzero)) || (s.in_scope(this._b, tzero)))
        return true;
    return false
}       

var when_infinite = new when(null , time.TIME_PAST, time.TIME_FUTURE);

//////////////////////////////////////////////////////////////////////////////////////////////
//#schedule class
//> Defines a schedule for repeated operations based on crontab-like
//> sets of months, days, days of weeks, hours, minutes, and seconds.
//> Used to specify repetitions of single measurements in a Specification.
//> It is a wrap-aroud of node cron library (https://github.com/ncb000gt/node-cron)

var Scheduler = function(){
    // CHECKME: verificare cosa fare e come per eliminare dal array i job scaduti
    // FIXME: una soluzione potrebbe essere definire onComplete (in addJob) come la composizione della funzione utente e di pop del job finito
    this.jobs = []; // Array of all scheduled jobs
}

//##addJob
//> Schedules a new job
//> --- params
//>          cronTime: [REQUIRED] - The time to fire off your job. This can be in the form of cron syntax or a JS Date object.
//>          onTick: [REQUIRED] - The function to fire at the specified time.
//>          onComplete:  [OPTIONAL] - A function that will fire when the job is complete, when it is stopped.
Scheduler.prototype.addJob = function(cronTime, onTick, onComplete){
    var job = new CronJob(cronTime, onTick, onComplete,true);
    this.jobs.push(job);
}


//////////////////////////////////////////////////////////////////////////////////////////////
//#Primitive Types
//>Represents a primitive mPlane data type. Primitive types define
//>    textual and native representations for data elements, and convert
//>   between the two.

//>    In general, client code will not need to interact with Primitives;
//>    conversion between strings and values is handled automatically by
//>    the Statement and Notification classes.
//> Here we have a single class with a type and single functions that behave differently for dirent primitives
//> (More procedural, less object oriented)
//////////////////////////////////////////////////////////////////////////////////////////////
//##constructor
var Primitive = function(type){
    this.setType(type);
}

// **The primitive type is the key of each type**
// If some specific constrains function os defined, it overloads the default one
var PRIMITIVES = {
    "UNDEF":{
        label: "undef",
        isValid: function(value){return true;},
        unParse: function(value){ return value; },
        parse: function(value){return value}
    },
    "STRING":{
        label: "string",
        isValid: function(value){ return _.isString(value); },
        unParse: function(value){ return value; },
        parse: function(value){return value},
        constraints : {
            "range" : {
                met_by : function(value){
                    return ((this._param.valA <= value) && (this._param.valB >= value));
                }
            },
            "list" : {
                met_by : function(value){
                    return (_.contains(this._param, value));
                }
            }
        }
    },
    "BOOL":{
        label: "bool",
        isValid: function(value){return _.isBoolean(value);},
        unParse: function(value){
            if (value)
                return 'true';
            return 'false';
        },
        parse: function(value){
            if (value.toLowerCase() === "true")
                return true;
            return false;
        }
    },
    "NATURAL":{
        label: "natural",
        isValid: function(value){return utility.isInt(value);},
        unParse: function(value){return value.toString();},
        parse: function(value){return parseInt(value);},
        constraints : {
            "range" : {
                met_by : function(value){
                    return ((parseInt(value) >= parseInt(this._param.valA)) && (parseInt(value) <= parseInt(this._param.valB)));
                }
            },
            "list" : {
                met_by : function(value){
                    return (_.contains(this._param, value));
                }
            },
            "singleton" : {
                met_by : function(value){
                    return (value === this._param);
                }
            }
        }
    },
    "REAL":{
        label: "real",
        isValid: function(value){return utility.isReal(value); },
        unParse: function(value){return value.toString();   },
        parse: function(value){return parseFloat(value); }
    },
    "IP":{
        label: "ip",
        isValid: function(value){return (/^(\d{1,3}\.){3,3}\d{1,3}$/.test(value))},
        unParse: function(value){ return value; },
        parse: function(value){return value},
        constraints : {
            "range" : {
                met_by : function(value){
                    return ((utility.compareIP(this._param.valA , value) >= 0) && (utility.compareIP(this._param.valB , value) <= 0));
                }
            },
            "list" : {
                met_by : function(value){
                    return (_.contains(this._param, value));
                }
            },
            "singleton" : {
                met_by : function(value){
                    return (value === this._param);
                }
            }
        }
    },
    "IP6":{
        label: "ip6",
        isValid: function(value){return (/^[A-Fa-f0-9:]+$/.test(value)) },
        unParse: function(value){return value;},
        parse: function(value){return value}
    },
    "URL":{
        label: "url",
        isValid: function(value){return url.parse(value); },
        unParse: function(value){ return value; },
        parse: function(value){return value}
    },
    "TIME":{
        label: "time",
        isValid: function(value){return ((!_.isNaN(Date.parse(value))) || ( (value == time.TIME_PAST ) || (value == time.TIME_NOW ) || (value == time.TIME_FUTURE ) )); },
        unParse: function(value){ return time.parse_time(value);},
        parse: function(value){return time.parse_time(value); }
    }

}

//# We expose these const in order to simplify coding
// They can be used to refere to a specific primitive, instead of usgin the internal string
var pk = _.keys(PRIMITIVES);

Primitive.UNDEF = pk[0];
Primitive.STRING = pk[1];
Primitive.BOOL = pk[2];
Primitive.NATURAL = pk[3];
Primitive.REAL = pk[4];
Primitive.IP = pk[5];
Primitive.IP6 = pk[6];
Primitive.URL = pk[7];
Primitive.TIME = pk[8];

Primitive.VALUE_NONE = "*";

Primitive.prototype.setType = function(type){
    // Do we know about this type?
   if ((!type) || !(PRIMITIVES[type]))
        this.type = this.UNDEF;
    else
        this.type = type; // the type of primitive the instance is.
}

//##knownPrimitive
//is prim a kwnown primitive?
Primitive.knownPrimitive = function(prim){
    return (_.indexOf(pk, prim.toUpperCase()) != -1);
}

//##parse
//>Convert a string to a value; default implementation
//>        returns the string directly, returning None for the
//>        special string "*", which represents "all values" in 
//>        mPlane.
Primitive.prototype.parse = function(sval){
    if (sval === Primitive.VALUE_NONE)
        return Primitive.VALUE_NONE;
     if ((this.type != Primitive.BOOL ) && (!sval)){
        return null;
    }
    return (PRIMITIVES[this.type].parse(sval)) ;
}

//##unparse
//>Convert a value tp a string; 
//> IP address manipulation freely inspired by https://github.com/indutny/node-ip/blob/master/lib/ip.js
Primitive.prototype.unparse = function(val){
    if ((this.type != Primitive.BOOL ) && (!val)){
        return null;
    }
    return (PRIMITIVES[this.type].unParse(val)) ;
}

//##isValid 
// This is not in the reference implementation
// Checks if a value is valid for this type of primitive or not
// Call the primitive isValid defined in the PRIMITIVES obj
Primitive.prototype.isValid = function(val){
    if ((this.type != Primitive.BOOL ) && (!val)){
        return null;
    }
    return (PRIMITIVES[this.type].isValid(val)) ;
}


//#Element
//>    An Element represents a name for a particular type of data with 
//>    a specific semantic meaning; it is analogous to an IPFIX Information 
//>    Element, or a named column in a relational database.
//>
//>    An Element has a Name by which it can be compared to other Elements,
//>    and a primitive type, which it uses to convert values to and from
//>    strings.
//>
//>    The mPlane reference implementation includes a default registry of
//>    elements; use initialize_registry() to use these.
//> An element can be create directly from a definition of the registry, passing the name of the registry element or from a json config
var Element = function(config){
    // This json contains the constraints defined for a specific instance
    // Each constraint is identified by a unique id (the key in the json details)
    // so that we can remove/change. The uniqueID is a simple incremental,
    // so the __uniqueID__ is used internally as the "next unique id", while the constrains details are in the details json,
    // with the uniqueID as key
    this._constrains = { __uniqueID__ : 0,
        details : {}};

    // If config is not defined, set default Values
    if (!config || _.isUndefined(config)){
        config = {};
    }

    // Should we load from dict or directly from config obj?
    if (_.isObject(config) && (!config.type)){
        this._name = config.name || config._name || "Undef";
        var prim = config.prim || config._prim;
        (prim)?this._prim = prim.toUpperCase():this._prim = Primitive.UNDEF;
        this._desc = config.desc || config._desc ||"";

        // Constraints can be alreay a json or a string
        var contrs = config.constrains || config._constrains || { __uniqueID__ : 0,
            details : {}, type: Constraints.UNDEF};
        this.addConstraint(contrs);

        //this._registryOID = config._registryOID || config.registryOID || null;
    }else{ // the config is a string or has the type field
        var name = "Undef";
        var oid = "Undef";
        var el = null;
        var prim = null;
        var constr = null;
        if (config.type){
            // Load from registry
            el = Element.getFromName(config.type);
            oid = config.type;
            name = config.name || config._name || config.type || "Undef";
            prim = el.prim.toUpperCase() || el._prim.toUpperCase() || Primitive.UNDEF;
            constr = config.constraints;
        }else{
            //Create the element from the registry
            if (!_.isString(config)){
                throw new Error("mPlane Element : to create an Element from registry please provide a valid string:"+config);
            }
            var el = Element.getFromName(config);
            name = el.name || el._name || "Undef";
            oid = config;
            prim = el.prim.toUpperCase() || el._prim.toUpperCase() || Primitive.UNDEF;
            // In this form we cannot have constraints directly in the config
            constr = { __uniqueID__ : 0,
                details : {}};
        }// config is a string

        this._name = name;
        this._prim = prim;
        this._desc = el.desc || el._desc || "";

        // Constraints can be alreay a json or a string
        if (_.isString(constr))
            this._constrains = Constraints.parse_constraint(this._prim , constr);
        else
            this._constrains = constr;
    }
}

// Array containing the known elements
_element_registry = {};


// Initialize the registry from a json file
// It is a static method, so it could be called without instantiate an element
Element.initialize_registry = function(filename){
    var fn = filename || __DEFAULT_REGISTRY_FILE,
        registry = "";
    try {
        registry = fs.readFileSync(fn);
        _element_registry = JSON.parse(registry);
    }
    catch (err) {
        console.log('There has been an error parsing the registry file.( '+fn+')');
        console.log(err);
    }
}

Element.prototype.getName = function(){
    return this._name;
}

Element.prototype.getDescription = function(){
    return this._desc;
}

// Return an element entry from the registry from the name
// Static method, so it could be called without instantiate an element
Element.getFromName = function(name){
    var names = name.split(".");
    var ret = _element_registry;
    for (el in names){
        if (ret[names[el]])
            ret = ret[names[el]];
        else    
            throw new Error("mPlane Element : Undefined element in registry:"+name);
    }
    return ret;
};

//## parse
//>Convert a string to a value for this Element; delegates to primitive.
Element.prototype.parse = function(sval){
    this._prim.parse(sval);
}
//## unparse
//>Convert a value to a string for this Element; delegates to primitive.
Element.prototype.unparse = function(val){
    this._prim.unparse(val);
}
//##compatible_with
//>     Determine based on naming rules if this element is compatible with
//>     element rval; that is, if transformation_to will return a function
//>     for turning a value of this element to the other. Compatibility based
//>     on name structure is a future feature; this method currently checks for
//>     name equality only.
Element.prototype.compatible_with = function(rval){
    return this._name == rval;
}
//##transformation_to
//>     Returns a function which will transform values of this element
//>     into values of element rval; used to support unit conversions.
//>     This is a future feature, and is currently a no-op. 
//>     Only valid if compatible_with returns True.
Element.prototype.transformation_to = function(rval){
    return function(rval){ return rval };
}

//#CONSTRAINTS
// In this  implementation, constraints are part of the Element class
// A constraint is a JSON obj with a type and optional/required parameters (depending on the type of contraint)
// The consequence is that we use a procedural approach instead of a pure obj oriented one

//##contraints obj
//Depends by the primitive and the type of constraints (es: integer range)
var Constraints = function(config){
    this.met_by = function(val){return true;}
    this.single_value = function(){return false;}

    this._prim = config.prim || config._prim ||  Constraints.UNDEF;
    this._name = config.name || config._name || "Constraint";
    this._type = config.type || config._type || null;
    this._param = config.param || config._param;

    // Do we have specific functions for this primitive and this type of constrain?
    if (PRIMITIVES[this._prim].constraints && PRIMITIVES[this._prim].constraints[this._type]){
        if (PRIMITIVES[this._prim].constraints[this._type].met_by){
            this.met_by = PRIMITIVES[this._prim].constraints[this._type].met_by;
        }
        if (PRIMITIVES[this._prim].constraints[this._type].single_value)
            this.single_value = PRIMITIVES[this._prim][this._type].constraints.single_value;
    }
}

Constraints.UNDEF = null;
Constraints.SINGLETON = "singleton";
Constraints.RANGE = "range";
Constraints.LIST = "list"; // List of acceptable values

//Matches all constraints
Constraints.CONSTRAINT_ALL = "*"


//##parse_constraint
//>Given a primitive and a string value, parse a constraint 
//>    string into an instance of an 
//>    appropriate Constraint class.
Constraints.parse_constraint = function(prim , sval){
    if (_.isUndefined(prim) || _.isUndefined(sval))
        throw new Error("mPlane Constraints: Missing parameter in parse_constraints");
    var ret = null; // If no case applies, return an UNDEF constraints
    if (sval === Constraints.CONSTRAINT_ALL){
        options = {
            type: Constraints.CONSTRAINT_ALL,
            prim: prim || Primitive.UNDEF,
            name: "",
            param: {valA: Constraints.CONSTRAINT_ALL,
                valB: Constraints.CONSTRAINT_ALL}
        }
        ret = new Constraints(options);
    }


    // If the string contains a RANGE_SEP, it should be a range constraint
    else if (sval.indexOf(RANGE_SEP) > 0){
        var sp = sval.split(RANGE_SEP);
        options = {
            type: Constraints.RANGE,
            prim: prim || Primitive.UNDEF,
            name: "",
            param: {valA: sp[0],
                    valB: sp[1]}
        }
        ret =  new Constraints(options);
    }
    // If the string contains a RANGE_SEP, it should be a list constraint
    else if (sval.indexOf(SET_SEP) > 0){
        var values = sval.split(SET_SEP);
        options = {
            type: Constraints.LIST,
            prim: prim || Primitive.UNDEF,
            name: "",
            param: values
        }
        ret = new Constraints(options);
    }
    // Single value
    else {
         options = {
            type: Constraints.SINGLETON,
            prim: prim || Primitive.UNDEF,
            name: "",
            param: sval
        }
        ret = new Constraints(options);
    }
    return ret || new Constraints();
}

Constraints.unParse_constraint = function(constraint){
    switch (constraint._type){
        case "range":
            return (constraint._param.valA + " ... "+constraint._param.valB);
            break;
        case "list":
            return constraint._param.toString();
            break;
        case "singleton":
            return constraint._param.toString();
            break;
        case Constraints.CONSTRAINT_ALL:
            return constraint.CONSTRAINT_ALL;
            break;
        default:
            return constraint._param.toString();
    }
}

Constraints.prototype.getType = function(){
    return this._type;
}
//##getValA
// Only for range type
Constraints.prototype.getValA = function(){
    if (this.getType() == Constraints.RANGE)
        return this._param.valA;
    else
        return undefined;
}
//##getValB
// Only for range type
Constraints.prototype.getValB = function(){
    if (this.getType() == Constraints.RANGE)
        return this._param.valB;
    else
        return undefined;
}

//##getParam
Constraints.prototype.getParam = function(){
    return this._param;
}

//#addConstrain
//>Add a constraint to the Element. The constraint can be a json with a type and a number of 
//>optional/required parameters (depending on the type of contraint) or a string valid to be parsed by parse_constraint
// The prim of constraints is taken from the prim of the element
// The config is of type {type:<constraint type>, params:{<constraint params>}}
// Return the constrain internal id so that it ca be referred programmatically
Element.prototype.addConstraint = function(config){
    var self = this , cons;
    if (!_.isObject(config)){
        cons = Constraints.parse_constraint(self._prim , config);
        // Is the prim compatible with ours?
        if (cons._prim !== self._prim)
            throw new Error("mPlane Element: Error adding constraints. The contraints type is incompatible with element type");
    }else{
        if ((_.isUndefined(config.type)) && (_.isUndefined(config._type))){
            throw new Error('mPlane Constrain: missing param');
        }
        var params = config.constraintOptions || {};
        var options = {
            type: config.type || config._type,
            prim: self._prim.toUpperCase() || self.prim.toUpperCase(),
            name: config.name || config._name,
            param: config.param || config._param
        }
        cons = new Constraints(options);
    }
    // ADD
    this._constrains.details[this._constrains.__uniqueID__] = cons;
    var ret = this._constrains.__uniqueID__;
    this._constrains.__uniqueID__ += 1; // Next unique ID 
    return ret; // The internal ID
}

//##_clear_constraints
// Clear the constraint identified by constraintsId or all constraints associated to the Element, if any
Element.prototype._clear_constraints = function(constraintId){
    if (!_.isUndefined(constraintId))
        delete this._constrains.details[constraintId];
    else{
         this._constrains.details = {};
         this._constrains.__uniqueID__ = 0;
    }
}

// ##setConstraintsName
// set the name of a specific constraint. Name uniqueness is not granted
// Usefull if I want to refer to a constraints by name
Element.prototype.setConstraintsName = function(constraintsId , name){
   this._constrains.details[constraintsId]._name = name || 'Constraint';
}

// Return a specific constraints set in element
// If constraintsId is undefined or null, return all the constraints
Element.prototype.getConstraints = function(constraintsId){
    if (_.isUndefined(constraintsId))
        return this._constrains.details;
    else
        return this._constrains.details[constraintsId];
}

//## met_by
// checks is a value (of any type) matches a constraint set in Element
// If constraintsId is not defined or null, checks ALL the constraints
// It is a usefull shortcut to the constraints met_by function
Element.prototype.met_by = function(value , constraintsId){
    if (_.isUndefined(constraintsId)){
        var ret = true;
        for (constr in this._constrains.details){
            ret = ret && (new Constraints(this._constrains.details[constr]).met_by(value));
            // It will never become true :>)
            if (!ret)
                  return ret;
        }
        return ret;
    }
    else{
        return((new Constraints(this._constrains.details[constraintsId]).met_by(value)));
    }
}

//##isValid
// Shortcut to Element primitive isValid method
Element.prototype.isValid = function(value){
    return PRIMITIVES[this._prim].isValid(value);
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
// # Parameter
//  A Parameter is an element which can take a constraint and a value. 
//    In Capabilities, Parameters have constraints and no value; in
//    Specifications and Results, Parameters have both constraints and
//    values.
// The creation of a parameter can be done directly through an Element instance, with the element name from the registry or with an instance of parameter
//
var Parameter = function(config){
    if (!config)
        config = {};
    Element.apply( this, arguments ); // Call the Statement (super) constructor
    this.setValue(config.value || config._value);

    return this;
}
util.inherits(Parameter, Element);

Parameter.prototype.kind_str = function(){
    return KIND_PARAMETER;
}

Parameter.prototype.hasValue = function(){
    return (!(_.isNull(this._value) || _.isUndefined(this._value)));
}
//##setValue
// Set a specific value to a parameter.
// If the value does not meet the isValid func defined for the PAramter primitive and the defined constraints, throws an error
Parameter.prototype.setValue = function(val){
    // We can also have undefined values
    if (_.isUndefined(val)){
        this._value = val;
        return this;
    }
    // If defined should be a valid value
    if ((this.isValid(val)) && (this.met_by(val)))
        this._value = val;
    else
        throw new Error("mPlane Parameter: Value is not valid for this parameter");
    return this;
}
Parameter.prototype.getValue = function(){
    return this._value;
}

Parameter.prototype._clear_constraints = function(constraintId){
    //this._element._clear_constraints(constraintId);
    this._clear_constraints(constraintId);
}


//# Metavalue
//>A Metavalue is an element which can take an unconstrained value.
//>    Metavalues are used in statement metadata sections.
// ***Just do not set Constraints :>)***
var Metavalue = Parameter;

//##ResultColumn
//>A ResultColumn is an element which can take a collection of values (key:value). 
//>    In Capabilities and Specifications, this collection is empty, while in
//>    Results it has one or more values, such that all the ResultColumns
//>    in the Result have the same number of values.
var ResultColumn = function(el , value){
    Element.apply( this, arguments ); // Call the Statement (super) contructor
    this._vals = {};
    this.setValue(value);
}

util.inherits(ResultColumn, Element);

//##setValue
// Set a specific value to a ResultColumn.
// val MUST be a collection in the form {key:value,...}
// If one of the values does not meet the isValid func defined for the Element primitive and the defined constraints, throws an error
ResultColumn.prototype.setValue = function(val){
    if (!val || _.isUndefined(val))
        val = {};
    if (_.isObject(val)){
        for (el in val){
            //if ((this._element.isValid(val[el])) && (this._element.met_by(val[el])))
            if ((this.isValid(val[el])) && (this.met_by(val[el])))
                this._vals[el] = val[el];
             else{
                    throw new Error("mPlane ResultColumn: Value is not valid for this parameter");
             }
        }
    }else
        throw new Error("mPlane ResultColumn: You should provide a json to ResultColumn.prototype.setValue");
};

ResultColumn.prototype.__setitem__ == ResultColumn.prototype.setValue;

ResultColumn.prototype.delValue = function(key){
    if (this._vals[key])
        delete this._vals[key];
}
ResultColumn.prototype.__delitem__ == ResultColumn.prototype.delValue;

ResultColumn.prototype.clear = function(){
    this._vals = {};
}

ResultColumn.prototype.getValue = function(key){
    if (_.isUndefined(key)){
        return this._vals;
    }
    else
        return this._vals[key];
}


//#Statement
//A Statement is an assertion about the properties of a measurement
//    or other action performed by an mPlane component. This class 
//    contains common implementation for the three kinds of mPlane
//    statement. Implementations should use the
//    mplane.Capability, mplane.Specification, mplane.Result
// Configuration can be taken from a dictionary, or with configuration paramenters
var Statement = function(config){
    if (!config)
        config = {};
    if (config.dictval)
        config = this._from_dict(config.dictval);
    // If we are importing from dict the names are the same as internal (with leading _), otherwise it is simpler to have no trailing _
    this._params = config.params || config._params || {};
    this._metadata = config.metadata || config._metadata || {};
    this._link = config.link || config._link || null;
    this._verb = config.verb || config._verb || Statement.VERB_MEASURE;
    this._label = config.label || config._label || null;
    this._when = config.when || config._when || when_infinite;
    this._schedule = config.schedule || config._schedule || null; // completely ignored unless this is a specification
    this._resultvalues = config._resultvalues || config.resultvalues || {};
    this._token = config.token || config._token || this._default_token();
}

Statement.VERB_MEASURE = "measure";
Statement.VERB_QUERY = "query";
Statement.VERB_COLLECT = "collect";
Statement.VERB_STORE = "store";

Statement.prototype.get_verb = function(){
    return this._verb;
}

//###parameter
//##add_parameter
// Adds a parameter to the Statement, starting from a name, an element and value
// Constraints should be added to the element BEFORE adding to the Statement
Statement.prototype.add_parameter = function(config){
    // If no param name is provided, define a unique name from type
    if (!config.parameter_name || (config.parameter_name === "undefined"))
        config.parameter_name = config.type; // The name is taken as the type, that is mandatory!
    this._params[config.parameter_name] = new Parameter(config);
    return this; //chaining
}

Statement.prototype.has_parameter = function(parameter_name){
    return(_.contains(_.keys(this._params),parameter_name));
}

Statement.prototype.parameter_names = function(){
    return _.keys(this._params);
}

Statement.prototype.count_parameters = function(){
    return (_.keys(this._params)).length;
}

Statement.prototype.get_parameter_value = function(param_name){
    return (new Parameter(this._params[param_name]).getValue());
}

Statement.prototype.get_parameter_constraints = function(param_name){
    if (this.has_parameter(param_name))
        return (this._params[param_name]._constrains);
    else
        return null;
}

Statement.prototype.set_parameter_value = function(param_name , value){
    if (this._params[param_name])
        this._params[param_name].setValue(value);
}

Statement.prototype.del_parameter = function(param_name){
    if (this._params[param_name])
        delete this._params[param_name];
}
//##getParameter
//> returns an instance of the parameter stored as param_name
Statement.prototype.getParameter = function(param_name){
    if (this._params[param_name]){
        var par = new Parameter(this._params[param_name]);
        if (par)
            return par;
    }

    return null;
}

//##getAllParameters
//> returns an array with an instance of the each parameter stored in this statement
Statement.prototype.getAllParameters = function(){
    var ret = [],
        self = this;
    _.forEach(_.keys(this._params), function(param_name){
        ret.push(new Parameter(self._params[param_name])) ;
    });
    return ret;
}

//##getParameterNames
//> returns an array containing all the names of the parameters of this Statement
Statement.prototype.getParameterNames = function(){
    return _.keys(this._params);
}

//###metadata
//>MetaData are not structured so you can store any type of information and objects in metatdata
Statement.prototype.add_metadata = function(meta_name , value){
        this._metadata[meta_name] = value || "";
}

Statement.prototype.has_metadata = function(meta_name ){
     return(_.contains(_.keys(this._metadata),meta_name));
}

Statement.prototype.get_metadata_value = function(meta_name){
      return(this._metadata[meta_name]);
}

Statement.prototype.metadata_names = function(){
    return _.keys(this._metadata);
}

Statement.prototype.count_metadata = function(){
    return _.keys(this._metadata).length;
}

Statement.prototype.set_metadata_value = function(meta_name , value){
    this._metadata[meta_name] = value;
    return this; // Chaining
}


/*
 Utility function to obtain set resultColumns
 */
Statement.prototype.result_column_names = function(){
    var self = this;
    return _.keys(self._resultvalues);
}

//###result_column in Statement
//>Programatically add a result column to this Statement.
//Statement.prototype.add_result_column = function(elem_name , element){
Statement.prototype.add_result_column = function( column_name ){
    this._resultvalues[column_name]=[];
    return this; //chaining
}
//###Here we set a result in a result_column
//>Programatically ADD a value to a StatementColumn.
Statement.prototype.set_result_column_value = function(result_column , value){
    if (!result_column || (result_column === undefined))
        return;
    if (!(result_column in this._resultvalues))
        this._resultvalues[result_column] = [];
    this._resultvalues[result_column].push(value);
}
Statement.prototype.get_result_column_values = function(result_column ){
    return this._resultvalues[result_column];
}


// Number of result rows in a specific resultColumn
Statement.prototype.count_result_rows = function(result_column){
    return(this._resultvalues[result_column].length)
}

Statement.prototype.result_column_names = function(){
    var self = this;
    return _.keys(self._resultvalues);
}

Statement.prototype.count_result_columns = function(rc_name , value){
    return this.result_column_names().length;
}

Statement.prototype.has_result_columns = function(result_column){
    return(_.contains(this.result_column_names(),result_column));
}

//###link
//> A link specifies where the next message in the workflow should be sent to or retrieved from.
Statement.prototype.get_link = function(){
    return this._link;
}

Statement.prototype.set_link = function(link){
    this._link = link;
}

//###label
Statement.prototype.get_label = function(){
    return this._label;
}

Statement.prototype.set_label = function(label){
    this._label = label;
}

//###when
//>Statement temporal scope
Statement.prototype.get_when = function(){
    return this._when;
}
// Usefull when you need to print when as a string
Statement.prototype.whenToString = function(){
    return (new when(this._when.__string__)).toString();
}

//###set_when
//>Set the statement's temporal scope. Ensures that the temporal scope is
// We can pass a When instance or directly a valid string for a when initialization
Statement.prototype.set_when = function(wh){
    var w = null;
    if (wh instanceof when)
        w = wh;
    else{
        try{
            w = new when(wh);
        }catch(e){
            console.log("*** Error in set the when instance ***");
            // If there an error in the parameter, set to now
            w = new when(when.NOW);
        }
    }
    this._when = w;
    return this; // Chaining
}

// ##_schema_hash
// Return a hex string uniquely identifying the set of parameters
// and result columns (the schema) of this statement.
Statement.prototype._schema_hash = function(){
    return sha1("p " + " " + _.reduce(_.sortBy(this.parameter_names()) , function(concat, param){return(concat+param)})+ " r " + " " + _.reduce(_.sortBy(this.result_column_names()) , function(concat, rc){return(concat+rc)} ));
}

//##_pv_hash
// Return a hex string uniquely identifying the set of parameters,
// temporal scope, parameter values, and result columns 
// of this statement. Used as a specification key.
Statement.prototype._pv_hash = function(){
        var spk = _.sortBy(_.keys(this._params)),
            spv = [];
        for (k in spk){
            spv.push(this.get_parameter_value(spk[k]));
        }
        tstr = this._verb + " w " + JSON.stringify(this._when) + 
               " pk " + " " + _.reduce(spk , function(concat, param){return(concat+param)}) + 
               " pv " + " " +  _.reduce(spv , function(concat, param){return(concat+param)}) + 
               " r " + " " + _.reduce(_.sortBy(this.result_column_names()) , function(concat, param){return(concat+param)} );
        return sha1(tstr);
}

//##_mpcv_hash
//Return a hex string uniquely identifying the set of parameters,
//temporal scope, parameter constraints, parameter values, metadata, metadata values, 
//and result columns (the extended specification) of this statement.
//Used as a complete token for statements.
Statement.prototype._mpcv_hash = function(){
     var self = this
            ,spk = _.sortBy(this.parameter_names()),
            spv = [],
            spc = [],
            smk = _.sortBy(this.metadata_names()),
            smv = [];

        // Parameters
        for (k in spk){
            spv.push(this.get_parameter_value(spk[k]));
            spc.push(JSON.stringify(this._params[spk[k]]._constrains));
        }
        // Metadata
        for (k in smk){
            smv.push(this.get_metadata_value(smk[k]));
        }
        var tstr = this._verb + " w " + JSON.stringify(this._when) +
            " pk " + " " + spk.join("_") +
            " pc " + " " + spc.join("_") +
            " pv " + " " + spv.join("_") +
        " mk " + " " + smk.join("_") + " mv " + " " + smv.join("_")+
        " r " + " " + _.sortBy(this.result_column_names()).join("_");

        /*var tstr = this._verb + " w " + JSON.stringify(this._when) +
               " pk " + " " + _.reduce(spk , function(concat, param){return(concat+"_"+param)}) +
               " pc " + " " + _.reduce(spc , function(concat, param){return(concat+"_"+param)}) + " pv " + " " +
                _.reduce(spv , function(concat, param){return(concat+"_"+param)})
               " mk " + " " + _.reduce(smk , function(concat, param){return(concat+"_"+param)}) + " mv " + " " +
                _.reduce(smv , function(concat, param){return(concat+"_"+param)})
               " r " + " " + _.reduce(_.sortBy(this.result_column_names()) , function(concat, param){return(concat+"_"+param)} );
         */
        return sha1(tstr);
}

Statement.prototype.update_token = function(){
    this._token = this._default_token();
    return this._token;
}

Statement.prototype._default_token = function(){
      return this._mpcv_hash();
}

//##set_token
// To be used very wisely!
Statement.prototype.set_token = function(token){
    this._token = token;
    return this._token;
}

//##get_token
// Token getter
//@return string the token
Statement.prototype.get_token = function(){
    return this._token;
}
//##getToken
// Token getter - ALIAS
//@return string the token
Statement.prototype.getToken = function(){
    return this.get_token();
}

//##_result_rows
//Returns the result rows
Statement.prototype._result_rows = function(resultColumn){
    if (_.isUndefined(resultColumn))
        throw new Error("mPlane Statement: resultColumn should be a valid column in _result_rows");
    var rows = [],
        rck = _.keys(this.get_result_column_value(resultColumn));
    
        for (var i = 0 ; i< this.count_result_rows(resultColumn) ; i++){
            rows.push(this._resultcolumns[resultColumn]._vals[rck[i]]);
        }
    return rows;
}

//##to_dict
//Convert a Statement to a dictionary (JSON FORMAT)
// --- Compatible with THE mPlane RI ---
Statement.prototype.to_dict = function(){
    var ret = {}
        ,self = this;
    // We have a property named after kind of Statement and value is the verb
    ret[this.kind_str()] = this._verb;

    if ("_label" in this)
        ret[KEY_LABEL] = this._label;
    if ("_metadata" in this)
        ret[KEY_METADATA] = this._metadata;
    if ("_link" in this)
        ret[KEY_LINK] = this._link || "";
    if ("_token" in this)
        ret[KEY_TOKEN] = this._token;
    if ("_when" in this){
        ret[KEY_WHEN] = this._when.__string__; // Just put the String, not all the internal rapresentation
    }
    // Internally resultColumns and resultvalues are stored in a single structure

    //_resultvalues: { 'delay.twoway': [], 'hops.ip': [] },
    if ("_resultvalues" in this){
        ret.resultvalues = [];
        ret.results = [];
        // result name is the column
        for (result in self._resultvalues){
            // Push the name of the result in the result feature
            ret.results.push(result);
            // We can have multiple values for each result, so multiple rows
            for (row = 0; row < (self._resultvalues[result]).length; row++){
                // Create the row array if does not exist
                if (!ret.resultvalues[row])
                    ret.resultvalues[row] = [];
                ret.resultvalues[row].push(self._resultvalues[result][row]);
            }
        };
    }
    if (!(KEY_PARAMETERS in self))
        ret[KEY_PARAMETERS] = {};
    _.forEach(self.parameter_names() , function(param){
         var val = "*";
        // If value is defined use it, or put the constraints
        if (self.has_parameter(param) && ( self.get_parameter_value(param) !== undefined))
            val = self.get_parameter_value(param);
        else
           val = Constraints.unParse_constraint(self.get_parameter_constraints(param));
        ret[KEY_PARAMETERS][param] = val;
    });
    return JSON.stringify(ret);
}


//#validate
// Checks that all the parameters have values set
Statement.prototype.validate = function(){
    var pn = this.parameter_names();
    for (var i=0 ; i< this.count_parameters() ; i++){
        if (!this._params[pn[i]].hasValue())
            return false
    }
    return true;
}

Statement.prototype._clear_constraints = function(){
    var pn = this.parameter_names();
    for (var i=0 ; i< this.count_parameters() ; i++){
        if (!this._params[pn[i]]._clear_constraints())
            return false
    }       
}

//-------------------------------------------------------------------------------------------------
//                                  CAPABILITY
//-------------------------------------------------------------------------------------------------
//#Capability
//    A Capability represents something an mPlane component can do.
//    Capabilities contain verbs (strings identifying the thing the
//    component can do), parameters (which must be given by a client
//    in a Specification in order for the component to do that thing),
//    metadata (additional information about the process used to do
//    that thing), and result columns (the data that thing will return).
//
//    Capabilities can either be created programatically, using the
//    add_parameter(), add_metadata(), and add_result_column()
//    methods, or by reading from a JSON or YAML object [FIXME document
//    how this works once it's written]
// The capability can be created starting from a Statement obj of from a valid JSON to create the new statement 
var Capability = function(config){
    Statement.apply( this, arguments ); // Call the Statement (super) contructor
}
util.inherits(Capability, Statement);

Capability.prototype.kind_str = function(){
    return KIND_CAPABILITY;
}

//##fulfills
//verify that the schema hash is equal 
// CHECKME: not clear to me...
//Capability.prototype.fulfills = function(){
//    
////        if this._schema_hash() != Capability._schema_hash():
////            return False
//
//        // Verify that the specification is within the capability's temporal scope
//        if ! this._when.follows(capability.when()):
//            return False
//
//        # Works for me.
//        return True
//}


//#Specification
// A Specification represents a request for an mPlane component to do 
//    something it has advertised in a Capability.  
//    Capabilities contain verbs (strings identifying the thing the
//    component can do), parameters (which must be given by a client
//    in a Specification in order for the component to do that thing),
//    metadata (additional information about the process used to do
//    that thing), and result columns (the data that thing will return).
// > Can be created starting from a json config, a Capability, a Statement or another Specification
var Specification = function(config){
   Statement.apply( this, arguments ); // Call the Statement (super) contructor
    this._schedule = config.schedule || config._schedule || null;
    // Create a specification from a Capability
    if (config instanceof Capability || config instanceof Specification || config instanceof Statement){
        var cap = config; // Not sure of why this has been done...
        this._verb = cap._verb || Statement.VERB_MEASURE;
        this._label = cap._label ;
        this._metadata = cap._metadata ;
        this._params = _.clone(cap._params, true) ;
        this._resultcolumns = _.clone(cap._resultcolumns , true);
    }
    else{
        if (config.capability){
            // We can have a serialized version (with trailing ) or a programmatically config, easier without _
            this._verb = config.capability._verb || config.capability.verb || Statement.VERB_MEASURE;
            this._label = config.capability._label || config.capability.label || null;
            this._metadata = config.capability._metadata || config.capability.metadata || {};
            this._params = config.capability._params || config.capability.params || {};
            this._resultcolumns = config.capability._resultcolumns || config.capability.resultcolumns || [];
        }else{
            this._verb = config._verb || config.verb || Statement.VERB_MEASURE;
            this._label = config._label || config.label || null;
            this._metadata = config._metadata || config.metadata || {};
            this._params = config._params || config.params || {};
            this._resultcolumns = config._resultcolumns || config.resultcolumns || [];
        }
    }
    // FIXME: this should be tested!
    if (config.when || config._when)
        this._when = config.when || config._when;
    return this;// Chaining
}
util.inherits(Specification, Statement);

Specification.prototype.kind_str = function(){
     return KIND_SPECIFICATION;
}

Specification.prototype.setParameterValue =function(paramName , value){
    // We should use this trick since instantiating a new Param would not do the job
    this._params[paramName]._value = value;
}

Specification.prototype.getParameterValue =function(paramName){
    return this._params[paramName]._value;
}

Specification.prototype._default_token = function(){
      //return this._pv_hash();
      return this._mpcv_hash();
}

Specification.prototype.has_schedule = function(){
     return (!_.isNull(this._schedule));
}


//#Result
// > The internal structure has a _resultvalues that is an obj with a key for any column, which has an array of values
// > The resultvalues is initialized in Statement
var Result = function(config){
   Statement.apply( this, arguments ); // Call the Statement (super) contructor

     if (!config) {
            config = {};
     }
    // We can have a serialized version (with trailing ) or a programmatically config, easier without _
    this._verb = config._verb || config.verb || Statement.VERB_MEASURE;
    this._label = config._label || config.label || null;
    this._metadata = config._metadata || config.metadata || {};
    this._params = config._params || config.params || {};

    if (config.when || config._when)
        this._when = config.when || config._when;
     this.get_token();

    if (!this._resultvalues || (this._resultvalues === "undefined") )
        this._resultvalues = {};
    
    return this;// Chaining
}
util.inherits(Result, Statement);

Result.prototype.kind_str = function(){
    return KIND_RESULT;
}

Result.prototype.validate = function(){
    var pn = this.parameter_names();
    for (var i=0 ; i< this.count_parameters() ; i++){
        if (!this._params[pn[i]].hasValue()){
                return false
        }
    }
    if (! this._when.is_definite()){
                return false
        }
    return true;
}

//##set_result_value
// Set a value for a specific columnName
Result.prototype.set_result_value = function(columnName, val){
    // Just in case...
    if (!this._resultvalues[columnName])
        this._resultvalues[columnName] = [];
    this.set_result_column_value(columnName , val);
}

//##get_result_value
// Get a value for a specific resultColumn
Result.prototype.get_result_values = function(columnName){
       return  this._resulvalues[columnName];
}


//////////////////////////////////////////////////////////////////////////////////////////////
//
//  Notifications
//
//////////////////////////////////////////////////////////////////////////////////////////////

//#BareNotification
// Notifications are used to send additional information between
//    mPlane clients and components other than measurement statements.
//    Notifications can either be part of a normal measurement workflow
//    (as Receipts and Redemptions) or signal exceptional conditions
//    (as Withdrawals and Interrupts).
//
//    This class contains implementation common to all Notifications
//    which do not contain any information from a related Capability
//    or Specification.
var BareNotification = function(config){
    if (!config)
        config = {};
    this._token = config.token || null;
    
    return this; //Chainig
}

//#Exception
// A Component sends an Exception to a Client, or a Client to a 
//    Component, to present a human-readable message about a failure
//    or non-nominal condition 
var Exception = function(config){
    BareNotification.apply( this, arguments ); // Call the Statement (super) contructor
    if (!config)
        config = {};
    
    this._errmsg = config.errmsg || "Unspecified exception";
    
    return this; //Chainig
}
util.inherits(Exception, BareNotification);
   

Exception.prototype.get_token = function(){
    return this._token;
}


//#StatementNotification
// Common implementation superclass for notifications that 
//    may contain all or part of a related Capability or Specification.
//
//    Clients and components should use mplane.Receipt,
//    mplane.Redemption, and mplane.Withdrawal
//    directly
var StatementNotification = function(config){
    Statement.apply( this, arguments ); // Call the Statement (super) contructor
        
    return this; //Chainig
}
util.inherits(StatementNotification, Statement);

Statement.prototype.kind_str = function(){
    return "raw Statement";
}

//#Receipt
// A component presents a receipt to a Client in lieu of a result, when the
//     result will not be available in a reasonable amount of time; or to confirm
//     a Specification 
var Receipt = function(config){
    StatementNotification.apply( this, arguments ); // Call the Statement (super) contructor
      if (!config)
        config = {};
    
    return this; //Chaining
}
util.inherits(Receipt, StatementNotification);

Receipt.prototype.kind_str = function(){
        return KIND_RECEIPT;
}
Receipt.prototype.validate = function(){
    return this.validate();
}

//#Redemption
// A client presents a Redemption to a component from which it has received
//    a Receipt in order to get the associated Result.
var Redemption = function(config){
    StatementNotification.apply( this, arguments ); // Call the Statement (super) contructor
    if (!config)
        config = {};
    if (!_.isUndefined(config.receipt)){
        this._token = new Receipt(config.receipt).get_token();
    }
    return this; //Chainig
}
util.inherits(Redemption, StatementNotification);
    
Redemption.prototype.kind_str = function(){
        return KIND_REDEMPTION;
}

Redemption.prototype.validate = function(){
        return this.validate();
}

//#Withdrawal
//A Withdrawal cancels a Capability
var Withdrawal = function(config){
    StatementNotification.apply( this, arguments ); // Call the Statement (super) contructor
    if (!config)
        config = {};
    
    return this; //Chainig
}
util.inherits(Withdrawal, StatementNotification);
  
Withdrawal.prototype.kind_str = function(){
    return KIND_WITHDRAWAL;
}
Withdrawal.prototype.validate = function(){
    return this.validate();
}

//#Interrupt
// An Interrupt cancels a Specification
var Interrupt = function(){
    StatementNotification.apply( this, arguments ); // Call the Statement (super) contructor
    if (!config)
        config = {};
    
    return this; //Chainig
}
util.inherits(Interrupt, StatementNotification);
  
Interrupt.prototype.kind_str = function(){
        return KIND_INTERRUPT;
}
Interrupt.prototype.validate = function(){
    return this.validate();
}

//////////////////////////////////////////////////////////////////////////////////////////////
//
// # Utility functions
// A set of functions usefull for support tasks 
var utility = function(){}
// ##_parse_numset (parseNumSet)
// Parse a set to an array of integers
// CHECKME:how do we handle non numeric values? parseInt will return NaN
utility._parse_numset = function(valstr){
    // Iterate through each token from split and convert to integer
   return _.map(valstr.split(SET_SEP) , function(value, index){
        return parseInt(value);
    } );
}
utility.parseNumSet = utility._parse_numset;

// ##_unparse_numset (unParseNumSet)
// From an array of numbers to a string of values separated by SET_SEP
utility._unparse_numset = function(valset){
    return (valset.join(SET_SEP))
}
utility.unParseNumSet = utility._unparse_numset;

//##Return an array of day of week from a string with SET_SEP separator
// CHECKME: se ho capito bene restituisce un array con i numeri del giorno della settimana 
utility._parse_wdayset = function(valstr){
    return _.map(valstr.split(SET_SEP) , function(value, index){
        return _dow_label.indexOf(value.toLocaleLowerCase().trim());
    } );
}
utility.parseWdaySet = utility._parse_wdayset;

// ##From an array of numbers, return a string of days of week separated by 
utility._unparse_wdayset = function(valset){
    return _.map(valset , function(value, index){
        return _dow_label[parseInt(value)];
    } ).join(SET_SEP);
}
utility.unparseWdaySet = utility._unparse_wdayset;


utility.isInt = function(n) {
   return (n % 1 === 0);
}

utility.isReal = function(n){
    return ( !isNaN(parseFloat ( n )));
}


/*
 #from_dict
   > This function creates an mPlane object from a message
   >  It is based on the assumption that an element will have a corresponding properties in the json (ex. Capability will have the capability property)
   >  Returns an instance of an object of the type the message.
   >  dict can be a string or an object
 */
from_dict = function(dict){
    // If it is not an obj, try to parse it as a JSON
    // FIXME: manage non valid strings or Buffers (received by reading from http requests)
    if ((typeof dict !== 'object') || (dict instanceof Buffer))
        dict = JSON.parse(dict);
    var retObj = null,
        properties = _.keys(dict),
        config = {
            "verb" : dict.verb,
            "token" : dict.token,
            "label" : dict.label || dict._label || "",
            "link" : dict.link || "",
            "when": dict.when || ""
        },
        kind = null;

    supported_kinds.forEach(function(k){
        if (_.contains(properties, k)){
            kind = k;
        }
    });
    switch (kind){
        case KIND_CAPABILITY:
            retObj = new Capability(config);
            break;
        case KIND_SPECIFICATION:
            retObj = new Specification(config);
            break;
        case KIND_RESULT:
            retObj = new Result(config);
            break;
        case KIND_RECEIPT:
            retObj = new Receipt(config);
            break;
        case KIND_REDEMPTION:
            retObj = new Redemption(config);
            break;
        default:
            retObj = new Statement(config);
            console.log(kind + "TO BE ADDED IN from_dict. USING DEFAULT STATEMENT");
    }
    if (dict[kind])
        config.verb = dict[kind];

    // WHEN - Just the string, not the internal representation
    if (_.contains(properties, KEY_WHEN)){
        retObj.set_when(dict.when);
    }
     // Parameters
    // In the json RI, params are constrains (string format) if no value is provided or the value if provided
    if ("parameters" in dict){
        for (param in dict.parameters){
            var paramConfig = {
                type:param,
                constraints:dict.parameters[param]
            };
            // Specifications and results have the value of the params, not the constraint
            if ((kind == KIND_SPECIFICATION) || (kind == KIND_RESULT) || (kind == KIND_RECEIPT) || (kind == KIND_REDEMPTION)){
                // We should also set param values
                paramConfig.value = dict.parameters[param];
            }
            retObj.add_parameter(paramConfig);
        }
    }
    // Results
    if ("results" in dict){
        dict.results.forEach(function(resColumn , index){
            // Adds the new result column
            retObj.add_result_column(resColumn);
            if (dict.resultvalues){
                for (var row=0; row < dict.resultvalues.length; row++){
                    //if (dict.resultvalues[row][index])
                     retObj.set_result_column_value(resColumn , dict.resultvalues[row][index] || "")
                }
            }
        });
    }
    // Metadata
    if ("metadata" in dict){
        for (meta in dict.metadata){
            retObj.set_metadata_value(meta,dict.metadata[meta]);
        }
    }
    // Called here since we called the obj creation without all params set.
    // Some type of messages should keep the token we push from config. We force them for better compliance
    // Not too elegant, but simpler to do ...
    if ((kind == KIND_REDEMPTION) || (kind == KIND_RESULT) || (kind == KIND_SPECIFICATION) || (kind == KIND_RECEIPT)){
        retObj.set_token(dict.token);
    }
    else
        retObj.update_token();

    return retObj;
}

/**
 * Compares 2 IP addresses
 * Return 1 if B>A, -1 if B<A, 0 if B=A
 * @param A
 * @param B
 * @returns {*}
 */
utility.compareIP = function(A , B){
    if (!A || !B)
        return false;
    var resultB = B.split(".");
    var resultA = A.split(".");

    if (!resultA || !resultB)
        return false;
    for (var i=0 ; i<4 ; i++){
        ret = (parseInt(resultB[i]) - parseInt(resultA[i]));
        if (ret != 0){

            if (ret > 0)
                return(1)
            else
                return(-1);
        }
    }
    return 0;
}

//>Exports
module.exports = {
    time: time,
    when: when,
    When: when,
    when_infinite: when_infinite,
    Utility: utility,
    Scheduler: Scheduler,
    Primitive : Primitive,
    Element: Element,
    Constraints: Constraints,
    Parameter: Parameter,
    Metavalue: Metavalue,
    ResultColumn: ResultColumn,
    Statement: Statement,
    Capability: Capability,
    Specification: Specification,
    Result: Result,
    Receipt: Receipt,
    Redemption:Redemption,
    Withdrawal: Withdrawal,
    from_dict: from_dict
}