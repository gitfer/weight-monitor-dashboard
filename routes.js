'use strict';

var express = require('express');
var router = express.Router();
var jsonfile = require('jsonfile');
var _ = require('lodash');
var file = './data.json'

// var obj = {
//   spreadsheets: [{
//     name: "test",
//     weights: [],
//   }]
// };

// jsonfile.writeFile(file, obj, {spaces: 2}, function(err) {
//   console.error(err)
// })

router.get('/', function(req, res, next) {
  var options = {
    order: [['createdAt', 'DESC']]
  };
  jsonfile.readFile(file, function(err, obj) {
    res.render('index', {
      weights: obj.spreadsheets[0].weights,
      spreadsheets: obj.spreadsheets
    });
  })
});

router.get('/create', function(req, res, next) {
  res.render('upsert');
});

router.get('/edit/:id', function(req, res, next) {
  // Find by id
   jsonfile.readFile(file, function(err, obj) {
    // console.dir('Reading json...', obj);
    if(err !== null){
      console.error('err', err);  
    }else{
      var weight = _.find(obj.spreadsheets[0].weights, weigth => weigth.id === req.id);
      if(!_.isNil(weight)){
        res.render('upsert', {
          weigth: weigth
        }); 
      }
    }
  });
});

router.get('/delete/:id', function(req, res, next) {
   jsonfile.readFile(file, function(err, obj) {
    console.log('Reading json...', JSON.stringify(obj.spreadsheets[0].weights));
    var weight = _.remove(obj.spreadsheets[0].weights, function(weigth){
      return weigth.id.toString() === req.params.id.toString();
    }); 
    console.log('Deleting weigth', weight);
      jsonfile.writeFile(file, obj, function (err) {
        console.error('err', err);
        res.redirect('/');
      }); 
  });
});

router.post('/upsert', function(req, res, next) {
  // req.body
  var newWeight = req.body;
   console.dir('newWeight', req.body);
  newWeight.id = Date.now();

   jsonfile.readFile(file, function(err, obj) {
    console.dir('Reading json...', obj);
    if(err !== null){
      console.error('err', err);  
    }else{
      obj.spreadsheets[0].weights.push(newWeight);
      jsonfile.writeFile(file, obj, function (err) {
        console.error(err);
        res.redirect('/');
      }); 
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
