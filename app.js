/**
 * Blog system build with Node.js
 * @Author: dmyang <yangdemo@gmail.com>
 */

var express = require('express');
var http = require('http');
var path = require('path');
var swig = require('swig');
var filters = require('./server/utils/filters');
var connectDomain = require('connect-domain');
var RedisStore = require('connect-redis')(express);

var staticDir = __dirname + '/web';
var settings = require('./settings');
var maxAge = settings.EXPIRES;
var routes = require('./server/routes');

var app = express();

// app.configure('development', function() {
//     app.use(express.static(staticDir));
// });

app.configure('production', function() {
    // app.use(express.static(staticDir, {maxAge: maxAge}));
    app.set('view cache', true);
});

app.enable('trust proxy');
app.set('port', process.env.PORT || settings.APP_PORT);
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/server/views');
swig.setFilter('split', filters.split);
swig.setFilter('length', filters.length);
swig.setFilter('genLink', filters.genLink);
swig.setFilter('countFormat', filters.countFormat);
swig.setFilter('toString', filters.toString);
app.use(express.favicon(__dirname + '/web/favicon.ico'));
app.use('/upload/', express.static(settings.UPLOAD_DIR, {maxAge: maxAge}));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.COOKIE_SECRET));
// debug on win platform
// app.use(express.session({secret: settings.SESSION_SECRET}));
app.use(express.session({
    store: new RedisStore({
        host: settings.SESSION_HOST,
        port: settings.SESSION_PORT
    }),
    secret: settings.COOKIE_SECRET
}));
app.use(express.csrf());
app.use(function(req, res, next) {
    res.locals.token = req.session ? req.session._csrf : '';
    res.locals.env = app.settings.env;
    next();
});
app.use(connectDomain());
app.use(app.router);

routes(app);

app.use(function(err, req, res, next) {
    var env = process.env.NODE_ENV || 'development';

    if(err.status === 404) return res.render('404');
    console.error('Error occurs(' + env + ' mode):\n', err.stack, '\nDate: ' + new Date());
    res.render('error', {error: err.message || 'Unknown error!'});
});

process.on('uncaughtException', function(err) {
    console.log('uncaughtException err: %s, at %s', err, new Date());
});

http.createServer(app).listen(app.get('port'), function() {
    console.log("Application listening on port %s in %s mode, pid: %s.", app.get('port'), app.settings.env, process.pid);
});
