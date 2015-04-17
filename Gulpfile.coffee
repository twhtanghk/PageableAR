gulp = require 'gulp'
sass = require 'gulp-sass'
browserify = require 'browserify'
source = require 'vinyl-source-stream'
coffee = require 'gulp-coffee'
gutil = require 'gulp-util'

paths = sass: ['./scss/**/*.scss']

gulp.task 'default', ['coffee']

gulp.task 'coffee', ->
  browserify(entries: ['./test/index.coffee'])
    .transform('coffeeify')
    .transform('debowerify')
    .bundle()
    .pipe(source('./test/index.js'))
    .pipe(gulp.dest('./'))
    
  gulp.src('./model.coffee')
  	.pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./'))
  