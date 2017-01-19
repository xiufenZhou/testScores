/**
 * Created by xingyunzhi on 17/1/18.
 */

var async = require('async');
var ioredis = require('ioredis');

var redisClient;

function createRedisClient(){
    redisClient = new ioredis({
        "port": 6379,
        "host": "127.0.0.1"
    });

    redisClient.on('connect',function(){
        console.log("REDIS CONNECTED");
    });
    redisClient.on('ready',function(){
        console.log("REDIS READY");
    });
    redisClient.on('error',function(err){
        console.log("REDIS CONNECTION error "+ err);
    });
    redisClient.on('close',function(){
        console.log("REDIS CONNECTION CLOSE");
    });
    redisClient.on('reconnecting',function(){
        console.log("REDIS RECONNECTING");
    });
    redisClient.on('end',function(){
        console.log("REDIS CONNECTION END");
    });

}

createRedisClient();


//添加学生
exports.redisZAdd = function (key,score,uid,callback) {
    redisClient.zadd(key,score,uid,callback);
};

exports.redisZAddSets = function (sets,callback) {
    redisClient.zadd(sets,function (err,response) {
        callback(err,response);
    });
};
//根据score范围 获取用户id  score从小到大
exports.redisZRANGEBYSCORE = function (key,min,max,cb) {
    redisClient.zrangebyscore(key,min,max,function (err,data) {
        cb(err,data);
    });
};

//获取排行榜所有用户id,正序 需要reverse
exports.redisZRANGEBYSCOREALL = function (key,cb) {
    redisClient.zrangebyscore(key,'-inf','+inf',function (err,data) {
        cb(err,data);
    });
};

//获取排行和排行score返回前number名
exports.redisZRANGEWITHSCORES = function (key,number,cb) {
    redisClient.zrange(key,0,-1,'WITHSCORES',function (err,data) {
        var array = [];
        if(!err && !!data && data.length){
            data = data.reverse();

            if(number != 0){
                data = data.splice(0,number * 2);
            }

            for(var i = 0 ,j = 1; i < data.length; i += 2, j++){
                array.push({
                    id  :   data[i + 1],
                    value   :   parseInt(data[i]),
                    ranking :   j
                });
            }
        }
        cb(err,array);
    });
}


exports.redisZSCORE = function(key,uid,cb){
    redisClient.zscore(key,uid, function (err,data) {
        cb(err,data);
    });
}

function redisZCard (key,callback){
    redisClient.zcard(key, function (err,data) {
        callback(err,data);
    });
}

exports.redisZCard = redisZCard;

exports.redisZRank = function(key,field,callback){
    var ranking = -1;
    var length = 0;


    async.waterfall([
        function(cb){
            redisZCard(key,function(err,data){
                if(!err && !!data){
                    length = data;
                }
                cb(err);
            });
        },
        function(cb){
            if(length > 0){
                redisClient.zrank(key,field,function(err,data){
                    if(!err){
                        ranking = length - data;
                    }
                    cb(err);
                });
            } else {
                cb();
            }
        }
    ],function(err){
        callback(err,ranking);
    });
};

exports.redisHset = function(key,field,value,callback){
    redisClient.hset(key,field,JSON.stringify(value),callback);
};

exports.redisHGet = function(key,field,callback){
    redisClient.hget(key,field, function (err,data) {
        if(!err && !!data){
            data = JSON.parse(data);
        }
        callback(err,data);
    });
};

//array reply
exports.redisHMGet = function(key,fields,callback){
    redisClient.hmget(key,fields, function (err,data) {
        var array = [];
        if(!err && !!data && data.length){
            for(var i = 0 ; i < data.length; i++){
                array.push(JSON.parse(data[i]));
            }
        }
        callback(err,array);
    });
}
