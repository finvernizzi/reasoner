/**
 * This module manages external CA or keys
 * It is simply a wrapper of basic FS functions for simpler HTTPS options
 *
 * @type {readCaChain}
 */

var fs = require('fs');

module.exports.readCaChain = readCaChain;
module.exports.readFileContent = readFileContent;

/**
 * Given an array of file name (complete path) or a single file (complete path), return an array of ca for use in https options
 * @param caChain can be a file full path or an array of files (full path) if you are using a CA chain.
 * @returns {*} the CA cahin to be used as options in https requests
 */
function readCaChain(caChain){
    var ret = [];
    if (caChain instanceof Array){
        caChain.forEach(function(fileName){
            try{
                ret.push(fs.readFileSync(fileName , "utf-8"))
            }catch(e){
                console.log("---readCaChain--- Error reading CA chain file");
                console.log(e);
                return null;
            }
        });
    }
    // IF it is a string, it should be directly a file name and not a chain
    if (caChain instanceof String){
        try{
            ret.push(fs.readFileSync(caChain) , "utf-8");
        }catch(e){
            console.log("---readCaChain--- Error reading CA chain file");
            console.log(e);
            return null;
        }
    }
    return ret;
}
/**
 * Reads cert and keys
 * @param fileName (full path)
 * @returns {*}
 */
function readFileContent(fileName){
    try{
        return(fs.readFileSync(fileName , "utf-8"));
    }catch(e){
        console.log("---readFileContent-- Error reading file "+fileName);
        console.log(e);
        return null;
    }
}