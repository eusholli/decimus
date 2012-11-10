
/**
 * Module dependencies.
 */
var express = require('express')
  , mongoose = require('mongoose')
  , mongodb = require('mongodb');

var util = require('util');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Model

var ObjectId = mongodb.BSONPure.ObjectID;
var Schema = mongoose.Schema;

var Donation = new Schema({
  content : String,
  date : Date
});

Donation.pre('save', function(next) {
  this.date = new Date();
  next();
});

mongoose.model('donation', Donation);

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/donation';
// console.log("mongoUri=" + mongoUri);
var db = mongoose.createConnection(mongoUri);
// var db = mongoose.createConnection('mongodb://localhost/donation');
var Donation = db.model('donation');

app.configure(function() {
  app.set('db', db);
});


// Routes

app.get('/donation', function(req, res) {
  console.log("index");
  Donation.find({}, function(err, data) {
    if(err) return next(err);
    res.render('index', { donations: data });
  });
});

app.get('/donation/list', function(req, res, next) {
  console.log("get donations");
  Donation.find({}, function(err, data) {
    if(err) return next(err);
    res.json(data);
  });
});

app.get('/donation/:id', function(req, res, next) {
  console.log("get donation : " + req.params.id);
  Donation.findById({ _id : ObjectId(req.params.id)}, function(err, data) {
    if(err) return next(err);
    res.json(data);
  });
});

app.post('/donation', function(req, res, next) {
  // console.log("req: %j", req);
  console.log("post donation : " + req.body.content);
  console.log("post donation : " + util.inspect(req));
  var donation = new Donation();
  donation.content = req.body.content;
  donation.save(function(err) {
    if(err) return next(err);
    res.json({ message : 'Success!'});
  });
});

app.put('/donation/:id', function(req, res, next) {
  console.log("put donation : " + req.params.id);
  Donation.update(
    { _id : ObjectId(req.params.id) }
    , { content : req.body.content, date : new Date() }
    , { upsert : false, multi : false }
    , function(err) {
      if(err) return next(err);
      res.json({ message : 'Success!'});
  });
});

app.del('/donation/:id', function(req, res, next) {
  console.log("delete donation : " + req.params.id);
  Donation.findById({ _id : ObjectId(req.params.id)}, function(err, data) {
    if(err) return next(err);
    data.remove(function(err) {
      console.log("donation remove!");
      res.json({ message : 'Success!'});
    });
  });
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
