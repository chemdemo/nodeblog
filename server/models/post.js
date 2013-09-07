var settings = require('../../settings');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PostSchema = new Schema({
	title: {type: String, unique: true},
	create_at: {type: Date, default: Date.now, index: true},
	update_at: {type: Date, default: Date.now},
	author_id: ObjectId,
	content: String,
	cover: String,
	summary: String,
	tags: [String],
	comments: {type: Number, default: 0},
	visite: {type: Number, default: 0},
	topped: {type: Number, default: 0},
	last_comment_at: {type: Date},
	last_comment_by: ObjectId
}, {collection: 'post'});

PostSchema.index({create_at: 1});

PostSchema.methods.setSummary = function(text) {
	this.summary = text || this.content.substring(0, 200);
}

mongoose.model('Post', PostSchema);