var express = require('express');
var router = express.Router();
var redisModel = require('./redisModel');
var _ = require('underscore');
var async = require('async');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/save',function (req,res) {
    var uid = req.body.sID;
    var score = req.body.score;
    var name = req.body.name;
    var sex = req.body.sex;
    var grade = req.body.grade;
    var obj = {
        uid     :   uid,
        name    :   name,
        sex     :   sex,
        grade   :   grade,
        score   :   score
    };

    async.waterfall([
        function (cb) {
            redisModel.redisZAdd('stuRanking',score,uid,function (err) {
                cb(err);
            });
        },
        function (cb) {
            redisModel.redisHset('studentsInfo',uid,obj,function (err) {
                cb(err);
            });
        }
    ],function (err) {
        return res.send({status : 200});
    })

});

router.post('/getData',function (req,res) {
    var uidArr = [];
    var userInfo;
    async.waterfall([
        function (cb) {
            redisModel.redisZRANGEWITHSCORES('stuRanking',20,function (err,data) {
                if(!err && !!data){
                    data.forEach(function (item) {
                        uidArr.push(item.id);
                    });
                }
                cb(err);
            });
        },
        function (cb) {
            redisModel.redisHMGet('studentsInfo',uidArr,function (err,data) {
                if(!err && !!data){
                    userInfo = data;
                }
                cb(err);
            });
        }
    ],function (err) {
        return res.send({info : userInfo});
    });
});

module.exports = router;
