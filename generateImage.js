var Jimp = require('jimp'); // image compositing 

var randomJpeg = require('random-jpeg') // bg-generation
var trianglify = require('trianglify') //bg-generation v2
var gm = require('gm').subClass({imageMagick: true}) // bg-generation v3, depends on imageMagick (or graphicsMagick)

var fs = require('fs');
var uuid = require('uuid/v4');

// Db Access
var sqlite3 = require('sqlite3').verbose()
require('dotenv').config({path:'./.env'})
var db = new sqlite3.Database(process.env.SQLITE_DB)

// Image size constants
const image_width = 800;
const image_height = 500;
const icon_size = 100;

// 1: ugly squares, 2: triangles, 3: imagemagick
const bg_generator_version = 1;

// Image colour constants
// Suppoesd to be colourblind safe
// but doesn't look too nice :<
const PALETTES = [
    ['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e'],
    ['#c51b7d','#e9a3c9','#fde0ef','#e6f5d0','#a1d76a','#4d9221'],
    ['#762a83','#af8dc3','#e7d4e8','#d9f0d3','#7fbf7b','#1b7837'],
    ['#b35806','#f1a340','#fee0b6','#d8daeb','#998ec3','#542788'],
    ['#b2182b','#ef8a62','#fddbc7','#d1e5f0','#67a9cf','#2166ac'],
    ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4']
];

// Easy on the eyes contrasts
const PALETTES_CONTRAST = [
    ['#F46036', '#5B85AA', '#414770', '#372248', '#171123'],
    ['#c7e8f3','#bf9aca', '#8e4162', '#41393e', '#eda2c0'],
    ['#e1dd8f','#e0777d', '#8e4162', '#41393e', '#4c86a8'],
    ['#d1d1d1','#e0777d','#8e4162','#41393e','#720c26'],
    ['#a2999e','#d0d6b5','#f9b5ac','#ee7674','#6a56ff'],
    ['#edffec','#13293d','#006494','#247ba0','#1b98e0']
];

/**
 * Extends the palette into num objects
 * to satisfy the guarantee that we'll have enough
 * colours for all the icons
 */
function extendPalette(palette, num) {
    let p = [];
    for (var i = 0; i < num; i++) {
        p.push(palette[Math.floor(Math.random()*palette.length)]);
    }
    return p
}

/**
 * Returns a palette array,
 * the background is the 0-th element
 */
function getPalette() {
    // return PALETTES[Math.floor(Math.random() * PALETTES.length)];
    let palette = [];
    let palette_raw = PALETTES_CONTRAST[Math.floor(Math.random() * PALETTES_CONTRAST.length)];
    palette[0] = palette_raw[0];
    palette_raw.shift();
    let extended_palette = extendPalette(palette_raw, 5);
    palette = palette.concat(extended_palette);
    return palette;
}

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
function generateRandomBackgroundV1(color) {
    let image_options = {
        colors: [[255,0,0], [0,255,0],[0,0,255]],
        width:image_width,
        height:image_height
    };
    let img = randomJpeg.drawJPEG(image_options);
    return img.data;
}

/**
 * Returns a random triangle background encoded in base64
 */
function generateRandomBackgroundV2(color) {
    let bg = trianglify({width: image_width, height: image_height, x_colors: ['#FFFFFF', color]});
    return bg.png().replace('data:image/png;base64,', '');
}


const PLASMA_PARAMS = ['black-black', 'grey-grey', 'white-white', 'tomato-tomato', 'steelblue-steelblue']
/**
 * Generates yet another random background
 * Generated with imageMagic:
 *  - to change certain colours can replace <param>inside
 *      the .out('plasma:<param>')
 *    with the values: ['blue', 'yellow', 'green-yellow', 'steelblue', 'etc']
 *    Reccomend maybe to use:
 *      ['black-black', 'grey-grey', 'white-white'] for a more 'uniform' random bg
 *    Ref: http://www.imagemagick.org/Usage/canvas/#plasma
 * 
 *  Though note that this function is QUITE slow to return :/
 */
function generateRandomBackgroundV3(color) {
    return new Promise((resolve) => {
        if (!color) {
            color = PLASMA_PARAMS[Math.floor(Math.random() * PLASMA_PARAMS.length)];
        }
        let plasma_param = 'plasma:{param}'.replace('{param}', color + '-' + color);
        gm(image_width, image_height)
            .command('convert')
            .out(plasma_param)
            .paint(10)
            .toBuffer('JPG', (err, buf) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                resolve(buf);
            });
    });
}

function generateRandomBackground(color) {
    switch(bg_generator_version) {
        case 1:
            return generateRandomBackgroundV1(color);
        case 2:
            return generateRandomBackgroundV2(color);
        case 3:
            return generateRandomBackgroundV3(color);
        default: throw Error('Invalid background generator version');
    }
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
            coords.push(potential_coord)
        }
    }
    return coords;
}

/**
 * Gets a random value between 0 - 255
 */
function getRandom8BitValue() {
    return Math.floor(Math.random() * 255);
}

/**
 * Applies some processing to the icon
 * @param {JIMP_img} icon_img 
 * @param {color}    color
 */
function processIcon(icon_img, color) {
    icon_img.resize(icon_size, Jimp.AUTO);
    icon_img.rotate((Math.random() * 90) - 45);     // rotate the image b/w -45 to 45 degrees
    let rgb = Jimp.intToRGBA(Jimp.cssColorToHex(color))
    icon_img.color([
        {apply: 'red', params: [rgb.r]},
        {apply: 'green', params: [rgb.g]},
        {apply: 'blue', params: [rgb.b]}
    ]);
}

/**
 * Array shuffler
 * Re: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 * @param {array} array 
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Creates a board given a dictionary of labels and its corresponding
 * icon image filename
 * @param {string} board_filename 
 * @param {label, filename dictionary} icons 
 */
async function constructBoardImage(board_filename, icons) {
    let palette = getPalette(); 
    let bg_color = palette[0];
    palette.shift();
    shuffleArray(palette);
    let icon_coordinates = {}
    let num_icons = Object.keys(icons).length;
    let bg64 = await generateRandomBackground(bg_color);
    let buf = Buffer(bg64, 'base64');
    let canvas = await Jimp.read(buf);
    let coordinates = generateRandomNonIntersectingCoordinates(0, image_width-2*icon_size, 0, image_height-2*icon_size, 3*icon_size, num_icons);

    var i = 0;
    for (var icon in icons) {
        let coordinate = [coordinates[i][0], coordinates[i][1]];
        let icon_img = await Jimp.read('./icons/' + icons[icon]);
        processIcon(icon_img, palette[i+1]);
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
    'Click on the {label}'
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
