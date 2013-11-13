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
            exports: 'hljs'
        }
    }
});
