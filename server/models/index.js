var settings = require('../../settings');
var exec = require('child_process').exec;
var mongoose = require('mongoose');
var dbURI = 'mongodb://' + settings.DB_HOST + ':' + settings.DB_PORT + '/' + settings.DB_NAME;
var connOpts = {
	db: {native_parser: true},
	server: {
		//auto_reconnect: true, // default is true
		poolSize: 50,
		socketOptions: {keepAlive: 10}
	},
	//replset: {rs_name: ''},
	user: settings.DB_USER,
	padd: settings.DB_PASS
};

// see http://stackoverflow.com/questions/11928151/mongoose-output-the-error-error-connection-closed
// "mongoose.connect() Is not accepting any callback functions"
/*mongoose.connect(dbURI, function(err) {
	if(!err) {
		console.log('Connect to MongoDb success!' + '\ndbURI: ' + dbURI);
	} else {
		console.error('Connect to MongoDb error.\ndbURI: '+dbURI+'.\nError message: ' + err.message);
		//process.exit(1);
		exec('mongod -f /etc/mongod.conf');
	}
});*/
var db = mongoose.connection;
db.on('error', function(err) {
	console.error('Error in MongoDb connection: ' + err);
	mongoose.disconnect();
});
db.on('connected', function() {
	console.log('Connect to MongoDb success.');
});
db.on('disconnected', function() {
	console.log('MongoDB disconnected!');
	mongoose.connect(dbURI, connOpts);
});
mongoose.connect(dbURI, connOpts);

require('./user');
require('./post');
require('./tag');
require('./comment');

exports.User = mongoose.model('User');
exports.Post = mongoose.model('Post');
exports.Tag = mongoose.model('Tag');
exports.Comment = mongoose.model('Comment');