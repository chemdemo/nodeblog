'use strict';

define(function(require, exports, module) {
	var themes = require('themes');
	var marked = require('libs/marked/marked');
	var hljs = require('libs/highlight.js/highlight.pack');

	marked.setOptions({
		gfm: true,
		highlight: function (code, lang) {
			if(lang) {
				return hljs.highlight(lang, code).value;
			}
			return hljs.highlightAuto(code).value;
		},
		tables: true,
		breaks: true,
		pedantic: true,
		sanitize: false,
		smartLists: true,
		smartypants: true,
		langPrefix: 'lang-'
	});

	var bindEvents = (function() {
		return function() {
			;
		}
	}());

	~function init() {
		bindEvents();
	}();
});