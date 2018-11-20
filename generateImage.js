var Jimp = require('jimp');

var background1 = './back2.jpg';
var icon = './icons/Airplane-75.png';
var icon2 = './icons/Bear-18690.png';
var testOutput = "test.jpg";

var iconList = {};
iconList[icon] = [120,310];
iconList[icon2] = [343,500];

//function to generate the board
//list of icon should be:
//{ icon_location_1: [x1,y1],
//  icon_location_2: [x2,y2],
//  icon_location_3: [x3,y3]......
// }
// taking minimum of 1 and maximum of 5
// anything after the fifth one will be ignore

var generateBoard = function(background, outputName, list){
    console.log("entering function");
    console.log(list);
    var imageArray = [background];
    var keyList = Object.keys(list);

    var tempLength = keyList.length;

    if(tempLength > 5){
        tempLength = 5;
    }

    for(var i = 0; i < tempLength; i++){
        imageArray.push(Object.keys(list)[i]);
    }

    var jimpArray = [];

    for(var i = 0; i < imageArray.length; i++){
        jimpArray.push(Jimp.read(imageArray[i]));
    }

    Promise.all(jimpArray).then(function(data){
        return Promise.all(jimpArray);
    }).then(function(data) {
        var back = data[0];
        // resize the background to a fixed size
        back.resize(1200,900);
        for(var i = 1; i < data.length; i++){
            var tempKey = keyList[i-1];
            console.log("putting "+ tempKey + " at (" +
                list[tempKey][0] + ', ' +
                list[tempKey][1] +')');
            back.composite(data[i],list[tempKey][0], list[tempKey][1]);
        }

        //play around with the image

        back.write(outputName);
    }).catch(function(err){
        console.log(err);
    });
}




generateBoard(background1, testOutput, iconList);