/**
 * Module dependencies.
 */
// npm install marked

var express = require('express')
    , settings = require('./settings')
    , routes = require('./server/routes')
    , http = require('http')
    , path = require('path')
    , flash = require('connect-flash')
    , ejs = require('ejs')
    , connectDomain = require('connect-domain');

ejs.open = '{{';
ejs.close = '}}';

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || settings.SYSPORT);
    app.set('views', __dirname + '/server/views');
    app.set('view engine', 'ejs');
    app.set('view options', {
        'open': '{{', 
        'close': '}}',
        'layout': false
    });
    /*app.register('.html', {
        compile: function(str, options) {
            return function(locals) {
                return str;
            }
        }
    });
    app.set('view options', {layout: false});
    app.engine('html', require('ejs').renderFile);*/
    app.use(express.favicon(__dirname + '/web/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('softblog'));
    app.use(express.session({
        /*key: settings.HOST,
        store: new MongoStore({
            db: settings.HOST
        }),*/
        secret: settings.SESSION_SECRET,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}//30 days
    }));
    app.use(connectDomain());
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

// 404
app.use(function(req, res, next) {
    //res.send(404, 'Not found.');
    res.render('404', {msg: 'Page not found!'});
});

// 500
app.use(function(err, req, res, next) {
    console.log(err, '-------------------------------');
    res.send(500, 'Server error.');
});

process.on('uncaughtException', function(err) {
    console.log('uncaughtException err: %s, at %s', err, new Date());
});