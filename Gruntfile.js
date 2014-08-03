'use strict';

var semver = require('semver');

// force reload
function requireUncached(module){
    delete require.cache[require.resolve(module)];
    return require(module);
};

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
            dist: 'web/dist',
            tmp: 'web/src/.tmp'
        },

        clean: {
            all: {
                src: ['<%= path.dist %>/']
            },
            css: {
                src: ['<%= path.dist %>/style/{,*/}*.{css,txt}']
            },
            fonts: {
                src: ['<%= path.dist %>/style/fonts']
            },
            images: {
                src: ['<%= path.dist %>/style/images']
            },
            js: {
                src: ['<%= path.dist %>/js/']
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
                    dir: '<%= path.dist %>/js',
                    optimize: 'uglify',
                    mainConfigFile: '<%= path.dev %>/main.js',
                    //locale: 'en-us',
			allowSourceOverwrites: true,
                    modules: [
                        {
                            name: 'dist/js/index'
                        },
                        {
                            name: 'dist/js/post'
                        },
                        {
                            name: 'dist/js/edit'/*,
                            exclude: ['src/js/ace/ace']*/
                        },
                        {
                            name: 'dist/js/list'
                        },
                        {
                            name: 'dist/js/user'
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
                    '<%= path.dev %>/style/themes/ice.css',
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
                    '<%= path.tmp %>/style/user.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/user.css'],
                    '<%= path.tmp %>/style/about.css': ['<%= path.tmp %>/tmp-all.css', '<%= path.dev %>/style/about.css'],
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
                    'style/user.css',
                    'style/about.css',
                ],
                dest: '<%= path.dist %>/',
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
                        dest: '<%= path.dist %>/style/images/'
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
                    dest: '<%= path.dist %>',
                    src: ['style/fonts/{,*/}*.*']
                }]
            }
        },

        'string-replace': {
            views: {
                files: {
                    // 'server/views/': 'server/views/*', // string-replace has bug
                    'server/views/index.html': 'server/views/index.html',
                    'server/views/info.html': 'server/views/info.html',
                    'server/views/layout.html': 'server/views/layout.html',
                    'server/views/list.html': 'server/views/list.html',
                    'server/views/login.html': 'server/views/login.html',
                    'server/views/post.html': 'server/views/post.html',
                    'server/views/about.html': 'server/views/about.html',
                    'server/views/signup.html': 'server/views/signup.html'
                },
                options: {
                    replacements: [
                        {
                            pattern: /_VER=([^\'\"]+)?/g,
                            // pattern: /(?:[\'|\"|\?])?_VER=([\d||A-a|.|-]*)(?:[\'|\"])?/g,n
                            // replacement: '_VER=' + requireUncached('./package.json').version
                            replacement: function(match, version) {
                                if(!semver.valid(version)) throw Error('version error!');
                                var nextVer = semver.inc(version, 'patch');
                                // can not get the src url of the file here
                                grunt.log.ok('Version bumped to ' + nextVer);
                                return '_VER=' + nextVer
                            }
                        }
                    ]
                }
            }
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['-a'],
                // updateConfigs: ['pkg'],
                tagMessage: 'Version %VERSION',
                createTag: true,
                push: true,
                pushTo: 'origin'
            }
        }
    });

    grunt.registerTask('dist-css', function() {
        grunt.task.run('clean:css');
        grunt.task.run('concat');
        grunt.task.run('cssmin');
        grunt.task.run('clean:tmp');
    });

    grunt.registerTask('dist-js', function() {
        grunt.task.run('clean:js');
        grunt.task.run('requirejs');
    });

    grunt.registerTask('dist-images', function() {
        grunt.task.run('clean:images');
        grunt.task.run('imagemin');
    });

    grunt.registerTask('dist-fonts', function() {
        grunt.task.run('clean:fonts');
        grunt.task.run('copy');
    });

    grunt.registerTask('dist', function(type) {
        if(!type) {
            grunt.task.run('default');
        } else {
            grunt.task.run('dist-' + type);
        }
    });

    grunt.registerTask('default', function(distJS) {
        grunt.task.run('bump-only');
        // Because there are too many javascript files in ace lib.
        !!distJS && grunt.task.run('dist-js');
        grunt.task.run('dist-css');
        grunt.task.run('dist-images');
        grunt.task.run('dist-fonts');
        grunt.task.run('bump-commit');
        grunt.task.run('string-replace');
    });
};
