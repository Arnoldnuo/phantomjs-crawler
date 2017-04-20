const phantom = require('phantom');
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

let sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

class Crawler extends EventEmitter {
    constructor(options) {
        super(options);
        let defaultOptions = {
            //Callbacks，必须返回promise
            callback: () => {
                return new Promise(resolve => resolve)
            },
            // Schedule options
            rateLimit: 0, // Number Number of milliseconds to delay between each requests (Default 0).
            minRateLimit: 0,
            maxRateLimit: 0,
            randomRateLimit: false,

            // Other:
            rotate: false, // Boolean If true, userAgent should be an array and rotate it (Default false)
            userAgent: '', // String|Array, If rotateUA is false, but userAgent is an array, crawler will use the first one.
            referer: '' // String If truthy sets the HTTP referer header
        };
        this.queueList = [];
        this.options = Object.assign(defaultOptions, options);
    }
    async ready() {
        const instance = await phantom.create();
        this.page = await instance.createPage();
        this._task();
    }
    async _task() {
        let _this = this;
        while (true) {
            let task = _this.queueList.shift();
            if (!task) {
                _this.emit('drain');
                await sleep(2000);
                continue;
            }
            task = Object.assign(_this.options, task);
            if (task.rotate && _.isArray(_this.userAgent)) {
                _this.page.setting('userAgent', _.sample[_this.userAgent]);
            } else {
                _this.page.setting('userAgent', _this.userAgent);
            }
            let response;
            await _this.page.on('onResourceReceived', function(res) {
                if (!response && res) {
                    response = res;
                }
            });
            let status = await _this.page.open(task.uri);
            const content = await _this.page.property('content');
            await task.callback({
                content,
                status,
                response,
                uri: task.uri
            });
            await _this.page.off('onResourceReceived');
            await sleep(_this.getRateLimit());
        }
    }
    async queue(options) {
        options = _.isArray(options) ? options : [options];
        for (let option of options) {
            this._pushToQueue(_.isString(option) ? {
                uri: option
            } : option);
        }
    }
    getRateLimit() {
        if (this.randomRateLimit) {
            return _.random(this.minRateLimit, this.maxRateLimit);
        }
        return this.rateLimit;
    }
    async _pushToQueue(options) {
        this.queueList.push(options);
    }
}
module.exports = Crawler;
