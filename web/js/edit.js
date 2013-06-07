// see http://ghosertblog.github.io/mdeditor/
onload = function() {
	var flag = 0;
	var lineCtrl = document.querySelector('#ctrl-line');
	var editorBox = document.querySelector('#editor-box');
	var previewBox = document.querySelector('#preview-box');
	var bodyWidth = document.body.clientWidth;
	var editor = ace.edit('editor-box');
	var converter = new Markdown.Converter();

	var updateRrew = function() {
		var val = editor.getValue();
		$('#preview-box .box-inner').html(markdown.toHTML(val));
		//$('#preview-box .box-inner').html(converter.makeHtml(val));

		$('#preview-box code').each(function(i, tag) {
			var code = $(tag).text();console.log(code);
			var parser = new JavascriptParser();
			parser.parse(code/*.replace(/\r/g, '')*/);
			tag.style.display = 'none';
			var ol = document.createElement('ol');
			ol.className = 'hibot';
			ol.innerHTML = parser.result.toString();

			//tag.parentNode.insertBefore(ol, tag);
			$(tag.parentNode).replaceWith($('<pre>').append(ol));
		});
	};

	/*converter.hooks.chain('preConversion', function(t) {
		return t + '\nettttttttttttttttttttttttttttt';
	});*/

	document.body.addEventListener('mousedown', function(e) {
		flag = false;
		flag = e.target === lineCtrl;
	});
	document.body.addEventListener('mouseup', function(e) {
		flag = false;
	});
	document.body.addEventListener('mousemove', function(e) {
		if(flag) {
			var x = e.clientX;console.log(x)
			lineCtrl.style.left = x + 'px';
			editorBox.style.width = x + 'px';
			previewBox.style.width = bodyWidth - x + 'px';
			editor.resize();
		}
	});

	editor.setShowPrintMargin(false);
	editor.getSession().on('change', updateRrew);
	editor.setTheme('ace/theme/chrome');
	editor.getSession().setMode('ace/mode/markdown');

	//editor.getValue() && updateRrew();
	$.get('./markdown.md', function(r) {
		editor.setValue(r);
		updateRrew();
	});
}