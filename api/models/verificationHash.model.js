const mongoose = require("mongoose")

const VerificationHash = mongoose.model(
    "VerificationHash",
    new mongoose.Schema({
        hash: String,
        userID: String
    })
)

module.exports = VerificationHash