var Promise = require("es6-promise").Promise,
    chalk = require("chalk");

exports.wait = function(time){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve();
        },time);
    });
};
exports.getArgs = function(fn){
    return fn.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].replace(/\s+/g, "").split(",");
};
exports.log = {
    info: function(msg){
        console.log(chalk.green("[INFO]:"+msg));
    },
    error: function(msg){
        console.log(chalk.red("[ERROR]:"+msg));
    },
    protocol: function(msg){
        console.log(chalk.blue("[PROTOCOL]:"+msg));
    },
    result: function(msg){
        console.log(chalk.cyan("[RESULT]:"+msg));
    },
    command: function(msg){
        console.log(chalk.magenta("[COMMAND]:"+msg));
    }
};
