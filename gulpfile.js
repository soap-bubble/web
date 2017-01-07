var gulp = require('gulp');
var babel = require('gulp-babel');
var nodemon = require('gulp-nodemon');
var webpackConfig = require('./webpack.config');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var Server = require('karma').Server;

var watch = false;
var src = {};


gulp.task('webpack:client', (cb) => {
  const webpack_watch = spawn('./node_modules/.bin/webpack', ['--color']);

  webpack_watch.stdout.on('data', (data) => {
    console.log(`webpack: ${data}`);
  });

  webpack_watch.stderr.on('data', (data) => {
    console.error(`webpack: ${data}`);
  });

  webpack_watch.on('close', (code) => {
    console.log(`webpack exited with code ${code}`);
    cb();
  });
});



gulp.task('webpack:client:watch', (cb) => {
  const webpack_watch = spawn('./node_modules/.bin/webpack', ['--watch', '--devtool=source-map', '--color']);

  webpack_watch.stdout.on('data', (data) => {
    console.log(`webpack: ${data}`);
  });

  webpack_watch.stderr.on('data', (data) => {
    console.error(`webpack: ${data}`);
  });

  webpack_watch.on('close', (code) => {
    console.log(`webpack exited with code ${code}`);
    cb();
  });
});

gulp.task('copy:html', function () {
  src.html = './client/html/**/*.html';
  return gulp.src(src.html, { base: './client/html/' })
    .pipe(gulp.dest('./public'))
});

gulp.task('copy:css', function () {
  src.css = './client/css/**/*.css';
  return gulp.src(src.css, { base: './client/css/' })
    .pipe(gulp.dest('./public'))
});

gulp.task('copy:html:watch', ['copy:html'], function () {
  return gulp.watch(src.html, function(obj){
    if( obj.type === 'changed') {
      gulp.src( obj.path, { "base": "./client/html/"})
        .pipe(gulp.dest('./public'));
    }
  })
});

gulp.task('copy:css:watch', ['copy:css'], function () {
  return gulp.watch(src.css, function(obj){
    if( obj.type === 'changed') {
      gulp.src( obj.path, { "base": "./client/css/"})
        .pipe(gulp.dest('./public'));
    }
  })
});

gulp.task('build:server', () => {
	return gulp.src('server/**/*.js')
		.pipe(babel())
		.pipe(gulp.dest('lib'));
});

gulp.task('build:server:watch', () => {
	return gulp.watch('server/**/*.js')
		.pipe(babel())
		.pipe(gulp.dest('lib'));
});

// Launch a lightweight HTTP Server
gulp.task('serve',
['build:server'],
function () {
  return nodemon({
    script: 'lib/index.js', // run ES5 code
    watch: 'server', // watch ES2015 code
    tasks: ['build:server'] // compile synchronously onChange
  })
});

/**
 * Run test once and exit
 */
gulp.task('test:client', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('test:client:watch', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js'
  }, done).start();
});

gulp.task('build:client',['copy:html', 'copy:css', 'webpack:client']);
gulp.task('build:client:watch', ['copy:html:watch', 'copy:css:watch', 'webpack:client:watch']);
gulp.task('serve:dev', ['copy:html:watch', 'copy:css:watch', 'webpack:client:watch', 'serve']);