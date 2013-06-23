define(['lib/ace/ace', 'lib/pagedown/Markdown.Converter'], function(ace) {
	var editor = ace.edit('post-editor');
	editor.setTheme('lib/ace/theme/chrome');
	editor.getSession().setMode("lib/ace/mode/markdown");
});