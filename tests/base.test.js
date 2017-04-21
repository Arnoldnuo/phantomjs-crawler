'use strict';

var Crawler = require('../lib/crawler');
var expect = require('chai').expect;
var baseUri = 'https://movie.douban.com/subject/1292052/questions/164/?from=subject';

let a = new Date().getTime();

describe('phantom crawler', function() {
    it('should excute js', async function(done) {
        let c = new Crawler({
            callback: async(option) => {
                // console.log(option);
                console.log(new Date().getTime() - a);
                a = new Date().getTime();
            },
	    minRateLimit: 1000,
	    maxRateLimit: 9000,
	    randomRateLimit: true
        });
        await c.queue(baseUri);
        await c.ready();
        c.on('drain', async(a) => {
            await c.queue('http://www.baidu.com');
            // console.log('drain');
        });
    });
});
