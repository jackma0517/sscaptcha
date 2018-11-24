// Solution:
//     [
//      {'action', (coordinates)},
//      {'action', (coordinates)},
//      {'action', (coordinates)}
//     ]

// Db Access
var sqlite3 = require('sqlite3').verbose()
require('dotenv').config({path:'./.env'})
var db = new sqlite3.Database(process.env.SQLITE_DB)


const pngSize = 100;

function getSolution(solutionID){
    var sql = 'select solution from captchas where guid = ?';

    return new Promise(function(resolve,reject){
        db.get(sql, [solutionID], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve(JSON.parse(result.solution));
            }
        })
    });

}


async function verify(solutionID, mouseClicks, mouseMovement){
    var solution = await getSolution(solutionID);
    return new Promise((resolve, reject)=>{
        if(!checkMouseClick(solution,mouseClicks)){
            reject("mouse click doesn't match");
        }
        if(!checkMouseMovement(mouseMovement)){
            reject("mouse movement is suspicious");
        }
        resolve("human");
    });

}

function checkMouseClick(solutionArray, mouseClicks){

    if(mouseClicks.length < solutionArray.length){
        return false;
    }

    for(var i = 0; i< solutionArray.length; i++){
        var coordinates = solutionArray[i][1];
        var click = mouseClicks[i];
        console.log(i+ ":");
        console.log(coordinates);
        console.log(click);
        if(click[0] < coordinates[0] || click[0] > coordinates[0]+pngSize){
            return false;
        }

        if(click[1] < coordinates[1] || click[1] > coordinates[1]+pngSize){
          return false;
        }
    }

    return true;
}


function checkMouseMovement(mouseMovement){

    return true;
}

module.exports = {
    verify: verify
}