'use strict';

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        // pkg: grunt.file.readJSON('package.json'),
        path: {
            pub: 'web',
            dev: 'web/src',
            tmp: 'web/src/.tmp',
            build: 'web/build'
        },

        clean: {
            all: {
                src: ['<%= path.build %>/']
            },
            css: {
                src: ['<%= path.build %>/style/{,*/}*.{css,txt}']
            },
            fonts: {
                src: ['<%= path.build %>/style/fonts']
            },
            images: {
                src: ['<%= path.build %>/style/images']
            },
            js: {
                src: ['<%= path.build %>/js/']
            },
            tmp: {
                src: ['<%= path.tmp %>/']
            }
        },

        requirejs: {
            compile: {
                options: {
                    appDir: '<%= path.dev %>/js',
                    baseUrl: '../../',
                    dir: '<%= path.build %>/js',
                    optimize: 'uglify',
                    mainConfigFile: '<%= path.dev %>/main.js',
                    //locale: 'en-us',
                    modules: [
                        {
                            name: 'build/js/index'
                        },
                        {
                            name: 'build/js/post'
                        },
                        {
                            name: 'build/js/edit'/*,
                            exclude: ['src/js/ace/ace']*/
                        },
                        {
                            name: 'build/js/list'
                        },
                        {
                            name: 'build/js/user'
                        }
                    ],
                    logLevel: 0,
                    preserveLicenseComments: false,
                    findNestedDependencies: true,
                    fileExclusionRegExp: /^\./,
                    //inlineText: true,
                    useStrict: true
                }
            }
        },

        concat: {
            dist: {
                src: [
                    '<%= path.dev %>/style/icons.css',
                    '<%= path.dev %>/style/global.css',
                    '<%= path.dev %>/style/themes/solarized-dark.css',
                    '<%= path.dev %>/style/md.css'
                ],
                dest: '<%= path.tmp %>/tmp-all.css'
            }
        },

        cssmin: {
            options: {
                report: 'gzip'
            },
            combine: {
                files: {
                    '<%= path.tmp %>/style/index.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/index.css'],
                    '<%= path.tmp %>/style/post.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/post.css'],
                    '<%= path.tmp %>/style/edit.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/edit.css'],
                    '<%= path.tmp %>/style/list.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/list.css'],
                    '<%= path.tmp %>/style/user.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/user.css']
                }
            },
            minify: {
                expand: true,
                cwd: '<%= path.tmp %>/',
                src: [
                    'style/index.css',
                    'style/post.css',
                    'style/edit.css',
                    'style/list.css',
                    'style/user.css'
                ],
                dest: '<%= path.build %>/',
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
                        cwd: '<%= path.dev %>/style/images/',
                        src: ['**/*.{png,jpg,gif}'],
                        dest: '<%= path.build %>/style/images/'
                    }
                ]
            }
        },

        copy: {
            fonts: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= path.dev %>',
                    dest: '<%= path.build %>',
                    src: ['style/fonts/{,*/}*.*']
                }]
            }
        },

        'string-replace': {
            views: {
                files: {
                    'server/views/': 'server/views/*'
                },
                options: {
                    replacements: [
                        {
                            pattern: /\?_t=(\d{13})/g,
                            replacement: '?_t=' + Date.now()
                        }
                    ]
                }
            }
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commitMessage: 'Release v%VERSION%',
                // updateConfigs: ['pkg'],
                commitFiles: ['-a'],
                pushTo: 'origin'
            }
        }
    });

    grunt.registerTask('build-css', function() {
        grunt.task.run('clean:css');
        grunt.task.run('concat');
        grunt.task.run('cssmin');
        grunt.task.run('clean:tmp');
    });

    grunt.registerTask('build-js', function() {
        grunt.task.run('clean:js');
        grunt.task.run('requirejs');
    });

    grunt.registerTask('build-images', function() {
        grunt.task.run('clean:images');
        grunt.task.run('imagemin');
    });

    grunt.registerTask('build-fonts', function() {
        grunt.task.run('clean:fonts');
        grunt.task.run('copy');
    });

    grunt.registerTask('build', function(type) {
        if(!type) {
            grunt.task.run('default');
        } else {
            grunt.task.run('build-' + type);
        }
    });

    grunt.registerTask('default', function(buildJS) {
        grunt.task.run('bump-only');
        !!buildJS && grunt.task.run('build-js'); // Because there are too many javascript files
        grunt.task.run('build-css');
        grunt.task.run('build-images');
        grunt.task.run('build-fonts');
        grunt.task.run('string-replace');
        grunt.task.run('bump-commit');
    });
}
