var gulp = require('gulp');
var zip = require('gulp-zip');
var del = require('del');
var install = require('gulp-install');
var runSequence = require('run-sequence');
var awsLambda = require("node-aws-lambda");
var mocha = require('gulp-mocha');

gulp.task('clean', function() {
  return del(['./dist', './dist.zip']);
});

gulp.task('src', function() {
  return gulp.src('src/**/*.js')
    .pipe(gulp.dest('dist/'));
});

gulp.task('src-test', function() {
  return gulp.src('test/**/*.js')
    .pipe(gulp.dest('dist/test/'));
});

gulp.task('node-mods', function() {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist/'))
    .pipe(install({production: true}));
});

gulp.task('test', function() {
  return gulp.src(['test/test-*.js'], { read: false })
    .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('zip', function() {
  return gulp.src(['dist/**/*', '!dist/package.json', '!dist/{test,test/**}'])
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('upload', function(callback) {
  awsLambda.deploy('./dist.zip', require("./lambda-config.js"), callback);
});

gulp.task('deploy', function(callback) {
  return runSequence(
    ['clean'],
    ['src', 'src-test', 'node-mods'],
    ['test'],
    ['zip'],
    ['upload'],
    callback
  );
});
