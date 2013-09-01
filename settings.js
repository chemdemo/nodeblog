var path = require('path');

//process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';

module.exports = {
	NAME: 'node blog'
	, VERSION: '0.1.1'

	, DB_HOST: 'localhost'
	, DB_PORT: 27017
	, DB_PASS: ''
	, DB_NAME: 'nodeblog'
	, EXPIRES: 1000 * 60 * 60 * 24 * 30
	, SESSION_PORT: 6379
	, SESSION_SECRET: 'nodeblog@chemdemo$007'
	, APP_PORT: 3000
	, UPLOAD_DIR: path.resolve(__dirname, '/tmp')

	, DEFAULT_USER_PASS: 'pass@123'
	, ADMIN: {
		NAME: 'chemdemo'
		, EMAIL: 'yangdemo@gmail.com'
		, PASS: 'demo2007'
		, SITE: 'http://www.dmfee.com'
	}
	, DEFAULT_AVATAR: '/style/images/avatar.png'

	, ITEM_PER_PAGE: 20
	, RCODES: {
		SUCCESS: 0
		, AUTH_ERROR: 10000
		, PARAM_MISSING: 10001
		, PARAM_ILLEGAL: 10002
		, DB_ERROR: 10003
	}
}
