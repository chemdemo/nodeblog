var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Comment = new Schema({
	post_id: ObjectId,
	parent_id: ObjectId,
	author_id: ObjectId,
	content: String,
	create: {type: Date, default: Date.now, index: true}
});

mongoose.model('Comment', Comment);