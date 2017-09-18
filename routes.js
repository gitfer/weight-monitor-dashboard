'use strict';

var express = require('express');
var router = express.Router();
var jsonfile = require('jsonfile');
var _ = require('lodash');
var file = process.env.WEIGHTFILE || 'data.json';

router.get('/', function(req, res, next) {
  jsonfile.readFile(file, function(err, obj) {
    console.log('Filename: ', file, ' Content', obj);
    if(obj === undefined){
       var newObj = { spreadsheets:[{name:"test",weights:[]}]};
       jsonfile.writeFile(file, newObj, function (err) {
          console.error('err', err);
          res.redirect('/');
        }); 
    }else{
      res.render('index', {
        weights: obj.spreadsheets[0].weights,
        spreadsheets: obj.spreadsheets
      }); 
    }
  })
});

router.get('/download', function(req, res){
  var filePath = __dirname + '/' + file;
  res.download(filePath); // Set disposition and send it.
});

router.get('/create', function(req, res, next) {
  res.render('upsert');
});

router.get('/edit/:id', function(req, res, next) {
  // Find by id
   jsonfile.readFile(file, function(err, obj) {
    console.log('Reading json for edit...', obj);
    if(err !== null){
      console.error('err', err);  
    }else{
      console.log('Found json for edit...', obj);
      var weight = _.find(obj.spreadsheets[0].weights, function(weight){
      return weight.id.toString() === req.params.id.toString();
    });
      if(!_.isNil(weight)){
        res.render('upsert', {
          weight: weight
        }); 
      }
    }
  });
});

router.get('/delete/:id', function(req, res, next) {
   jsonfile.readFile(file, function(err, obj) {
    console.log('Reading json...', JSON.stringify(obj.spreadsheets[0].weights));
    var weight = _.remove(obj.spreadsheets[0].weights, function(weight){
      return weight.id.toString() === req.params.id.toString();
    }); 
    console.log('Deleting weight', weight);
      jsonfile.writeFile(file, obj, function (err) {
        console.error('err', err);
        res.redirect('/');
      }); 
  });
});

router.post('/upsert', function(req, res, next) {
  // req.body
  var newWeight = req.body;
  console.log('Edit or create', newWeight);
  jsonfile.readFile(file, function(err, obj) {
    if(newWeight.id){
      var editWeight = _.find(obj.spreadsheets[0].weights, function(weight){
        return weight.id.toString() === newWeight.id.toString();
      });
      _.remove(obj.spreadsheets[0].weights, editWeight);
      obj.spreadsheets[0].weights.push(newWeight);
      jsonfile.writeFile(file, obj, function (err) {
        console.error(err);
        res.redirect('/');
      }); 
    }else{
      newWeight.id = Date.now();
       console.log('newWeight', newWeight);
        console.log('Reading json...', obj);
        if(err !== null){
          console.error('err', err);  
        }else{
          obj.spreadsheets[0].weights.push(newWeight);
          jsonfile.writeFile(file, obj, function (err) {
            console.error(err);
            res.redirect('/');
          }); 
        }
    }
  }); 
});

// Route for creating spreadsheet.

var SheetsHelper = require('./sheets');

router.post('/spreadsheets', function(req, res, next) {
  var auth = req.get('Authorization');
  if (!auth) {
    return next(Error('Authorization required.'));
  }
  var accessToken = auth.split(' ')[1];
  var helper = new SheetsHelper(accessToken);
  var title = 'Weights (' + new Date().toLocaleTimeString() + ')';
  helper.createSpreadsheet(title, function(err, spreadsheet) {
    if (err) {
      return next(err);
    }
    var model = {
      id: spreadsheet.spreadsheetId,
      sheetId: spreadsheet.sheets[0].properties.sheetId,
      name: spreadsheet.properties.title
    };
    

      return res.json(model);
  });
});

// Route for syncing spreadsheet.
// router.post('/spreadsheets/:id/sync', function(req, res, next) {
//   var auth = req.get('Authorization');
//   if (!auth) {
//     return next(Error('Authorization required.'));
//   }
//   var accessToken = auth.split(' ')[1];
//   var helper = new SheetsHelper(accessToken);
//   Sequelize.Promise.all([
//     models.Spreadsheet.findById(req.params.id),
//     models.Order.findAll()
//   ]).then(function(results) {
//     var spreadsheet = results[0];
//     var orders = results[1];
//     helper.sync(spreadsheet.id, spreadsheet.sheetId, orders, function(err) {
//       if (err) {
//         return next(err);
//       }
//       return res.json(orders.length);
//     });
//   });
// });

module.exports = router;
