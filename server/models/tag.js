var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TagSchema = new Schema({
	name: String,
	//description: String,
	postids: [ObjectId]
}, {collection: 'tag'});

mongoose.model('Tag', TagSchema);