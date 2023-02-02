const mongoose = require("mongoose")

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        deviceToken: String,
        email: String,
        passwordHash: String,
        verified: Boolean,
        friends: [
            {
                userID: String,
                status: Number,
                firstName: String,
                lastName: String,
                emailPrefix: String,
                colorScheme: Number
            }
        ],
        currentHelpRequestID: String,
        helpRequests: [String]
    })
)

module.exports = User