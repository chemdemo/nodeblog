/**
 * Module dependencies.
 */

var express = require('express')
    , settings = require('settings')
    , routes = require('./server/routes')
    , http = require('http')
    , path = require('path')
    //, MongoStore = require('connect-mongo')(express)
    , flash = require('connect-flash');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || settings.SYSPORT);
    app.set('views', __dirname + '/server/views');
    /*app.set('view engine', 'html');
    app.register('.html', {
        compile: function(str, options) {
            return function(locals) {
                return str;
            }
        }
    });
    app.set('view options', {layout: false});*/
    app.engine('html', require('ejs').renderFile);
    app.use(express.favicon(__dirname + '/web/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('soft blog'));
    /*app.use(express.session({
        secret: settings.COOKIE_SECRET,
        key: settings.HOST,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
        store: new MongoStore({
            db: settings.HOST
        })
    }));*/
    app.use(express.session());
    app.use(app.router);
    //app.use(require('stylus').middleware(__dirname + '/web/'));
    app.use(express.static(__dirname + '/web/'));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

routes(app);