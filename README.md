# SS captcha
A new generation of captcha.

## Installation
Download node.js: https://nodejs.org/en/download/

Install Express: npm install express


Check required dependencies in package.json

This also requires [sqlite](https://www.npmjs.com/package/sqlite3), setup with 
`db_setup/sqlite_setup.sql`.

## Environment Setup
We use [dotenv](https://www.npmjs.com/package/dotenv) to manage
secret keys in the repo. Please make sure there exist a `.env`
file containing the values below
```
NP_KEY=noun_project_key
NP_SECRET=noun_project_secret
SQLITE_DB=<path_to_sscaptcha>/sscaptcha.sqlite
ICON_FOLDER=<path_to_sscaptcha>/icons
```

## Run
Run: node server

Open localhost:8080

This is composed of a few components:

## The Icon Database
The icon database is currently built on top of: (mysql)
Some sources of icons include:
- thenounproject.com
- icons8.com

## The Action Database

## The Challenge Generator

## The Checker State Machine
