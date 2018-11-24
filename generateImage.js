var Jimp = require('jimp'); // image compositing 
var randomJpeg = require('random-jpeg') // bg-generation
var trianglify = require('trianglify') //bg-generation v3
var fs = require('fs');
var uuid = require('uuid/v4');

// Db Access
var sqlite3 = require('sqlite3').verbose()
require('dotenv').config({path:'./.env'})
var db = new sqlite3.Database(process.env.SQLITE_DB)

/**
 * Obtains the filepath to an icons which matches the labels
 * @param {sring array} labels 
 */
function getIcons(labels) {
    return new Promise(async (resolve) => {
        const icons = {}
        for (var i = 0; i < labels.length; i++) {
            icons[labels[i]] = await getIcon(labels[i]);
        }
        resolve(icons);
    })
}

/**
 * Obtains the filepath to the icon which matches the label
 * Helper function of getIcons
 * @param {string} label 
 */
function getIcon(label) {
    return new Promise(resolve => {
        var sql_get_filename = 'select filename from icons where label = ? order by random() limit 1';
        db.get(sql_get_filename, [label], (err, row) => {
            if (err) {
                throw err;
            }
            resolve(row.filename);
        });
    })
}

/**
 * Generates num_labels random labels from the database
 * @param {int} num_labels 
 */
function generateRandomLabels(num_labels) {
    return new Promise((resolve) => {
        const labels = [];
        var sql_statement = 'select distinct label from icons order by random() limit ' + num_labels;
        db.all(sql_statement, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                labels.push(row.label)
            });
            resolve(labels)
        });
    });
}

/**
 * Generates a random background
 * TODO: Make it nicer? 
 */
function generateRandomBackground() {
    let tmp_bg_filename = 'tempbg.jpg'; //TODO: random hash?
    // TODO: Why does it disrespect my colour choice :( 
    var image_options = {
        colors: [[255,0,0], [0,255,0],[0,0,255]],
        width:1200,
        height: 900
    };
    randomJpeg.writeJPEGSync(tmp_bg_filename, image_options);
    return tmp_bg_filename;
}

/**
 * Returns a random background encoded in base64
 */
function generateRandomBackgroundB64() {
    let bg = trianglify({width: 1200, height: 900});
    return bg.png().replace('data:image/png;base64,', '');
}


/**
 * Acts to check whether two points intersects one anoter
 * to prevent icons from overlapping one another
 * TODO: This function assumes p2 as a point and not
 *         as a "box", which makes geometry checking hurts. fix when I'm less sleepy
 * @param {coordinate} p1 
 * @param {coordinate} p2 
 * @param {int} point_size 
 */
function checkIntersection(p1, p2, point_size) {
    let edge = Math.floor(point_size/2);
    let p1_x_min = p1[0] - edge;
    let p1_x_max = p1[0] + edge;

    let p1_y_min = p1[1] - edge;
    let p1_y_max = p1[1] + edge;

    if (p1_x_min < p2[0] 
            && p2[0] < p1_x_max
            && p1_y_min < p2[1]
            && p2[1] < p1_y_max) {
        return false;
    }
    return true;
}


/**
 * Generates num_coords non-intersecting coordinates
 * @param {*} min_x 
 * @param {*} max_x 
 * @param {*} min_y 
 * @param {*} max_y 
 * @param {*} point_size 
 * @param {*} num_coords 
 */
function generateRandomNonIntersectingCoordinates(min_x, max_x, min_y, max_y, point_size, num_coords) {
    let coords = [];
    while (coords.length < num_coords) {
        let potential_coord = [Math.random() * (max_x - min_x) + min_x, Math.random() * (max_y - min_y) + min_y];
        let is_valid = true;
        if (coords.length > 0) {
            for (var i = 0; i < coords.length; i++) {
                is_valid = checkIntersection(potential_coord, coords[i], point_size);
                if (!is_valid) {
                    break;
                }
            }
        }
        if (is_valid) {
            coords.push(potential_coord);
        }
    }
    return coords;
}

/**
 * Creates a board given a dictionary of labels and its corresponding
 * icon image filename
 * @param {string} board_filename 
 * @param {label, filename dictionary} icons 
 */
async function constructBoardImage(board_filename, icons) {
    let icon_coordinates = {}
    let num_icons = Object.keys(icons).length;
    let bg64 = generateRandomBackgroundB64();
    //bg64 = bg64.replace('data:image/svg+xml;base64,', '');
    let buf = new Buffer(bg64, 'base64');
    let canvas = await Jimp.read(buf);
    let coordinates = generateRandomNonIntersectingCoordinates(0, 1200-200, 0, 900-200, 400, num_icons);

    var i = 0;
    for (var icon in icons) {
        let coordinate = [coordinates[i][0], coordinates[i][1]];
        let icon_img = await Jimp.read('./icons/' + icons[icon]);
        icon_img.resize(200, 200);
        canvas.composite(icon_img, coordinate[0], coordinate[1]);
        icon_coordinates[icon] = coordinate;
        i++;
    }
    canvas.write(board_filename);
    let b64_img = await canvas.getBase64Async(Jimp.AUTO)
    return [icon_coordinates, b64_img];
}

/* Simple get random action function */
//const instruction_array = ['MOVE', 'CLICK', 'AVOID']
// Only send click instructions for now
const instruction_array = ['CLICK']
function getRandomInstruction() {
    return instruction_array[Math.floor(Math.random() * instruction_array.length)];
}

/**
 * Returns a dictionary of label to action
 * @param {string_array} labels 
 */
function assignInstructions(labels) {
    let instruction_dict = {};
    for (var i = 0; i < labels.length; i++) {
        instruction_dict[labels[i]] = getRandomInstruction();
    }
    return instruction_dict;
}


/**
 * Allows for String.Format to replace values in functions
 * from: https://stackoverflow.com/questions/2534803/use-of-string-format-in-javascript
 */
function strFormat() {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {       
        var reg = new RegExp("\\{" + i + "\\}", "gm");             
        s = s.replace(reg, arguments[i + 1]);
    }
    return s;
}

const MOVE_SENTENCES = [
    'Move your mouse to the {label}',
    'Drag your mouse to the {label}',
    'To {label}, you should slide your mouse', // Yoda is that you?
    'Drag your cursor to the {label}',
    'Move your cursor to the {label}',
];

const CLICK_SENTENCES = [
    'Click on the {label}',
    'Select the {label}',
    'Press the {label}',
]

const AVOID_SENTENCES = [
    'Do not touch the {label}',
    'Avoid the {label} at all costs',
    'Make sure the mouse does not touch the {label}'
]

/**
 * Returns a string corresponding to the label and the 
 * action
 * @param {string} label
 * @param {sring} action 
 * TODO: Randomify the strings
 */
function instruction_to_sentence(label, action) {
    let sentence = '';
	switch(action) {
        case "MOVE":
            sentence = (MOVE_SENTENCES[Math.floor(Math.random() * MOVE_SENTENCES.length)]).replace('{label}', label);
			break;
		case "CLICK":
            sentence = (CLICK_SENTENCES[Math.floor(Math.random() * CLICK_SENTENCES.length)]).replace('{label}', label);
			break;
		case "AVOID":
            sentence = (AVOID_SENTENCES[Math.floor(Math.random() * AVOID_SENTENCES.length)]).replace('{label}', label);
			break;
    }
    return sentence;
}

/**
 * Stores the board to the DB, with the solution to the board
 * in JSON string.
 * @param {guid} board_guid 
 * @param {json_string} solution 
 */
function storeBoardToDB(board_guid, solution) {
    let stmt = db.prepare('insert into captchas (guid, solution) \
                                values ($guid, $solution)');
    stmt.run({$guid: board_guid, $solution: solution},
            function(error) {
                if (error) {
                    console.log('Error saving the board and solution');
                    console.log(error);
                }
            });
}

/**
 * This functions generate a board.
 */
async function generateBoard() {
    try {
        let board_filename = 'abc.jpg'; // todo: randomly gen
        let board_guid = uuid();
        let solution = [];
        let labels = await generateRandomLabels(5);
        let instructions = assignInstructions(labels);
        let icons = await getIcons(labels);
        let [icon_coordinates, b64_img] = await constructBoardImage(board_filename, icons);
        let instruction_sentences = []
        for (var i = 0; i < labels.length; i++) {
            solution[i] = [instructions[labels[i]], icon_coordinates[labels[i]]]
            instruction_sentences[i] = instruction_to_sentence(labels[i], instructions[labels[i]]);
        }
        storeBoardToDB(board_guid, JSON.stringify(solution));
        return [b64_img, instruction_sentences, board_guid];
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    generateBoard: generateBoard
}

generateBoard()

// MIND MAP:
//
// Solution:
//     {
//      {'action', (coordinates)},
//      {'action', (coordinates)},
//      {'action', (coordinates)}
//     }
//
// generateBoard() (sync) --> returns ('.jpg', instruction, solution)
//      await k = getLabels(num_labels) (async, db) --> returns (array of labels)
//          getInstructions(label_array) (sync) -> returns dict{'label', 'instruction'}
//          getIcons(label_array) (async) -> returns label_icons:dict{'label', 'icon'}
//      await m = generateBoard(label_icons) (sync) -> returns (img, dict{'label', 'coordinate'})
//      
