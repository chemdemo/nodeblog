var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
	post_id: ObjectId,
	//parent_id: ObjectId,
	author_id: ObjectId,
	content: String,
	//replies: [],
	create: {type: Date, default: Date.now, index: true}
}, {collection: 'comment'});

mongoose.model('Comment', CommentSchema);