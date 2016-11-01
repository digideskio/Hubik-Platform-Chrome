var Platform = require("../Hubik-Platform/index"),
    shell = require("shelljs"),
    util = require("hubik-util"),
    Protocol = require("./src/Protocol"),
    Promise = require("es6-promise").Promise;

var protocol = new Protocol(),
    protocolConfig = {
        host: "127.0.0.1",
        port: 9222
    };

var commands = [
    "--remote-debugging-port=" + protocolConfig.port,
    "--disable-extensions"
];

module.exports = new Platform("Chrome",function($instance){
    $instance.register("launch",function(config){
        util.log.info("Launch Chrome");
        if(!!config && config.length > 0){
            commands.concat(config);
        }
        return new Promise(function(resolve,reject){
            shell.exec('osascript -e \'quit app "Google Chrome"\'',{silent:true}, function(){
                util.log.command('osascript -e \'quit app "Google Chrome"\'');
                resolve();
            });
        })
            .then(function(){
                return util.wait(1000);
            })
            .then(function(){
                return new Promise(function(resolve,reject){
                    shell.exec('open -a "Google Chrome" --args ' + commands.join(" "), {silent:true}, function() {
                        util.log.command('open -a "Google Chrome" --args ' + commands.join(" "));
                        resolve();
                    });
                })
            })
            .then(function(){
                return util.wait(1000);
            })
            .then(function(){
                return protocol.connect(protocolConfig).then(function(){
                    commands = [
                        "--remote-debugging-port=" + protocolConfig.port,
                        "--disable-extensions"
                    ];
                });
            })
    });
    $instance.register("load",function(url){
        util.log.info("Load "+url);
        return protocol.load(url);
    });
    $instance.register("key",function(params){
        return ["keyDown","keyUp"].reduce(function(p,v,i){
            return p.then(function(){
                return protocol.input({
                    type: v,
                    windowsVirtualKeyCode: params.code
                })
            });
        },Promise.resolve());
    });
    $instance.register("runtime",function(params){
        return protocol.send(
            {
                "command": "Runtime.evaluate",
                "params":{
                    "expression": params.script
                }
            }).then(function(res){
            params.callback(res.result);
        });
    });

    $instance.addInterface("@Initialization.$platform.setCmds",function(cmds){
        commands = commands.concat(cmds);
    });
    $instance.addInterface("@Initialization.$platform.getName",function(){
        return "chrome";
    });
    $instance.addInterface("@Navigation&Automation.$runtime.send",function(method,params,callback){
        return protocol.send({
            "command": method,
            "params": params
        }).then(function(res){
            callback(res);
        });
    });
    $instance.addInterface("@Navigation&Automation.$runtime.addEventListener",function(event,callback){
        protocol.addEventListener(event,callback);
    });
    $instance.addInterface("@Navigation&Automation.$runtime.timeline",function(callback){
        var timelineProtocol = protocol.timeline(callback);
        return {
            start: function(){
                timelineProtocol.start();
            },
            end: function(){
                timelineProtocol.end(true);
            }
        }
    });
    $instance.addInterface("@Navigation&Automation.$runtime.evaluate",function(code,callback){
        return protocol.send(
                {
                    "command": "Runtime.evaluate",
                    "params":{
                        "expression": code
                    }
                }).then(function(res){
                    callback(res.result);
                });
    });
});
