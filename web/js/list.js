'use strict';

require.config({
    paths: {
        jquery: '../libs/jquery/jquery',
        utils: './utils'
    }
	//, urlArgs: '_t=' + Date.now()// no cache
});

define(['jquery', 'utils'], function($, utils) {
	;
});