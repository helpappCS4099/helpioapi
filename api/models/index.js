const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const db = {};

db.mongoose = mongoose

db.user = require("./user.model")
db.helprequest = require("./helprequest.model")

module.exports = db