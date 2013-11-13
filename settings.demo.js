var path = require('path');

//process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';

module.exports = {
    NAME: '[NAME]'
    , VERSION: '0.1.1'

    , DB_HOST: '[DB_HOST]'
    , DB_PORT: ['DB_PORT']// default 27017
    , DB_NAME: '[DB_NAME]'
    , DB_USER: '[DB_USER]'
    , DB_PASS: '[DB_PASS]'
    , EXPIRES: 1000 * 60 * 60 * 24 * 30 // 30 days
    , SESSION_PORT: [SESSION_PORT]
    , SESSION_SECRET: '[SESSION_SECRET]'
    , APP_PORT: [APP_PORT]
    , UPLOAD_DIR: path.resolve(__dirname, '/tmp')

    , DEFAULT_USER_PASS: '[DEFAULT_USER_PASS]'
    , ADMIN: {
        NAME: '[ADMIN_NAME]'
        , EMAIL: '[ADMIN_EMAIL]'
        , PASS: '[ADMIN_PASSWORD]'
        , SITE: '[YOUR_SITE]'
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
