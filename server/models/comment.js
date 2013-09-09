var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
	post_id: {type: ObjectId, index: true}
	, author_id: ObjectId
	, reply_id: ObjectId
	, at_user_id: ObjectId
	, content: String
	, create_at: {type: Date, default: Date.now/*, index: true*/}
}, {collection: 'comment'});

mongoose.model('Comment', CommentSchema);