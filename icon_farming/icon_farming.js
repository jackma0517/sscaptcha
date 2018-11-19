var NounProject = require('the-noun-project')
var mysql = require('mysql')
var request = require('request')
var fs = require('fs')

// This might need editing depending where you're calling it from
require('dotenv').config({path:'../.env'})

var nounproject = new NounProject({
    key: process.env.NP_KEY,
    secret: process.env.NP_SECRET
});

var connection = mysql.createConnection({
    host: 'localhost',
    user:  process.env.DB_USER,
    password:  process.env.DB_PASS,
    database: 'sscaptcha'
})
connection.connect()

// Download the file into the icons folder
// add path and label to the database

// TODO: get this from command line? 
var icon_folder = '/home/valerian/Programming/sscaptcha/icons'

/**
 * Inserts the icon into the database with the proper label
 * @param {icon} icon 
 * @param {string} filename 
 */
function insert_into_database(icon, filename) {
    console.log(icon.term)
    connection.query('insert into icons (label, filename) values ?',
        [[[icon.term, filename]]],
        function (err, res, fields) {
            if (err) {
                throw err;
            }
            return
        }
    )
    return
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

nounproject.getIconsByTerm('star', {limit: 2}, cb_func)
