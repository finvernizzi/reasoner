// TEST
// ----
// Testing the implementation

var mplane= require("../mplane"),
    assert = require("assert");


// Global vars
var testRun = 0;
var testFailed = 0;
var LINE_LENGTH=75;
var RESULT_LENGTH = 50;
var wdef = null;
var wrel = null;

var REGISTRY_FILE = "node_modules/test/registry.json";

var testList = [
    {
        desc: "Utility",
        testFunc: function(){
            printLn({string:" UTILITY " , pad: "*",align:"center",length:LINE_LENGTH});
        },
        isTest : false
    },
    {
        desc : "Utility.isInt",
        numTests: 4,
        testFunc: function(){
            assert.equal(mplane.utility.isInt("14364567"), true, "Utility.isInt - it was an INT");
            assert.equal(mplane.utility.isInt(14364567), true, "Utility.isInt - it was an INT");
            assert.equal(mplane.utility.isInt("14364567.3234"), false, "Utility.isInt - it was a REAL");
            assert.equal(mplane.utility.isInt("mplane"), false, "Utility.isInt - it was a string");
        }
    },
    {
        desc : "Utility.isReal",
        numTests: 3,
        testFunc: function(){
            assert.equal(mplane.utility.isReal("14364567.5212"), true, "Utility.isReal - it was a REAL");
            assert.equal(mplane.utility.isReal(14364567), true, "Utility.isReal - it was a REAL");
            assert.equal(mplane.utility.isReal("mplane"), false, "Utility.isReal - it was a string");
        }
    },
    {
        desc: "Set When",
        testFunc: function(){
            wdef = new mplane.when("2009-02-20 13:00:00 ... 2009-02-20 15:00:00");
            printLn({string:" WHEN - absolute set" , pad: "*",align:"center",length:LINE_LENGTH});
        },
        isTest : false
    },
    {
        desc : "When.duration",
        testFunc: function(){
            assert.equal(wdef.duration(), (new Date("2009-02-20 15:00:00") - new Date("2009-02-20 13:00:00")), "Error in duration   function");
        }
    },
    {
        desc : "When.period",
        testFunc: function(){
            assert.equal(wdef.period(), null, "Error in period function");
        }
    },
    {
        desc : "When.is_definite",
        testFunc: function(){
            assert.equal(wdef.is_definite(), true, "Error in is_definite");
        }
    },
    {
        desc : "When.is_infinite",
        testFunc: function(){
            assert.equal(wdef.is_infinite(), false, "Error in is_infinite");
        }
    }
    ,{
        desc : "When.in_scope",
        numTests: 2,
        testFunc: function(){
            assert.equal(wdef.in_scope(mplane.time.parse_time("2009-02-20 14:15:16")), true, "Error in in_scope");
            assert.notEqual(wdef.in_scope(mplane.time.parse_time("2009-02-21 14:15:16")), true, "Error not in in_scope");
        }
    }
     ,{
        desc : "When.sort_scope",
         numTests: 2,
        testFunc: function(){
            assert.equal((wdef.sort_scope(mplane.time.parse_time("2009-01-20 22:30:15")) < 0) , true , "Error in sort_scope 1"); 
            assert.equal((wdef.sort_scope(mplane.time.parse_time("2010-07-27 22:30:15")) > 0) , true , "Error in sort_scope 2"); 
        }
    }
    ,{
        desc : "When._datetimes",
        testFunc: function(){
            var se = wdef._datetimes();
            assert.equal((mplane.time.areEqual(se.start , mplane.time.parse_time("2009-02-20 13:00:00"))) && (mplane.time.areEqual(se.end ,         mplane.time.parse_time("2009-02-20 15:00:00"))) , true , "Error in _datetimes"); 
        }
    }
    ,{
        desc : "When.timer_delays",
        testFunc: function(){
            var td = wdef.timer_delays(mplane.time.parse_time("2009-02-20 12:00:00"));
            assert.equal(((td.sd == 3600) && (td.ed == 10800)) , true , "Error in timer_delays"); 
        }
    }
    ,{
        desc: "Set When",
        testFunc: function(){
            wrel = new mplane.when("now + 30m / 15s");
            printLn();
            printLn({string:" WHEN - relative set " , pad: "*",align:"center",length:LINE_LENGTH});
        },
        isTest : false
    }
    ,{
        desc : "When.duration",
        testFunc: function(){
            assert.equal(wrel.duration(), 1800,"Error in duration");
        }
    }
     ,{
        desc : "When.period",
        testFunc: function(){
            assert.equal(wrel.period(), 15,"Error in period");
        }
    }
    ,{
        desc : "When.is_definite",
        testFunc: function(){
            assert.equal(wrel.is_definite(), true ,"Error in is_definite");
        }
    }
     ,{
        desc : "When.is_immediate",
        testFunc: function(){
            assert.equal(wrel.is_immediate(), true,"Error in is_immediate");
        }
    }
    ,{
        desc : "When.in_scope",
        testFunc: function(){
            assert.equal(wrel.in_scope(mplane.time.parse_time("2009-02-20 13:44:45") , mplane.time.parse_time("2009-02-20 13:30:00")), true,"Error in in_scope");
        }
    }
    ,{
        desc : "When.follows",
        testFunc: function(){
            assert.equal(wrel.follows(wdef , mplane.time.parse_time("2009-02-20 13:30:00")) , true , "Error in follows"); 
        }
    }
    ,{
        desc : "When.timer_delays",
        testFunc: function(){
            var td = wrel.timer_delays( mplane.time.parse_time("2009-02-20 12:00:00"));
            assert.equal(((td.sd == 0) && (td.ed == 1800)) , true , "Error in timer_delays");  
        }
    }
    ,{
        desc: "Set When",
        testFunc: function(){
            printLn();
            printLn({string:" WHEN - when_infinite " , pad: "*",align:"center",length:LINE_LENGTH});
        },
        isTest : false
    }
     ,{
        desc : "when_infinite.duration",
        testFunc: function(){
            assert.equal(mplane.when_infinite.duration() , null , "Error in duration");  
        }
    }
    ,{
        desc : "when_infinite.period",
        testFunc: function(){
            assert.equal(mplane.when_infinite.period() , null , "Error in period");  
        }
    }
    ,{
        desc : "when_infinite.follows",
        numTests: 2,
        testFunc: function(){
            assert.equal(wdef.follows(mplane.when_infinite) , true , "Error in absolute def - follows infinite");  
            assert.equal(wrel.follows(mplane.when_infinite) , true , "Error in relative def - follows infinite");  
        }
    }
    ,{
        desc : "when_infinite._datetimes",
        testFunc: function(){
            var se = mplane.when_infinite._datetimes();
            assert.equal((mplane.time.areEqual(se.start , null)) && (mplane.time.areEqual(se.end , null)) , true , "Error in _datetimes"); 
        }
    },{
        desc: "Primitives",
        testFunc: function(){
            printLn();
            printLn({string:" Primitives " , pad: "*",align:"center",length:LINE_LENGTH});
            prim = new mplane.Primitive();
        },
        isTest : false
    },{
        desc : "Primitives.string",
        numTests: 5,
        testFunc: function(){
            prim.setType(mplane.Primitive.STRING);
            assert.deepEqual(prim.parse("foo") , 'foo' , "Error in Primitives.string parse"); 
            assert.deepEqual(prim.unparse('foo') , 'foo' , "Error in Primitives.string unparse"); 
            assert.deepEqual(prim.parse(mplane.Primitive.VALUE_NONE) , mplane.Primitive.VALUE_NONE , "Error in Primitives.string parse NONE"); 
            assert.deepEqual(prim.unparse() , null , "Error in Primitives.string unparse null "); 
            assert.deepEqual(prim.isValid("mPlane: Internet Measurement Plane") , true , "Error in Primitives.isValid"); 
        }
    },{
        desc : "Primitives.integer",
        numTests: 3,
        testFunc: function(){
            prim.setType(mplane.Primitive.NATURAL);
            assert.equal(prim.parse("42") , 42 , "Error in Primitives.integer parse"); 
            assert.deepEqual(prim.unparse(34) , "34" , "Error in Primitives.integer unparse");
            assert.deepEqual(prim.isValid(1234234) , true , "Error in Primitives.isValid"); 
        }
    }
    ,{
        desc : "Primitives.real",
        numTests: 4,
        testFunc: function(){
            prim.setType(mplane.Primitive.REAL);
            assert.deepEqual(prim.unparse(Math.PI) , '3.141592653589793' , "Error in Primitives.real unparse"); 
            assert.equal(prim.parse("4.2e6") , 4200000.0 , "Error in Primitives.real parse");
            assert.deepEqual(prim.isValid("4.2e6") , true , "Error in Primitives.isValid"); 
            assert.deepEqual(prim.isValid("mPlane mPlane") , false , "Error in Primitives.isValid 2"); 
        }
    }
    ,{
        desc : "Primitives.boolean",
        numTests: 6,
        testFunc: function(){
            prim.setType(mplane.Primitive.BOOL);
            assert.equal(prim.unparse(false) , 'false' , "Error in Primitives.boolean unparse"); 
            assert.equal(prim.parse("false") , false , "Error in Primitives.boolean parse");
            assert.equal(prim.parse("TrUe") , true , "Error in Primitives.boolean parse (True)");
            assert.equal(prim.unparse(true) , 'true' , "Error in Primitives.boolean unparse (True)"); 
            assert.deepEqual(prim.isValid(true) , true , "Error in Primitives.isValid"); 
            assert.deepEqual(prim.isValid("NotTrue") , false , "Error in Primitives.isValid 2"); 
        }
    }
    ,{
        desc : "Primitives.IP",
        numTests: 4,
        testFunc: function(){
            prim.setType(mplane.Primitive.IP);
            assert.equal(prim.isValid("10.0.27.101") , true , "Error in Primitives.isValid"); 
            assert.equal(prim.isValid("10.0.27.101.123") , false , "Error in Primitives.isValid "); 
            assert.equal(prim.parse("10.0.27.101") , "10.0.27.101" , "Error in Primitives.IP parse"); 
            assert.equal(prim.unparse("10.0.27.101") , "10.0.27.101" , "Error in Primitives.IP unparse"); 
        }
    }
    ,{
        desc : "Primitives.IPv6",
        numTests: 3,
        testFunc: function(){
            prim.setType(mplane.Primitive.IP6);
            assert.equal(prim.isValid("2001:DB8::1") , true , "Error in Primitives.isValid"); 
            assert.equal(prim.parse("2001:db8:1:33::C1A0") , "2001:db8:1:33::C1A0" , "Error in Primitives.IP6 parse"); 
            assert.equal(prim.unparse("2001:db8:1:33::c0:ffee") , "2001:db8:1:33::c0:ffee" , "Error in Primitives.IP6 unparse"); 
        }
    }
    ,{
        desc : "Primitives.time",
        numTests: 6,
        testFunc: function(){
            prim.setType(mplane.Primitive.TIME);
            assert.deepEqual(prim.parse("2013-07-30 23:19:42") , new Date("2013/07/30 23:19:42") , "Error in Primitives.time parse"); 
            assert.deepEqual(prim.parse(mplane.time.TIME_NOW) , mplane.time.TIME_NOW , "Error in Primitives.time parse now"); 
            assert.deepEqual(mplane.time.time_past(prim.parse(mplane.time.TIME_PAST)) ,true , "Error in Primitives.time parse past"); 
            assert.deepEqual(mplane.time.time_future(prim.parse(mplane.time.TIME_FUTURE)) ,true , "Error in Primitives.time parse future");  
            assert.deepEqual(prim.isValid("2013-07-30 23:19:42") , true , "Error in Primitives.isValid"); 
            assert.deepEqual(prim.isValid(mplane.time.TIME_FUTURE) , true , "3 Error in Primitives.isValid"); 
        }
    },{
        desc: "Element",
        testFunc: function(){
            printLn();
            printLn({string:" Element " , pad: "*",align:"center",length:LINE_LENGTH});
            element = new mplane.Element({name:"Prova",prim:mplane.Primitive.NATURAL,desc:"Solo un aprova"});
            mplane.Element.initialize_registry(REGISTRY_FILE);
        },
        isTest : false
    }
    ,{
        desc : "Element.constraints",
        numTests: 8,
        testFunc: function(){
            var element = new mplane.Element("source"); // prim is a STRING
            var Test1 = element.addConstraint("A,B,C,F");
            element.setConstraintsName(Test1 , "Test1");
            var Test2 = element.addConstraint("A ... C");
            element.setConstraintsName(Test2 , "Test2");
            assert.deepEqual(element.met_by("A" , Test1) , true , "Element.constraints 1"); 
            assert.deepEqual(element.met_by("D" , Test1) , false , "Element.constraints 2"); 
            assert.deepEqual(element.met_by("F" , Test1) , true , "Element.constraints 3"); 
            assert.deepEqual(element.met_by("B" , Test2) , true , "Element.constraints 4"); 
            assert.deepEqual(element.met_by("C" , Test2) , true , "Element.constraints 5"); 
            assert.deepEqual(element.met_by("J" , Test2) , false , "Element.constraints 6"); 
            assert.deepEqual(element.met_by("B") , true , "Element.constraints 7"); 
            assert.deepEqual(element.met_by("D") , false , "Element.constraints 8"); 
        }
    }
        ,{
        desc: "Statement",
        testFunc: function(){
            printLn();
            printLn({string:" Statement " , pad: "*",align:"center",length:LINE_LENGTH});
            mplane.Element.initialize_registry(REGISTRY_FILE);
            element = new mplane.Element("source");
            cons1 = element.addConstraint("Node A ... Node H");
            statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
        },
        isTest : false
    }
    ,{
        desc : "Statement.has_parameter",
        numTests: 2,
        testFunc: function(){
            statement.add_parameter("Source" , element , "Node G");
            assert.deepEqual(statement.has_parameter("Source") , true , "Statement.has_parameter 1"); 
            assert.deepEqual(statement.has_parameter("Destination") , false , "Statement.has_parameter 2"); 
        }
    },{
        desc : "Statement.get_parameter_value",
        numTests: 2,
        testFunc: function(){
            statement.add_parameter("Destination" , element , "Node A");
            assert.deepEqual(statement.get_parameter_value("Source") , "Node G" , "Statement.get_parameter_value 1"); 
            assert.deepEqual(statement.has_parameter("Destination") , true , "Statement.get_parameter_value 2"); 
        }
    }
    ,{
        desc: "Statement.resultColumn",
        testFunc: function(){
            printLn();
            printLn({string:" Statement resultColumn" , pad: "*",align:"center",length:LINE_LENGTH});
            mplane.Element.initialize_registry(REGISTRY_FILE);
            var element = new mplane.Element("source");
            var cons1 = element.addConstraint("Node A ... Node H");
            var statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
        },
        isTest : false
    }
    ,{
        desc : "Statement.resultColumn",
        numTests: 4,
        testFunc: function(){
            statement.add_result_column("Source", element);
            assert.deepEqual(statement.has_result_columns("Source") , true , "Statement.has_resultColumn"); 
            assert.deepEqual(statement.count_result_columns() , 1 , "Statement.count_result_columns"); 
            statement.set_result_column_value("Source", {"1" : "Node D"});
            assert.deepEqual(statement.get_result_column_value("Source" , "1") , "Node D" , "Statement.set_result_column_value 1");
            var setAgainstConstraints = false;
            try{
                 // Throws an error since Node I does not match the constraints we set
                statement.set_result_column_value("Source", {"1" : "Node I"});
            }catch(e){
                setAgainstConstraints = true;
            }
            assert.deepEqual(setAgainstConstraints, true , "Statement.set_result_column_value 2"); 
        }
    }
    ,{
        desc: "Statement.metaData",
        testFunc: function(){
            printLn();
            printLn({string:" Statement metaData" , pad: "*",align:"center",length:LINE_LENGTH});
            mplane.Element.initialize_registry(REGISTRY_FILE);
            var element = new mplane.Element("source");
            var cons1 = element.addConstraint("Node A ... Node H");
            var statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
        },
        isTest : false
    }
    ,{
        desc : "Statement.metaData",
        numTests: 4,
        testFunc: function(){
            statement.add_metadata("Meta1", "The source node");
            assert.deepEqual(statement.has_metadata("Meta1") , true , "Statement.has_metaData"); 
            assert.deepEqual(statement.get_metadata_value("Meta1") , "The source node" , "Statement.get_metadata"); 
            statement.add_metadata("Meta2", "Some extra info");
            statement.add_metadata("Meta3", "Other extra info");
            assert.deepEqual(statement.count_metadata() , 3 , "Statement.count_metadata");
            statement.set_metadata_value("Meta3", "This is a very usefull info");
            assert.deepEqual(statement.get_metadata_value("Meta3") , "This is a very usefull info" , "Statement.set_metadata_value"); 
        }
    }
    ,{
        desc: "Statement._schema_hash",
        testFunc: function(){
            printLn();
            printLn({string:" Statement _schema_hash" , pad: "*",align:"center",length:LINE_LENGTH});
        },
        isTest : false
    }
    ,{
        desc : "Statement.hash",
        numTests: 2,
        testFunc: function(){
            assert.deepEqual(statement._schema_hash() , "728e2cf50793bb277bc32375490f1c20" , "Statement._schema_hash");  
            assert.deepEqual(statement._mpcv_hash() , "fe4cbf075cd29eec318f0fbdb8dab4ed" , "Statement._mpcv_hash");  
        }
    }
     ,{
        desc: "Statement.when",
        testFunc: function(){
            printLn();
            printLn({string:" Statement when " , pad: "*",align:"center",length:LINE_LENGTH});
            mplane.Element.initialize_registry(REGISTRY_FILE);
            var statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
        },
        isTest : false
    }
    ,{
        desc : "Statement.when",
        numTests: 2,
        testFunc: function(){
            var w = new mplane.When("now + 30m / 15s");
            statement.set_when(w);
            assert.deepEqual((w == statement.get_when()) , true , "Statement.when"); 
            statement.set_when(mplane.time.TIME_NOW);
            assert.deepEqual((statement.get_when().is_immediate()) , true , "Statement.when 2"); 
        }
    }
    ,{
        desc: "Capability",
        testFunc: function(){
            printLn();
            printLn({string:" Capability " , pad: "*",align:"center",length:LINE_LENGTH});
            element = new mplane.Element("source");
            statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
            statement.add_parameter("Source" , element , "Node G");
            capability = new mplane.Capability(statement)
        },
        isTest : false
    }
    ,{
        desc : "Capability.validate",
        numTests: 2,
        testFunc: function(){
            assert.deepEqual(capability.validate() , true , "Capability.validate"); 
            statement.add_parameter("Source2" , element );
            var capability2 = new mplane.Capability(statement)
            assert.deepEqual(capability2.validate() , false , "Capability.validate 2"); 
        }
    }
    ,{
        desc: "Result",
        testFunc: function(){
            printLn();
            printLn({string:" Result " , pad: "*",align:"center",length:LINE_LENGTH});
            element = new mplane.Element("source");
            cons1 = element.addConstraint("Node A ... Node H");
            statement = new mplane.Statement({verb:mplane.Statement.VERB_COLLECT});
            statement.add_parameter("Source" , element , "Node G");
            statement.add_parameter("Destination" , element , "Node A");
            statement.add_result_column("Prova" );
            statement.add_result_column("Source", element);
            
        },
        isTest : false
    }
    ,{
        desc : "Result.validate",
        numTests: 2,
        testFunc: function(){
            result = new mplane.Result(statement);
            assert.deepEqual(result.validate() , false , "Result.validate"); 
            result.set_when(new mplane.When("2009-02-20 13:00:00 ... 2009-02-20 15:00:00"));
            assert.deepEqual(result.validate() , true , "Result.validate 2"); 
        }
    }
    ,{
        desc : "Result.value",
        testFunc: function(){
            result.set_result_value("Prova" , {"0" : "ciao"});
            assert.deepEqual(result.get_result_value("Prova" , "0" ) , "ciao" , "Result.value"); 
        }
    }
];

// Testing LOOP
for (testIndex in testList){
    doTest(testList[testIndex]);
} 

// Final report
printLn();
printLn({string:" REPORT " , pad: "_",align:"center",length:LINE_LENGTH});
printLn();
print({string:" Total tests performed: " , length: (LINE_LENGTH - 40), pad:"."});
printLn({string:testRun || " NONE", length: 40, pad:".", align:"right"});
print({string:" Failed tests: " , length: (LINE_LENGTH - 40), pad:"." });
printLn({string:testFailed || " NONE" , length: 40, pad:".", align:"right"});

// Here the tests are performed
// isTest is for context activities that are not really tests
function doTest(testConfig){
    var desc = testConfig.desc || "" 
        ,testFunc = testConfig.testFunc
        ,isTest = true
        ,numTests = 1;
    
    if (!testConfig.isTest)
        isTest = testConfig.isTest;
    if (!testConfig.numTests)
        numTests = testConfig.numTests;
    
    if (isTest) { 
        testRun += numTests;
        print({string:desc , length: LINE_LENGTH-RESULT_LENGTH, pad:"."});
    }
    try{
        testFunc();
        if (isTest)
            printLn({string:" Ok("+numTests+")" , pad:"." , length: RESULT_LENGTH , align: "right"});
    }catch(e){
        if (isTest) {
            testFailed += 1;
            printLn({string:" FAILED" , pad:"." , length: RESULT_LENGTH , align: "right" , comment:e.message});
        }
    }
}

// String formatting for output
function strPad(config){
    if (!config)
        config = {};
    var str = config.string || "", 
        length = config.length || 20, 
        pad = config.pad || " ",
        align = config.align || 'left',
        comment = config.comment || null,
        strOut = "";
    
    if (comment)
            str += "("+comment+")"
    // Is the input stringlonger than required length?
    if (str.length > length){
        return str.substr(0 , length);
    }
    switch (align){
        case "right":
            for (i=0 ; i<(length-str.length) ; i++){
                strOut += pad;
            }
            strOut += str;
            break;
        case "center":
            for (i=0 ; i<((length-str.length)/2) ; i++){
                strOut += pad;
            }
            strOut += str;
            for (i=0 ; i<((length-str.length)/2) ; i++){
                strOut += pad;
            }
            break;
        case "left":
        default:
            strOut += str;
            for (i=0 ; i<(length-str.length) ; i++){
                strOut += pad;
            }
    }
    
    return strOut; 
}

function print(config){
    process.stdout.write(strPad(config));
}
function printLn(config){
    var s = strPad(config)
    process.stdout.write(s+"\n");
}


