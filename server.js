const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const amqp = require("amqplib");
const jwtController = require("./controllers/jwtController");
require("dotenv").config();

// env variables
const messageBroker = process.env.MESSAGE_BROKER;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const databaseURL = process.env.DATABASE_URL;

console.log(databaseUser);
//console.log(databasePassword);
console.log(databaseURL);
console.log(messageBroker);

//connect to database
const uri = `mongodb+srv://${databaseUser}:${databasePassword}@${databaseURL}`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("connected to db");
  }

  const Verifyqueue = "verify_auhtentication_queue";
  const Generatequeue = "generate_auhtentication_queue";

  amqp
    .connect(`${messageBroker}`)
    .then((connection) => {
      return connection.createChannel();
    })
    .then((channel) => {
      channel.assertQueue(Verifyqueue, {
        durable: true,
      });

      channel.assertQueue(Generatequeue, {
        durable: true,
      });
      channel.prefetch(1);

      console.log(`waiting for requests on queue ${Verifyqueue}`);
      console.log(`waiting for requests on queue ${Generatequeue}`);

      channel.consume(Verifyqueue, (msg) => {
        console.log("hello");
        const token = msg.content.toString();

        const verified = jwtController.verifyJWT(token, client);

        console.log("verified");
        console.log(verified);
        console.log(msg.properties.replyTo);

        channel.sendToQueue(msg.properties.replyTo, Buffer.from(verified), {
          correlationId: msg.properties.correlationId,
        });
        channel.ack(msg);
      });

      channel.consume(Generatequeue, (msg) => {
        const username = msg.content.toString();
        const token = jwtController.generateJWT(username, client);

        channel.sendToQueue(msg.properties.replyTo, Buffer.from(token), {
          correlationId: msg.properties.correlationId,
        });

        channel.ack(msg);
      });
    });

  //client.db("usernames").collection("usernames").insertOne({ "username": "testuser2" })
});
