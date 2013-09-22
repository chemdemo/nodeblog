var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	social_uid: {type: Number, unique: true}
	, meida_type: String
	, media_uid: String
	, name: String
	, avatar: String
	, site: String
	//, admin: {type: Boolean, default: false}
	, create_at: {type: Date, default: Date.now}
	, modify_at: {type: Date, default: Date.now}
}, {collection: 'social_user'});

mongoose.model('SocialUser', UserSchema);