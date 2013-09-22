require.config({
	urlArgs: '_t=' + (new Date()).getTime(), //for development
	baseUrl: '/js',
	paths: {
		'jquery': '../lib/jquery/jquery',
		//'ace': '../lib/ace',
        'marked': '../lib/marked/marked',
        'hljs': '../lib/highlight.js/highlight.pack',
        'underscore': '../lib/underscore/underscore',
        'text': '../lib/require/text',
		'utils': 'utils',
		'common': 'common',
		'themes': 'themes'
	},
	//waitSeconds: 15,
	shim: {
		'underscore': {
			'exports': '_'
		}
	}
});