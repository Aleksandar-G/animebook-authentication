require('dotenv').config()
const jwt = require("jsonwebtoken")

// env variables
const secret = process.env.SECRET
const issuer = process.env.ISSUER

//verify token
const verifyJWT = (token, client) => {
    jwt.verify(token, secret, { algorithms: ['HS256'], issuer: issuer }, (err, token) => {
        if (err) {
            console.log(err.message);
        } else {
            return token
        }

    });


}

//generate token
//generate JWT token using SHA256
const generateJWT = (username, client) => {

    const token = jwt.sign({ username: username }, secret, { expiresIn: '1h', algorithm: 'HS256', issuer: issuer })

    client.db("usernames").collection("usernames").insertOne({ username: username })

    return token
}

exports.verifyJWT = verifyJWT
exports.generateJWT = generateJWT