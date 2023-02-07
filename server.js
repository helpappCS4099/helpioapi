const express = require('express') // Call express
const http = require('http')
const db = require("./api/models")
const dbConfig = require('./config/db.config')
const { connectDB } = require('./database')

var server = null;

async function makeServerApp() {
    var app = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    //--------------ROUTES------------------
    require("./api/routes/auth.routes")(app)
    require("./api/routes/user.routes")(app)
    require("./api/routes/helprequest.routes")(app)
    await connectDB()
    server = http.createServer(app)
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

// exports.makeServerApp = makeServerApp 
