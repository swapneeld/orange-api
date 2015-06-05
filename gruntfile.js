"use strict";
module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-mocha-test');

    // clean up code and run tests
    grunt.registerTask('default', ['jshint', 'jsbeautifier', 'mochaTest']);

    // generate documentation locally
    grunt.registerTask('docs', ['exec:docs']);
    // generate documentation and push it to github
    grunt.registerTask('docs:push', ['docs', 'gh-pages']);

    grunt.initConfig({
        // detect code smells
        jshint: {
            files: ['./lib/*.js', './test/*.js', './test/**/*.js', 'gruntfile.js', 'package.json', 'app.js'],
            options: {
                browser: true,
                curly: false,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: false,
                boss: true,
                eqnull: true,
                node: true,
                expr: true,
                globals: {
                    'xit': true,
                    'xdescribe': true,
                    'it': true,
                    'describe': true,
                    'before': true,
                    'beforeEach': true,
                    'after': true,
                    'afterEach': true,
                    'done': true
                }
            }
        },

        // beautify all javascript to conform with jsbeautifier's style guide
        jsbeautifier: {
            files: ['Gruntfile.js', 'app.js', 'lib/*.js', 'test/**/*.js'],
            options: {
                config: '.jsbeautifyrc'
            }
        },

        // run tests: make sure to close all express/db/sinon/etc connections or this
        // will hang
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    timeout: '10000'
                },
                src: ['test/*.js', 'test/**/*.js']
            },
        },

        // build documentation locally: latest version of aglio doesn't play well with grunt-aglio
        // so we use a shell script instead
        exec: {
            docs: {
                cwd: 'docs',
                cmd: './build.sh'
            }
        },

        // push generated documentation straight to gh pages (with fixed commit message, but that's not
        // the end of the world)
        'gh-pages': {
            options: {
                base: 'docs/output',
                message: 'Documentation updates (gh-pages commit message autogenerated by grunt)'
            },
            src: ['**']
        }
    });
};
