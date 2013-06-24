define(['lib/ace/ace', 'lib/pagedown/Markdown.Converter'], function(ace) {
	var editor = ace.edit('post-editor');
	editor.setShowPrintMargin(false);
	editor.setTheme('lib/ace/theme/github');
	editor.getSession().setMode("lib/ace/mode/markdown");
});