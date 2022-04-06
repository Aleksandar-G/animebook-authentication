const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const amqp = require('amqplib/callback_api');
const jwtController = require("./controllers/jwtController")
require('dotenv').config()

// env variables
const messageBroker = process.env.MESSAGE_BROKER
const databaseUser = process.env.DATABASE_USER
const databasePassword = process.env.DATABASE_PASSWORD

//connect to database
const uri = `mongodb+srv://${databaseUser}:${databasePassword}@cluster0.jwv5z.mongodb.net`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect((err) => {
    if (err) {
        throw err
    } else {
        console.log("connected to db");
    }

    amqp.connect(`amqp://${messageBroker}`, (err, connection) => {
        if (err) {
            throw err
        }

        connection.createChannel((err, channel) => {
            if (err) {
                console.error(err);
                throw err
            }

            const Verifyqueue = 'verify_auhtentication_queue'
            const Generatequeue = 'generate_auhtentication_queue'

            channel.assertQueue(Verifyqueue, {
                durable: true
            })

            channel.assertQueue(Generatequeue, {
                durable: true
            })

            channel.prefetch(1)
            console.log(`waiting for requests on queue ${Verifyqueue}`);
            console.log(`waiting for requests on queue ${Generatequeue}`);

            channel.consume(Verifyqueue, (msg) => {

                const username = msg.content.toJSON().username
                const token = msg.content.toJSON().token

                const verified = jwtController.verifyJWT(token, username, client)

                channel.sendToQueue(msg.properties.replyTo, Buffer.from(verified), {
                    correlationId: msg.properties.correlationId
                })

                channel.ack(msg)

            })

            channel.consume(Generatequeue, (msg) => {

                const username = msg.content.toString()
                const token = jwtController.generateJWT(username, client)

                channel.sendToQueue(msg.properties.replyTo, Buffer.from(token), {
                    correlationId: msg.properties.correlationId
                })

                channel.ack(msg)
            })
        })

    })

    //client.db("usernames").collection("usernames").insertOne({ "username": "testuser2" })
});





