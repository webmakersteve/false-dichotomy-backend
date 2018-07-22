const { loadConfig } = require('./lib/config/loader');

const { putDatabaseSchema } = require('./tasks/db');
const { putElasticTemplates } = require('./tasks/elastic');

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

  grunt.registerTask('db:migrate', 'Initialize the Postgres and other databases', function runDbMigrations(configFile) {
    const config = loadConfig({
      environment: process.env.NODE_ENV || 'build',
      logging: {
        verbosity: 'fatal',
      },
    }, configFile);

    const done = this.async();

    putDatabaseSchema(config, done);
  });

  grunt.registerTask('es:templates', 'Put elasticsearch templates', function runPutElasticTemplates(configFile) {
    const config = loadConfig({
      environment: process.env.NODE_ENV || 'build',
      logging: {
        verbosity: 'fatal',
      },
    }, configFile);

    const done = this.async();

    putElasticTemplates(config, done);
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['eslint', 'test']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('lint', ['eslint']);
};
