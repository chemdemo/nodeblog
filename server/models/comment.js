var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Comment = new Schema({
	//postid: ObjectId,
	comment_id: ObjectId,
	author: String,
	email: String,
	avatar: String,
	site: String,
	content: String,
	create: {type: Date, default: Date.now, index: true},
	parent_id: {type: ObjectId, default: null}
});

mongoose.model('Comment', Comment);