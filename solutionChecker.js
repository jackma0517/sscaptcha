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
        else if (!checkMouseAvoidHover(solution, mouseMovement)) {
            reject("Missed an avoid/hover command");
        }
        else if(!checkMouseMovement(mouseMovement)){
            reject("mouse movement is suspicious");
        }
        resolve("human");
    });
}

function checkProximity(c1, icon_coordinate, icon_size, error_threshold) {
    if((c1[0] < (icon_coordinate[0] - error_threshold)) || (c1[0] > (icon_coordinate[0] + icon_size + error_threshold))) {
        return false;
    }
    if((c1[1] < (icon_coordinate[1] - error_threshold)) || (c1[1] > (icon_coordinate[1] + icon_size + error_threshold))) {
        return false;
    }
    return true;
}

function checkMouseAvoidHover(solutions, mouseMovement) {
    var avoidSolution = [];
    var hoverSolution = [];

    //console.log('Mouse movement resolution: ' + mouseMovement.length);

    // Filter solutions
    for (var i = 0; i < solutions.length; i++) {
        if (solutions[i][0] == 'AVOID') {
            avoidSolution.push(solutions[i][1]);
        }
        if (solutions[i][0] == 'HOVER') {
            hoverSolution.push(solutions[i][1]);
        }
    }

    for (var i = 0; i < mouseMovement.length; i++) {
        if (avoidSolution.length > 0) {
            for (var j = 0; j < avoidSolution.length; j++) {
                if (checkProximity(mouseMovement[i], avoidSolution[j], pngSize, 0)) {
                    //console.log('Did not avoid ' + avoidSolution[j])
                    return false;
                }
            }
        }
        if (hoverSolution.length > 0) {
            for (var k = 0; k < hoverSolution.length; k++) {
                if (checkProximity(mouseMovement[i], hoverSolution[k], pngSize, 0)) {
                    // console.log('Hover over :'  + hoverSolution[k]);
                    // If we hovered over it, then remove it from the list
                    hoverSolution.splice(k, 1);
                }
            }
        }
    }
    
    if (hoverSolution.length > 0) {
        // There are things we didn't hover over,
        // fail the test
        // console.log('Missed hover over:');
        // console.log(hoverSolution);
        return false;
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

    // console.log('Checking mouse clicks:');
    // console.log(mouseClicks);
    // console.log('compared to solution:');
    // console.log(solutionMouseClicks);

    if(mouseClicks.length < solutionMouseClicks.length){
        return false;
    }

    for(var i = 0; i< solutionMouseClicks.length; i++){
        if (!checkProximity(mouseClicks[i], solutionMouseClicks[i], pngSize, pngSize*0.2)) {
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