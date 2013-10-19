require.config({
	waitSeconds: 0,
    packages: [
        {
            name: 'ace',
            location: 'src/js/ace',
            main: 'ace'
        },
        {
            name: 'tmpl',
            location: 'tmpl',
            main: 'tmpl'
        }
    ],
    paths: {
        'jquery': 'src/bower-libs/jquery/jquery',
        'marked': 'src/bower-libs/marked/lib/marked',
        //'mode/markdown': 'ace/mode/markdown',
        //'theme/crimson_editor': 'ace/theme/crimson_editor',
        'hljs': 'src/bower-libs/highlightjs/highlight.pack',
        'underscore': 'src/bower-libs/underscore/underscore',
        'text': 'src/bower-libs/requirejs-text/text',
        'utils': 'src/js/utils',
        'common': 'src/js/common',
        'themes': 'src/js/themes'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        hljs: {
            'hljs': 'hljs'
        }
    }
});