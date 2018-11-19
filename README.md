# SS captcha
A new generation of captcha.

## Installation
Download node.js: https://nodejs.org/en/download/

Check required dependencies in package.json

This also requires [mysql](https://www.mysql.com/), setup with 
`db_setup/db_setup_script.sql`.

## Environment Setup
We use [dotenv](https://www.npmjs.com/package/dotenv) to manage
secret keys in the repo. Please make sure there exist a `.env`
file containing the values below
```
NP_KEY=noun_project_key
NP_SECRET=noun_project_secret
DB_USER=db_username
DB_PASS=db_password
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
