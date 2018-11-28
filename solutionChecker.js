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

/**
 * Deletes the solution
 * @param {guid} solutionID 
 */
function deleteSolution(solutionID) {
    var sql = 'delete from captchas where guid = ?';
    db.run(sql, [solutionID]);
}


/**
 * Obtains the solution of the captcha and
 * deletes it from the database.
 * Should not call this twice with the same solution id.
 * @param {guid} solutionID 
 */
function getSolution(solutionID) {
    var sql = 'select solution from captchas where guid = ?';
    return new Promise(function(resolve,reject){
        db.get(sql, [solutionID], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve(JSON.parse(result.solution));
                deleteSolution(solutionID);
            }
        })
    });

}


async function verify(solutionID, mouseClicks, mouseMovement){
    var solution = await getSolution(solutionID);
    return new Promise((resolve, reject)=>{
        if(!checkMouseClick(solution, mouseClicks)){
            reject("mouse click doesn't match");
        }
        if (!checkMouseAvoid(solution, mouseMovement)) {
            reject("Did not avoid obstacles");
        }
        if(!checkMouseMovement(mouseMovement)){
            reject("mouse movement is suspicious");
        }
        resolve("human");
    });
}

function checkProximity(c1, icon_coordinate) {
    if((c1[0] < icon_coordinate[0]) || (c1[0] > icon_coordinate[0]+pngSize)) {
        return false;
    }
    if((c1[1] < icon_coordinate[1]) || (c1[1] > icon_coordinate[1]+pngSize)) {
        return false;
    }
    return true;
}

function checkMouseAvoid(solutions, mouseMovement) {
    var avoidSolution = [];

    console.log('Mouse movement resolution: ' + mouseMovement.length);

    // Filter for avoid solution
    for (var i = 0; i < solutions.length; i++) {
        if (solutions[i][0] == 'AVOID') {
            avoidSolution.push(solutions[i][1]);
        }
    }

    console.log("Comparing mouse movement to icons which needs to be avoided");
    console.log("Coordinates to avoid:");
    console.log(avoidSolution);

    for (var i = 0; i < mouseMovement.length; i++) {
        for (var j = 0; j < avoidSolution.length; j++) {
            if (checkProximity(mouseMovement[i], avoidSolution[j])) {
                return false;
            }
        }
    }
    return true;
}

function checkMouseClick(solutions, mouseClicks){
    var solutionMouseClicks = [];

    // Filter for click solution
    for (var i = 0; i < solutions.length; i++) {
        if (solutions[i][0] == 'CLICK') {
            solutionMouseClicks.push(solutions[i][1]);
        }
    }

    console.log('Checking mouse clicks:');
    console.log(mouseClicks);
    console.log('compared to solution:');
    console.log(solutionMouseClicks);

    if(mouseClicks.length < solutionMouseClicks.length){
        return false;
    }

    for(var i = 0; i< solutionMouseClicks.length; i++){
        if (!checkProximity(mouseClicks[i], solutionMouseClicks[i])) {
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