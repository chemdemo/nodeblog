var crypto = require('crypto');
var request = require('request');
var http = require('http');

function md5(str) {
    var hash = crypto.createHash('md5');
    hash.update(str);
    return str = hash.digest('hex');
}

function run(email) {
    var u = 'http://www.gravatar.com/avatar/' + md5(email) + '?size=48';

    http.createServer(function(req, res) {
        request({
            proxy: 'http://proxy.tencent.com:8080',
            url: u
        }, function(err, _res) {
            console.log(err, _res.statusCode);

            res.writeHead(_res.statusCode, {'Content-Type': 'text/html'});
            if(!err) {
                res.write('<img src="'+u+'" />');
            } else {
                res.write('<h1 style="color: red;">Get avatar error!</h1>');
            }
            res.end();
        });
    }).listen(8888);
    console.log('Listen port %s.', '8888');
}

var email = process.argv[2];

run(email);
