var settings = require('../../settings');
var mongoose = require('mongoose');
var db_url = 'mongodb://' + settings.DB_HOST + ':' + settings.DB_PORT + '/' + settings.DB_NAME;

// see http://stackoverflow.com/questions/11928151/mongoose-output-the-error-error-connection-closed
// "mongoose.connect() Is not accepting any callback functions"
/*mongoose.connect(db_url, function(err) {
	if(!err) {
		console.log('Connect to db success!' + '\ndb_url: ' + db_url);
	} else {
		console.error('Connect to db error.\ndb_url: '+db_url+'.\nError message: ' + err.message);
	}
});*/
mongoose.connect(db_url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connect to db error: '));
db.once('open', function() {
	console.log('Connect to db success.\ndb_url:', db_url);
});

require('./user');
require('./post');
require('./tag');
require('./comment');

exports.User = mongoose.model('User');
exports.Post = mongoose.model('Post');
exports.Tag = mongoose.model('Tag');
exports.Comment = mongoose.model('Comment');