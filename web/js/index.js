'use strict';

require(['jquery', 'marked', 'hljs', 'utils'], function($, marked, hljs, utils) {
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