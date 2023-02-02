const express = require('express') // Call express
const http = require('http')
const db = require("./api/models")
const dbConfig = require('./config/db.config')

const app = express()

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

db.mongoose
    .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(()=> {
        console.log("Successfully connected to MongoDB")
        initial()
    })
    .catch(err=> {
        console.error("Connection Error", err)
        process.exit()
    })

function initial() {
    //setup upon load
}

//--------------ROUTES------------------



var server = http.createServer(app)

const port = process.env.PORT || 3000
server.listen(port)
console.log('RESTful API demo server started on: ' + port)


