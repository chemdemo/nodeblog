'use strict';

require.config({
   baseUrl: '/js',
   paths: {
        jquery: '../lib/jquery/jquery',
        marked: '../lib/marked/marked',
        hljs: '../lib/highlight.js/highlight.pack',
		utils: './utils'
    }
	//, urlArgs: '_t=' + Date.now()// no cache
});

define(['jquery', 'marked', 'hljs', 'utils'], function($, marked, hljs, utils) {
	marked.setOptions({
		highlight: function (code, lang) {
			if(lang) {
				return hljs.highlight(lang, code).value;
			}
			return hljs.highlightAuto(code).value;
		},
		breaks: true,
		pedantic: true,
		sanitize: false,
		smartypants: true
	});

	function init() {
		;
	}

	$(init);
});