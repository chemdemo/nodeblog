'use strict';

define('themes', function(require, exports, module) {
    /*var files = ['arta', 'ascetic', 'brown_paper', 'dark', 'default', 'docco', 'far',
        'foundation', 'github', 'googlecode', 'idea', 'ir_black', 'magula', 'mono-blue',
        'monokai', 'monokai_sublime', 'obsidian', 'pojoaque', 'railscasts', 'rainbow',
        'school_book', 'solarized_dark', 'solarized_light', 'sunburst', 'tomorrow',
        'tomorrow-night', 'tomorrow-night-blue', 'tomorrow-night-bright',
        'tomorrow-night-eighties', 'vs', 'xcode', 'zenburn'];*/
    var files = ['github', 'monokai', 'obsidian', 'paraiso-light', 'solarized-dark',
        'solarized-light', 'tomorrow-night', 'zenburnesque'];
    var html = '';

    files.forEach(function(f, i) {
        html += '<option value="/src/style/themes/'+f+'.css">' + f + '</option>';
    });

    function init() {
        var select = $('<select>');

        select
            .append(html)
            .appendTo($('body'))
            .css({position: 'fixed', top: '60px', 'z-index': 100})
            .on('change', function(e) {
                $('#code-theme').attr('href', $(this).val());
            });
    }

    exports.init = init;
});
