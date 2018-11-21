var Jimp = require('jimp');
// var bgGen = require('geopattern')
// var svgexport = require('svgexport')
// var crypto = require('crypto') // For that good cryptosecurity goodness
var randomJpeg = require('random-jpeg')

var background1 = './tmp.jpg';
var icon = './icons/Airplane-75.png';
var icon2 = './icons/Bear-18690.png';

var label_list = []
var label_filename = []
var icon_count = 0
var testOutput = "test.jpg";

// Db Access
var sqlite3 = require('sqlite3').verbose()
require('dotenv').config({path:'./.env'})
var db = new sqlite3.Database(process.env.SQLITE_DB)

var iconList = {};

//function to generate the board
//list of icon should be:
//{ icon_location_1: [x1,y1],
//  icon_location_2: [x2,y2],
//  icon_location_3: [x3,y3]......
// }
// taking minimum of 1 and maximum of 5
// anything after the fifth one will be ignore

function generateRandomIcons(max_icons) {
    var sql_statement = 'select distinct label from icons order by random() limit ' + max_icons;
    db.each(sql_statement, [], (err, row) => {
        if (err) {
            throw err;
        }
        label_list.push(row.label)
    },
    () => {
        label_list.forEach((element) => {
            var sql_get_filename = 'select filename from icons where label = ? order by random() limit 1'
            db.get(sql_get_filename, [element], (err, row) => {
                if (err) {
                    throw err;
                }
                label_filename.push(row.filename);
                icon_count++;
                if (icon_count == max_icons) {
                    generateIconList(max_icons)
                }
            });
        });
    });
}

function generateCoordinates() {
    return [Math.random() * (1200), Math.random() * 900];
}

function generateIconList(max_icons) {
    for (var i = 0; i < max_icons; i++) {
        iconList['./icons/' + label_filename[i]] = generateCoordinates()
    }
    generateBoard(background1, testOutput, iconList)
}

function generateBackground() {
    var imageOptions = {
        colors: [[255,0,0], [0,255,0], [0,0,255]],
        width: 1200,
        height: 900
    };
    randomJpeg.writeJPEG(background1);
}

var generateBoard = function(background, outputName, list){
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

generateBackground()
generateRandomIcons(5);
