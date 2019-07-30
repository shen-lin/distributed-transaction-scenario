// docker run --name mariadb1 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=mypass -d mariadb/server:10.3
// docker run --name mariadb2 -p 3307:3306 -e MYSQL_ROOT_PASSWORD=mypass -d mariadb/server:10.3


const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const port = 80;
const env = process.env['NODE_ENV'];
const Sequelize = require('sequelize');

let boaDBHost = '127.0.0.1';
let chaseDBHost = '127.0.0.1';
let boaDBPort = 3306;
let chaseDBPort = 3307;
if (env !== 'local') {
    boaDBHost = 'mariadb1';
    chaseDBHost = 'mariadb2';
    boaDBPort = 3306;
    chaseDBPort = 3306;
}


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/createDB', (req, res) => {
    const boaDB = new Sequelize('', 'root', 'mypass', {
        host: boaDBHost,
        port: boaDBPort,
        dialect: 'mariadb'
    });

    const chaseDB = new Sequelize('', 'root', 'mypass', {
        host: chaseDBHost,
        port: chaseDBPort,
        dialect: 'mariadb'
    });

    Promise.all([
        boaDB.query("CREATE DATABASE `BankAccount`;")
            .then((data) => {
                return "OK";
            })
            .catch((err) => {
                if (err.original.code === 'ER_DB_CREATE_EXISTS') {
                    return "EXIST";
                } else {
                    return `ERROR ${err.original.code}`;
                }
            })
        ,
        chaseDB.query("CREATE DATABASE `BankAccount`;")
            .then((data) => {
                return "OK";
            })
            .catch((err) => {
                if (err.original.code === 'ER_DB_CREATE_EXISTS') {
                    return "EXIST";
                } else {
                    return `ERROR ${err.original.code}`;
                }
            })
    ]).then((results) => {
        res.send(JSON.stringify(results));
    });
});


class Account extends Sequelize.Model { }

app.post('/createUser', (req, res) => {
    const user = req.body.user;
    const balance = req.body.balance;
    const bank = req.body.bank;

    let dbHost;
    let dbPort;
    if (bank === 'boa') {
        dbHost = boaDBHost;
        dbPort = boaDBPort;
    }
    if (bank === 'chase') {
        dbHost = chaseDBHost;
        dbPort = chaseDBPort;
    }

    const sequelize = new Sequelize('BankAccount', 'root', 'mypass', {
        host: dbHost,
        port: dbPort,
        dialect: 'mariadb'
    });

    
    Account.init({
        username: Sequelize.STRING,
        balance: Sequelize.INTEGER
    }, { sequelize, modelName: 'account' });

    sequelize.sync().then(() => {
        Account.findOrCreate({ where: { username: user }, defaults: { balance: balance } })
        .then(([account, created]) => { 
            console.log(account.dataValues);
            console.log(created);
        })
        .then(() => {
            res.send('OK');
        });
    })
});


app.use('/', express.static('web'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`));