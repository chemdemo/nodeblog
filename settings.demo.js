var path = require('path');

// process.env.NODE_ENV = 'development';
// process.env.NODE_ENV = 'production';

module.exports = {
    APP_PORT: [PORT]
    , DB_HOST: [HOST]
    , DB_PORT: [DB_PORT]
    , DB_NAME: 'blog'
    , DB_USER: [DB_NAME]
    , DB_PASS: [DB_PASS]
    , EXPIRES: 1000 * 60 * 60 * 24 * 30 // 30 days
    , SESSION_PORT: [REDIS_PORT]
    , SESSION_SECRET: [SESSION_SECRET]
    , COOKIE_KEY: [COOKIE_KEY]
    , COOKIE_SECRET: [COOKIE_SECRET]
    
    // , UPLOAD_DIR: path.resolve(__dirname, [UPLOAD_DIR])

    , DEFAULT_USER_PASS: [DEFAULT_USER_PASS]
    , ADMIN: {
        EMAIL: [YOUT_EMAIL]
        , PASS: [YOUR_PASS]
        , NAMES: [nicks array as you like]
        , SITE: [SITE URL]
    }
    , DEFAULT_AVATAR: '/style/images/avatar.png'

    // social oauth is close now
    // , SOCIAL_AUTH_INFO: {
    //     APPID: [APPID]
    //     , API_KEY: [API_KEY]
    //     , SCRIPT_KEY: [SCRIPT_KEY]
    // }

    // pager limit
    , ITEM_PER_PAGE: 20

    // ajax return code
    , RCODES: {
        SUCCESS: 0
    }
}
