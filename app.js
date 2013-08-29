/**
 * Module dependencies.
 */
// npm install marked

var express = require('express')
    , http = require('http')
    , path = require('path')
    //, flash = require('connect-flash')
    //, ejs = require('ejs')
    , swig = require('swig')
    , cons = require('consolidate')
    , connectDomain = require('connect-domain')
    , MongoStore = require('connect-mongo')(express)
    //, RedisStore = require('connect-redis')(express)

    , staticDir = path.resolve(__dirname, './web')
    , settings = require('./settings')
    , maxAge = settings.EXPIRES
    , routes = require('./server/routes');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || settings.APP_PORT);
    //app.engine('html', swig.renderFile);
    app.engine('html', cons.swig);
    swig.setDefaults({autoescape: false});
    app.set('view engine', 'html');
    app.set('views', __dirname + '/server/views');
    //app.set('view cache', false);
    /*app.set('view engine', 'ejs');
    app.set('view options', {
        'open': '{{', 
        'close': '}}',
        'layout': false
    });*/
    /*app.register('.html', {
        compile: function(str, options) {
            return function(locals) {
                return str;
            }
        }
    });*/
    //app.set('view options', {layout: false});
    app.use(express.favicon(__dirname + '/web/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('nodeblog'));
    app.use(express.session({
        /*store: new RedisStore({
            host: settings.APP_HOST,
            port: settings.SESSION_PORT
        }),*/
        store: new MongoStore({
            db: settings.DB_NAME
            //, collection: ''
        }),
        secret: settings.SESSION_SECRET,
        cookie: {maxAge: maxAge}//30 days
    }));
    app.use(connectDomain());
    app.use(app.router);
    app.use('/upload/', express.static(settings.UPLOAD_DIR, {maxAge: maxAge}));
    //app.use(require('stylus').middleware(__dirname + '/web/'));
    //app.use(express.static(staticDir));
});

app.configure('development', function() {
    app.use(express.static(staticDir));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.set('view cache', false);
});

app.configure('production', function() {
    app.use(express.static(staticDir, {maxAge: maxAge}));
    app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function() {
    console.log("Application listening on port %s in %s mode, pid: %s.", app.get('port'), app.settings.env, process.pid);
});

routes(app);

// 404
app.use(function(req, res, next) {
    //res.send(404, 'Not found.');
    console.log(404);
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