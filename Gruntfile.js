// see http://gibuloto.com/posts/99942-grunt-plus-requirejs-with-multi-page-website

module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			build: {
				src: ['web/build']
			},
			temp: {
				src: ['web/build-tmp']
			}
		},

		requirejs: {
			compile: {
				options: {
					appDir: './web/js/',
					baseUrl: '.',
					dir: './web/build/js',
					optimize: 'uglify',
					mainConfigFile: './web/js/config.js',
					modules: [
						{
							name: 'index'
						},
						{
							name: 'post'
						},
						/*{
							name: 'edit'
						},*/
						{
							name: 'list'
						},
						{
							name: 'user'
						}
					],
					logLevel: 0,
					preserveLicenseComments: false,
					findNestedDependencies: true,
					fileExclusionRegExp: /^\./,
					inlineText: true,
					useStrict: true
				}
			}
		},

		uglify: {
			options: {
				report: 'gzip',
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				files: {
					'web/build/js/require.min.js': ['web/lib/require/require.js']
				}
			}
		},

		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['web/style/icons.css','web/style/md.css','web/style/global.css'],
				dest: 'web/build-tmp/common.css'
			}
		},
		
		cssmin: {
			options: {
				report: 'gzip'
			},
			combine: {
				files: {
					'web/build-tmp/index.css': ['web/build-tmp/common.css', 'web/style/index.css'],
					'web/build-tmp/post.css': ['web/build-tmp/common.css', 'web/style/post.css'],
					'web/build-tmp/edit.css': ['web/build-tmp/common.css', 'web/style/edit.css'],
					'web/build-tmp/list.css': ['web/style/global.css', 'web/style/list.css'],
					'web/build-tmp/user.css': ['web/style/global.css', 'web/style/user.css']
				}
			},
			minify: {
				expand: true,
				cwd: 'web/build-tmp/',
				src: ['*.css', '!*.min.css'],
				dest: 'web/build/style',
				ext: '.min.css'
			}
		},

		imagemin: {
			options: {
				optimizationLevel: 3
			},
			dynamic: {
				files: [
					{
						expand: true,
						cwd: 'web/style/images/',
						src: ['**/*.{png,jpg,gif}'],
						dest: 'web/build/style/images/'
					}//,
					//{
						//expand: true,
						//cwd: 'web/covers/',
						//src: ['**/*.{png,jpg,gif}'],
						//dest: 'web/build/covers/'
					//}
				]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('mincss', ['concat', 'cssmin', 'clean:temp']);

	grunt.registerTask('default', ['clean:build', 'requirejs', 'uglify', 'mincss', 'imagemin']);
	//grunt.registerTask('dev', []);
}