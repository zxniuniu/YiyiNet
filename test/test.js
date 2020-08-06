let superagent = require('superagent');
// var url = "http://localhost:8070/node/mzitu-spider3.js";
// var url = "https://www.mzitu.com/50574/1";
var url = 'http://172.16.220.10:8120/node/mzitu-spider3.js';

superagent
    .get(url)
    .trustLocalhost()
    .set({'content-type': 'application/javascript'})
    .end(function (err, res) {
        if (err) {
            console.error(err)
        }
        console.log('body1:' + res.body)
    });

var http = require('http'), concat = require('concat-stream');
http.get({
    host: '172.16.220.10',
    port: 8120,
    path: '/node/mzitu-spider3.js'
}, function (res) {
    res.setEncoding('utf8');
    res.pipe(concat({encoding: 'string'}, function (remoteSrc) {
        console.log('body2:' + remoteSrc)
    }));
});
