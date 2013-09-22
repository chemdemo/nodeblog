'use strict';

define('common', function(require, exports, module) {
	function bindEvents() {
		$('#icon-search').on('click', function(e) {
			if($('#search-text').val()) $(this).parent().parent().submit();
		});

		$('#about-author').on('click', function(e) {
			var infoBox = $(this).parent().find('.author-info');
			infoBox.slideToggle();
		});
	}

	function init() {
		bindEvents();
	}

	exports.init = init;
});