require("dotenv").config();
const jwt = require("jsonwebtoken");

// env variables
const secret = process.env.SECRET;
const issuer = process.env.ISSUER;

//verify token
const verifyJWT = (token, client) => {
  // client.db("usernames").collection("usernames").findOne({ username: username }).then((document) => {
  //     if (document === null) {
  //         return false
  //     } else {
  //         jwt.verify(token, secret, { algorithms: ['HS256'], issuer: issuer }, (err, token) => {
  //             if (err) {
  //                 console.log(err.message);
  //                 return false
  //             } else {
  //                 return token
  //             }

  //         });
  //     }
  // })
  //console.log(token);
  return jwt.verify(token, secret, { issuer: issuer }, (err, token) => {
    if (err) {
      console.log(err.message);
      return "";
    } else {
      console.log(token);
      const userData = JSON.stringify({
        username: token.username,
        userId: token.userId,
      });
      return userData;
    }
  });
};

//generate token
//generate JWT token using SHA256
const generateJWT = (message, client) => {
  console.log(message);
  const messageJSON = JSON.parse(message);
  const token = jwt.sign(
    { username: messageJSON.username, userId: messageJSON.userId },
    secret,
    {
      expiresIn: "1h",
      algorithm: "HS256",
      issuer: issuer,
    }
  );

  client
    .db("usernames")
    .collection("usernames")
    .findOne({ username: messageJSON.username })
    .then((document) => {
      if (document === null) {
        client
          .db("usernames")
          .collection("usernames")
          .insertOne({ username: messageJSON.username });
      }
    });

  return token;
};

exports.verifyJWT = verifyJWT;
exports.generateJWT = generateJWT;
