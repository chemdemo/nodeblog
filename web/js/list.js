'use strict';

require(['jquery'/*, 'utils'*/], function($/*, utils*/) {
	$('.post-delete').on('click', function(e) {
		var self = $(e.target);
		var pid = self.attr('data-pid');

		if(pid) {
			$.ajax({
				url: '/post/delete/' + pid,
				method: 'delete',
				data: {postid: pid, _csrf: $('#csrf').val()},
				success: function(r) {
					if(r.rcode === 0) {
						self.parent().parent().remove();
					} else {
						console.log('Remove post error: ', r);
					}
				}
			});
		}
	});
});