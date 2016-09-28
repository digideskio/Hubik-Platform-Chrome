var CRI = require('chrome-remote-interface'),
    util = require('./util'),
    Promise = require("es6-promise").Promise,
    objectAssign = require('object-assign');

function Protocol(){
    this.instance = null;
}
Protocol.prototype._prepare = function(){
    this.instance.Page.enable();
    this.instance.Runtime.enable();
    this.instance.Network.enable();
};
Protocol.prototype.connect = function(config){
    var self = this;
    return new Promise(function(resolve,reject){
        CRI(objectAssign(config,{
            chooseTab: function(tabs){
                var which = 0;
                tabs.forEach(function(v,i){
                    if(v.type == "page"){
                        which = i;
                    }
                });
                self.tabId = tabs[which].id;
                return which;
            }
        }),function (chrome) {
            util.log.info("Debugging protocol connected");
            self.instance = chrome;
            self._prepare();
            resolve();
        }).on('error', function (e) {
            util.log.error(e);
            reject();
        });
    });
};
Protocol.prototype.load = function(url){
    var self = this;
    return new Promise(function(resolve,reject){
        self.instance.Page.navigate({
            url: url
        });
        var temp = true;
        self.instance.on("Page.loadEventFired",function(e){
            if(temp){
                util.log.info("Page loaded");
                resolve();
                temp = false;
            }
        });
    });
};
Protocol.prototype.input = function(params){
    var self = this;
    return new Promise(function(resolve,reject){
        util.log.protocol(JSON.stringify(params));
        self.instance.Input.dispatchKeyEvent(params,function(){
            resolve();
        });
    });
};
Protocol.prototype.send = function(args){
    var self = this;
    return new Promise(function(resolve,reject){
        self.instance.send(args.command,args.params,function(err,res){
            if(!err){
                resolve(res);
            }
            else{
                reject();
            }
        });
    });
};
Protocol.prototype.addEventListener = function(event,fn) {
    this.instance.on(event,fn);
};
Protocol.prototype.timeline = function(callback){
    var self = this,
        last = false;
    this.instance.on("Tracing.bufferUsage",function(data){
        if(data.value >= 0.8){
            end(false);
        }
    });
    this.instance.on("Tracing.dataCollected",function(data){
        data.value.forEach(function(v,i){
            callback({
                complete: false,
                data: v
            });
        });
    });
    this.instance.on("Tracing.tracingComplete",function(data){
        util.log.info("Timeline tracingComplete");
        util.log.result("Islast: " + last);
        if(last) {
            callback({
                complete: true
            });
        }
        else{
            start();
        }
    });
    function end(l){
        last = l;
        util.log.info("Timeline end");
        self.instance.send("Tracing.end",function(err,data){});
    }
    function start(){
        util.log.info("Timeline start");
        self.instance.send("Tracing.start", {categories:"devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame",bufferUsageReportingInterval:500},function(err,data){});
    }
    return {
        start: start,
        end: end
    }
};
module.exports = Protocol;

//-*,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.console,disabled-by-default-devtools.timeline.stack
//devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame

/*{ categories:
 [ 'AccountFetcherService',
 'Blob',
 'CRLSet',
 'CRLSetFetcher',
 'CacheStorage',
 'ETW Trace Event',
 'FileSystem',
 'IndexedDB',
 'RLZ',
 'ServiceWorker',
 'ValueStoreFrontend::Backend',
 'WebCore',
 'audio',
 'benchmark',
 'blink',
 'blink,benchmark',
 'blink,benchmark,disabled-by-default-blink.debug.layout',
 'blink,blink_style',
 'blink,devtools.timeline',
 'blink.animations,devtools.timeline',
 'blink.net',
 'blink.user_timing',
 'blink_gc',
 'browser',
 'browser,navigation',
 'browser,startup',
 'cc',
 'cc,benchmark',
 'cc,disabled-by-default-devtools.timeline',
 'devtools',
 'devtools.timeline',
 'devtools.timeline,v8',
 'disabled-by-default-blink.debug',
 'disabled-by-default-blink.debug.layout',
 'disabled-by-default-blink.image_decoding',
 'disabled-by-default-blink.invalidation',
 'disabled-by-default-cc.debug',
 'disabled-by-default-cc.debug,disabled-by-default-cc.debug.quads,disabled-by-default-devtools.timeline.layers',
 'disabled-by-default-cc.debug.cdp-perf',
 'disabled-by-default-cc.debug.display_items',
 'disabled-by-default-cc.debug.display_items,disabled-by-default-cc.debug.picture,disabled-by-default-devtools.timeline.picture',
 'disabled-by-default-cc.debug.quads',
 'disabled-by-default-cc.debug.scheduler',
 'disabled-by-default-cc.debug.scheduler.frames',
 'disabled-by-default-cc.debug.scheduler.now',
 'disabled-by-default-devtools.timeline',
 'disabled-by-default-devtools.timeline.frame',
 'disabled-by-default-devtools.timeline.invalidationTracking',
 'disabled-by-default-file',
 'disabled-by-default-gpu.debug',
 'disabled-by-default-gpu.device',
 'disabled-by-default-gpu.service',
 'disabled-by-default-gpu_decoder',
 'disabled-by-default-ipc.flow',
 'disabled-by-default-memory-infra',
 'disabled-by-default-renderer.scheduler',
 'disabled-by-default-renderer.scheduler.debug',
 'disabled-by-default-skia',
 'disabled-by-default-system_stats',
 'disabled-by-default-toplevel.flow',
 'disabled-by-default-v8.cpu_profile',
 'disabled-by-default-v8.cpu_profile.hires',
 'disabled-by-default-worker.scheduler',
 'disabled-by-default-worker.scheduler.debug',
 'gpu',
 'identity',
 'input',
 'input,benchmark',
 'ipc',
 'ipc,toplevel',
 'leveldb',
 'loader',
 'media',
 'navigation',
 'renderer',
 'renderer,benchmark',
 'renderer.scheduler',
 'renderer_host',
 'renderer_host,navigation',
 'skia',
 'startup',
 'sync',
 'sync_lock_contention',
 'test_fps,benchmark',
 'test_gpu',
 'ui',
 'v8' ] }*/

