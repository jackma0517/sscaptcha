var NounProject = require('the-noun-project')
var request = require('request')
var fs = require('fs')
var readline = require('readline')
var sqlite3 = require('sqlite3').verbose()

// This might need editing depending where you're calling it from
require('dotenv').config({path:'../.env'})
var db = new sqlite3.Database(process.env.SQLITE_DB)

var nounproject = new NounProject({
    key: process.env.NP_KEY,
    secret: process.env.NP_SECRET
});

// Download the file into the icons folder
// add path and label to the database

// TODO: get this from command line? 
var icon_folder = process.env.ICON_FOLDER
var icon_list = './label_list.txt'

/**
 * Inserts the icon into the database with the proper label
 * @param {icon} icon 
 * @param {string} filename 
 */
function insert_into_database(icon, filename) {
    console.log(icon.term)
    let stmt = db.prepare('insert into icons (id, label, filename)\
                           values ($id, $label, $filename)')
    stmt.run({$id: icon.id, $label: icon.term, $filename: filename}, 
                function(error) {
                    if (error) {
                        if (error.toString().includes('UNIQUE constraint failed: icons.id')) {
                            console.log('Value is already in the database')
                        } else {
                            console.log('Error inserting the value into the database')
                            console.log(error)
                        }
                    }
                })
}

/**
 * This function downloads an image into the folder
 * @param {string} icon_folder 
 * @param {icon} icon
 */
function download_icon(icon_folder, icon) {
    request.head(icon.preview_url, function(err, res, body){
        let filename = icon.term + '-' + icon.id + '.png'
        let full_filepath = icon_folder + '/' + filename
        console.log('Downloading: ' + icon.preview_url)
        console.log('to: ' + full_filepath)
        request(icon.preview_url).pipe(fs.createWriteStream(full_filepath))
            .on('close', function() {
                insert_into_database(icon, filename)
                return
            })
    })
    return
}


var cb_func = function(err, data) {
    if (!err) {
        let icons = data.icons
        let num_icons = icons.length
        for (var i = 0; i < num_icons; i++) {
            download_icon(icon_folder, icons[i], function(){})
        }
    } else {
        console.log(err)
    }
}

// Read icons one by one from the list 
// and grab the images and insert into db
var rd = readline.createInterface({
    input: fs.createReadStream(icon_list),
    output: process.stdout,
    console: false
})

rd.on('line', function(line) {
    nounproject.getIconsByTerm(line, {limit: 10}, cb_func)
})
