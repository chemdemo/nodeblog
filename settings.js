module.exports = {
	NAME: 'node blog'
	, DB_HOST: 'localhost'
	, DB_PORT: 27017
	, DB_NAME: 'nodeblog'
	, SESSION_SECRET: 'nodeblog'
	, APP_PORT: 3000
	, DEFAULT_PASS: 'pass@123'
	, ADMIN: {
		NAME: 'chemdemo'
		, EMAIL: 'yangdemo@gmail.com'
		, PASS: 'CHEMdm007'
		, SITE: 'http://www.dmfee.com'
	}
	, DEFAULT_AVATAR: '/style/images/avatar.png'

	, RCODES: {
		SUCCESS: 0
		, PARAM_MISSING: 10001
		, PARAM_ILLEGAL: 10002
		, DB_ERROR: 10003
	}
}