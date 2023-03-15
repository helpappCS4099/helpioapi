const express = require('express') // Call express
const http = require('http')
const db = require("./api/models")
const dbConfig = require('./config/db.config')
const { connectDB } = require('./database')
const cookieParser = require('cookie-parser')
const io = require('socket.io')

const {helpnsp} = require('./socketserver')
const { socketJwtAuth } = require('./api/middlewares/jwt.mwr')

var server = null;
var socketserver = null;
var app = express()

async function makeServerApp() {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser());
    //--------------ROUTES------------------
    require("./api/routes/auth.routes")(app)
    require("./api/routes/user.routes")(app)
    require("./api/routes/helprequest.routes")(app)
    await connectDB()
    server = http.createServer(app)

    //namespace socket server at /ws/helprequests
    socketserver = io(server).of(/^\/ws\/helprequests\/\d+$/)
    socketserver.use(socketJwtAuth)
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

exports.app = app
exports.socketserver = socketserver
