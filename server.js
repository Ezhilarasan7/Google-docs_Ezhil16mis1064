const dotenv = require('dotenv')
dotenv.config()

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

const port = process.env.PORT || 3333;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const uuidv4 = require('uuid/v4');

const pool = require('./pg');
// require('./job');

app.post('/register', async function (req, res) {
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(403).send({
            auth: false,
            token: null,
            msg: "Bad payload"
        });
    }

    const client = await pool().connect();
    await client.query('SELECT id FROM users WHERE email=$1', [req.body.email], async function (err, result) {
        if (result.rows[0]) {
            return res.status(403).send({
                auth: false,
                token: null,
                msg: "Email already exists"
            });
        } else {
            var id = await uuidv4();
            var pwd = await bcrypt.hashSync(req.body.password, 8);
            client.query('INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)', [id, req.body.name, req.body.email, pwd], function (err, result) {
                if (err) {
                    console.log('err in registering user', err);
                    return res.status(500).send({
                        auth: false,
                        token: null,
                        msg: 'Internal error / Bad payload'
                    })
                } else {
                    return res.status(200).send({
                        auth: true,
                        token: null,
                        msg: 'User registered successfully'
                    });
                }
            });
        }
    });
    client.release();
});

app.post('/login', async function (req, res) {
    if (!req.body.email || !req.body.password) {
        return res.status(403).send({
            auth: false,
            token: null,
            msg: "Bad payload"
        });
    }
    const client = await pool().connect()
    await client.query('SELECT * FROM users WHERE email=$1', [req.body.email], function (err, result) {
        if (!result.rows[0]) {
            return res.status(404).send({
                auth: false,
                token: null,
                msg: "No user found with the given email / password"
            })
        } else {
            var encryptedPassword = result.rows[0].password;
            var passwordIsValid = bcrypt.compareSync(req.body.password, encryptedPassword);
            if (!passwordIsValid) return res.status(404).send({
                auth: false,
                token: null,
                msg: 'Email / Password is wrong'
            });

            // if (result.rows[0].verified === true) {
                var token = jwt.sign({
                    id: result.rows[0].id,
                    email: req.body.email
                }, process.env.jwtSecret, {
                    expiresIn: 604800
                });

                return res.status(200).send({
                    auth: true,
                    token: token,
                    msg: 'Login success :)'
                });
            // } else {
            //     return res.status(404).send({
            //         auth: false,
            //         token: null,
            //         msg: 'Account not verified'
            //     });
            // }
        }
    });
    client.release();
});

app.get('/view', async(req, res) => {

    async function getList() {
        await client.query('select name from visits where viewing_currently=true', function (err, result) {
            
            if (result.rows) {
                return res.status(200).send({
                    name: result.rows
                });
            } 
        })
    }

    let name = req.headers['user'];

    const client = await pool().connect();
    await client.query('select name from visits where name=$1', [name], async function (err, r) {
        if (r && r.rows[0]) {
            // do nothing
            getList();
        } else {
            await client.query('insert into visits (name, viewing_currently) values ($1, $2)', [name, 'true'], async function (err, r) {
                if (r) {
                    getList();
                }
            })
        }
    });

    client.release();
});

app.get('/save', async(req, res) =>{
    const client = await pool().connect();
    await client.query('update doc set content=$1', [req.query.txt]);
    client.release();
    res.send('saved');
});

app.get('/getText', async(req, res) =>{
    const client = await pool().connect();
    await client.query('select content from doc', function (err, result) {
        if (result.rows[0]) {
            res.status(200).send({
                text: result.rows[0]
            })
        }
    });
    client.release();
    // res.send('saved');
});

app.listen(port, () => {
    console.log('GoogleDocApi is listening on port ' + port);
});