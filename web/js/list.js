'use strict';

require.config({
    paths: {
        jquery: '../lib/jquery/jquery',
        utils: './utils'
    }
	//, urlArgs: '_t=' + Date.now()// no cache
});

define(['jquery', 'utils'], function($, utils) {
	;
});