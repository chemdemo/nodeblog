var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var Tag = new Schema({
	name: String,
	posts: [ObjectId]
});

mongoose.model('Tag', Tag);