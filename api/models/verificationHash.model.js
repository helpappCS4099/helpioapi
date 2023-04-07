const mongoose = require("mongoose")

/**
 * Verification Hash Model
 */
const VerificationHash = mongoose.model(
    "VerificationHash",
    new mongoose.Schema({
        hash: String,
        userID: String
    })
)

module.exports = VerificationHash