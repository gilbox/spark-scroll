var gulp = require('gulp');
//var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(sourcemaps.init())
    .pipe(coffee())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./src/'))
});


gulp.task('watch', ['default'], function() {
  gulp.watch(['./src/*.coffee'], ['coffee']);
});

gulp.task('all', ['coffee']);

gulp.task('default', ['all']);
