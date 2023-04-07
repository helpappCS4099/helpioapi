const express = require('express') // Call express
const http = require('http')
const db = require("./api/models")
const dbConfig = require('./config/db.config')
const { connectDB } = require('./database')
const cookieParser = require('cookie-parser')
const io = require('socket.io')

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

const HelpRequest = db.helprequest

const {helpnsp} = require('./socketserver')
const { socketJwtAuth } = require('./api/middlewares/jwt.mwr')
const { socketHelpRequestIsActive, socketCanReadHelpRequest } = require('./api/middlewares/help.mwr')
const mongoose = require('mongoose')
const { helprequest } = require('./api/models')

var server = null;
var socketserver = null;
var app = express()

var HelpRequestChangeStream = null;

mongoose.connection.on('open', function (ref) {
    // console.log('db connection fire')
    let db = mongoose.connection.db
    try {
        if (process.env.NODE_ENV != 'test') {
            // console.log("try to watch")
            HelpRequestChangeStream = HelpRequest.watch()
            // console.log("watching")
        }
    } catch (err) {
        console.log(err)
    }
})

/**
 * routine for initialising the server and connecting all routes + establishing the dynamic namespace socker.io instance
 *   
 */
async function makeServerApp() {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser());
    //--------------ROUTES------------------
    require("./api/routes/auth.routes")(app)
    require("./api/routes/user.routes")(app)
    require("./api/routes/helprequest.routes")(app)
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

    await connectDB()
    server = http.createServer(app)

    //namespace socket server at /ws/helprequests
    // io.set("transports", ["xhr-polling"])
    socketserver = io(server).of(/^\/ws\/helprequests\/[\w-]+$/)
    socketserver.use(socketJwtAuth)
    socketserver.use(socketCanReadHelpRequest)
    socketserver.use(socketHelpRequestIsActive)
    socketserver.on('connection', helpnsp)
    
    const port = process.env.PORT || 8000
    server.listen(port)
    console.log('RESTful API demo server started on: ' + port)
    //mocha delayed run for tests after DB connection
    if (process.env.NODE_ENV === 'test') {
        run() 
    }

    return 
}

makeServerApp()

// const HelpRequestStream = HelpRequest.watch();

// HelpRequestStream.on('change', (change) => {
//     console.log('change stream triggered: ', change)
//     // if (change.operationType === 'update') {
//     //     if (change.documentKey._id.toString() === helpRequestID) {
//     //         //update socket object
//     //         socket.helpRequest = change.fullDocument
//     //         //broadcast update to all sockets in namespace
//     //         socket.broadcast.emit('update', {
//     //             helpRequestID: helpRequestID,
//     //             owner: {
//     //                 userID: change.fullDocument.owner.userID,
//     //                 firstName: change.fullDocument.owner.firstName,
//     //                 lastName: change.fullDocument.owner.lastName,
//     //                 colorScheme: change.fullDocument.owner.colorScheme
//     //             },
//     //             isResolved: change.fullDocument.isResolved,
//     //             category: change.fullDocument.category,
//     //             currentStatus: change.fullDocument.currentStatus,
//     //             startTime: change.fullDocument.startTime,
//     //             endTime: change.fullDocument.endTime,
//     //             location: change.fullDocument.location,
//     //             respondents: change.fullDocument.respondents,
//     //             messages: change.fullDocument.messages
//     //     })
//     // }
//     // }
// })

exports.app = app
exports.socketserver = socketserver
exports.HelpRequestChangeStream = HelpRequestChangeStream
