var Jimp = require('jimp'); // image compositing 
var randomJpeg = require('random-jpeg') // bg-generation

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
    randomJpeg.writeJPEG(tmp_bg_filename, image_options);
    return tmp_bg_filename;
}


/**
 */


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
    let bg_name = generateRandomBackground();
    let canvas = await Jimp.read(bg_name);
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
    return icon_coordinates;
}

/* Simple get random action function */
const instruction_array = ['MOVE', 'CLICK', 'AVOID']
function getRandomInstruction() {
    return instruction_array[Math.floor(Math.random() * instruction_array.length)];
}

/**
 * Returns a dictionary of label to action
 * @param {string array} labels 
 */
function assignInstructions(labels) {
    let instruction_dict = {};
    for (var i = 0; i < labels.length; i++) {
        instruction_dict[labels[i]] = getRandomInstruction();
    }
    return instruction_dict;
}

/**
 * This functions generate a board.
 */
async function generateBoard() {
    try {
        let board_filename = 'abc.jpg'; // todo: randomly gen
        let solution = [{'action':[0,0]}, {'action':[1,1]}];
        let labels = await generateRandomLabels(5);
        let instructions = assignInstructions(labels);
        let icons = await getIcons(labels);
        let icon_coordinates = await constructBoardImage(board_filename, icons);
        console.log(icon_coordinates);
        return [board_filename, instructions, solution];
    } catch (error) {
        console.error(error)
    }
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