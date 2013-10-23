/**
 * NodeJS blog.
 * @Author: <yangdemo@gmail.com>
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , domain = require('domain')
    , swig = require('swig')
    , filters = require('./server/utils/filters')
    , connectDomain = require('connect-domain')
    //, MongoStore = require('connect-mongo')(express)
    , RedisStore = require('connect-redis')(express)

    , staticDir = __dirname + '/web'
    , settings = require('./settings')
    , maxAge = settings.EXPIRES
    , routes = require('./server/routes');

var app = express();

//app.configure(function() {
app.set('port', process.env.PORT || settings.APP_PORT);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/server/views');
// app.set('view options', {layout: false});
swig.setFilter('split', filters.split);
swig.setFilter('length', filters.length);
swig.setFilter('genLink', filters.genLink);
swig.setFilter('countFormat', filters.countFormat);
app.use(express.favicon(__dirname + '/web/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.COOKIE_SECRET));
app.use(express.session({secret: settings.SESSION_SECRET})); // debug on win platform
app.use(express.session({
    store: new RedisStore({
        host: settings.APP_HOST,
        port: settings.SESSION_PORT,
        db: 1
    })
    , secret: settings.SESSION_SECRET
}));
app.use(express.csrf());
app.use(function(req, res, next) {
    res.locals.token = req.session._csrf;
    res.locals.env = app.settings.env;
    next();
});
app.use('/upload/', express.static(settings.UPLOAD_DIR, {maxAge: maxAge}));
//app.use(require('stylus').middleware(__dirname + '/web/'));
//app.use(express.static(staticDir));
app.use(app.router);
app.use(connectDomain());
//});

app.configure('development', function() {
    app.use(express.static(staticDir));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.static(staticDir, {maxAge: maxAge}));
    app.use(express.errorHandler());
    app.set('view cache', false);
    swig.setDefaults({ cache: false });
});

http.createServer(app).listen(app.get('port'), function() {
    console.log("Application listening on port %s in %s mode, pid: %s.", app.get('port'), app.settings.env, process.pid);
});

// 捕获异步回调的异常
app.use(function(req, res, next) {
    var d = domain.create();
    d.on('error', function(err) {
        logger(err);
        res.statusCode = 500;
        //res.json();
        res.send(500, 'Server error.');
        d.dispose();
    });

    d.add(req);
    d.add(res);
    d.run(next);
});

routes(app);

function on404(req, res, next) {
    console.log(404, req.url);
    res.render('404', {error: 'Page not found!'});
}

function logErrors(err, req, res, next) {
    console.error(500, err, err.stack);
    next(err);
}

function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
        res.send(500, {error: 'Server error while request by ajax.'});
    } else {
        next(err);
    }
}

function errorHandler(err, req, res, next) {
    console.error(err, err.status, err.stack);
    res.status(500);
    res.render('error', {error: err});
}

app.use(on404);
//app.use(logErrors);
//app.use(clientErrorHandler);
app.use(errorHandler);

process.on('uncaughtException', function(err) {
    console.log('uncaughtException err: %s, at %s', err, new Date());
});
