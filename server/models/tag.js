var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TagSchema = new Schema({
	name: {type: String, unique: true},
	//description: String,
	postids: [ObjectId]
}, {collection: 'tag'});

mongoose.model('Tag', TagSchema);