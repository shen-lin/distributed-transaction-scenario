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

if (env !== 'local') {
    boaDBHost = 'mariadb1';
    chaseDBHost = 'mariadb2'
}


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/createTables', (req, res) => {
    const boaDB = new Sequelize('', 'root', 'mypass', {
        host: boaDBHost,
        port: 3306,
        dialect: 'mariadb'
    });

    const chaseDB = new Sequelize('', 'root', 'mypass', {
        host: chaseDBHost,
        port: 3307,
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
                    return "ERROR";
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
                    return "ERROR";
                }
            })
    ]).then((results) => {
        res.send(JSON.stringify(results));
    });
});

app.post('/createUser', (req, res) => {
    const boaDB = new Sequelize('', 'root', 'mypass', {
        host: '127.0.0.1',
        dialect: 'mariadb'
    });

    boaDB.query("CREATE DATABASE `BankAccount`;").then((data) => {
        console.log(data);
        return res.send('OK');
    }).catch((err) => {
        console.log(err);
        if (err.original.code === 'ER_DB_CREATE_EXISTS') {
            return res.send('EXIST');
        } else {
            return res.send('ERROR');
        }
    });
});

app.use('/', express.static('web'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`));