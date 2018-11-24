// Solution:
//     [
//      {'action', (coordinates)},
//      {'action', (coordinates)},
//      {'action', (coordinates)}
//     ]
const pngSize = 200;



function checkMouseClick(solution, mouseClicks){
    return new Promise(function(resolve,reject){
        for(var i = 0; i< solution.length; i++){
            if(!(mouseClicks[i][0]>solution[i][1][0] && mouseClicks[i][0]<solution[i][1][0]+pngSize)){
                reject("Click " + i + " doesn't match");
            }
            if(!(mouseClicks[i][1]>solution[i][1][1] && mouseClicks[i][1]<solution[i][1][1]+pngSize)){
                reject("Click " + i + " doesn't match");
            }
        }
        resolve("Clicking good");
    });
}