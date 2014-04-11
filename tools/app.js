var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');

app.use(bodyParser({uploadDir:'./upload'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
app.use(methodOverride());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(errorHandler());
}

require('./router')(app);

app.listen(3000, "127.0.0.1");
