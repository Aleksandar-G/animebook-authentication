require('dotenv').config()
const jwt = require("jsonwebtoken")

// env variables
const secret = process.env.SECRET
const issuer = process.env.ISSUER

//verify token
const verifyJWT = (token, username, client) => {

    client.db("usernames").collection("usernames").findOne({ username: username }).then((document) => {
        if (document === null) {
            return false
        } else {
            jwt.verify(token, secret, { algorithms: ['HS256'], issuer: issuer }, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return false
                } else {
                    return token
                }

            });
        }
    })




}

//generate token
//generate JWT token using SHA256
const generateJWT = (username, client) => {

    const token = jwt.sign({ username: username }, secret, { expiresIn: '1h', algorithm: 'HS256', issuer: issuer })

    client.db("usernames").collection("usernames").findOne({ username: username }).then((document) => {
        if (document === null) {
            client.db("usernames").collection("usernames").insertOne({ username: username })
        }
    })

    return token
}

exports.verifyJWT = verifyJWT
exports.generateJWT = generateJWT