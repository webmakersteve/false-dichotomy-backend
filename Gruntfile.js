module.exports = (grunt) => {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc.json',
      },
      target: ['**/*.js', '!node_modules/**', '!test/**'],
    },

    mochaTest: {
      test: {
        options: { ui: 'bdd' },
        src: 'test/**/*.spec.js',
      },
    },

    watch: {
      files: ['**/*.js', '!node_modules/**', '!rpmbuild/**'],
      tasks: ['eslint', 'test'],
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['eslint', 'test']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('lint', ['eslint']);
};
