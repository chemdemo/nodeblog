//see https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
//see http://ghosertblog.github.io/mdeditor/static/editor/scrollLink.js

'use strict';

require(['ace/ace', 'marked', 'hljs', 'utils'], function(ace, marked, hljs, utils) {
	var editor;
	var session;
	var previewBox;

	var render = function() {
		if(!previewBox) return;

		var val = editor.getValue();
		
		marked(val, function(err, content) {
			if(err) {
				return console.log('Marked file error: ', err);
			}
			//$(window.frames['preview'].document).find('body').html(content);
			previewBox.html(content);
		});
	};

	var bindEvents = (function() {
		function editorHandler(e) {
			var self = $(this);
			var cmd = self.attr('data-cmd');

			switch(cmd) {
				case 'export-md':
					;
					break;
			}
		}

		function importMarkdown(e) {
			console.log(e);
		}
		
		function onEditerChange(e) {
			if(!previewOpen) {
				return;
			}
			var timer = this.timer || null;
			clearTimeout(timer);
			this.timer = setTimeout(function() {
				console.log(e.data);
				render();
			}, 500);
		}

		function onCursorChange() {
			console.log('cursor change!');
			;
		}

		function syncScroll(e) {
			console.log('cursor: ', editor.selection.getCursor())

			if(!previewOpen) return;

			~util.debounce(function() {
				var H = previewBox[0].scrollHeight;
				var n = editor.getFirstVisibleRow();
				var l = editor.getSession().getLength();
				console.log('scrollTop: ', H*(n/l));
				previewBox.scrollTop(H*(n/l));
			}, 500, true)();
		}

		return function() {//moveCursorTo
			editor.on('change', onEditerChange);
			$('.editor-btn').on('click', editorHandler);
			$('#import-md').on('change', importMarkdown);
			//editor.session.on('changeScrollTop', syncScroll);
			editor.session.selection.on('changeCursor', syncScroll);
		}
	}());

	function init(editorNode, options) {
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

		if(!editorNode) throw 'A html node for editor requird.';

		editor = ace.edit(editorNode);
		session = editor.getSession();
		editor.setShowPrintMargin(false);
		editor.setHighlightActiveLine(false);
		editor.setShowPrintMargin(false);
		editor.setTheme('ace/theme/crimson_editor');
		session.setMode('ace/mode/markdown');

		previewBox = options.previewBox || null;

		bindEvents();
	}
	
});