const mongoose = require("mongoose")

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        deviceToken: String,
        email: String,
        passwordHash: String,
        firstName: String,
        lastName: String,
        verified: Boolean,
        friends: [
            {
                userID: String,
                status: Number,
                firstName: String,
                lastName: String,
                email: String,
                // colorScheme: Number
            }
        ],
        currentHelpRequestID: String,
        helpRequests: [String]
    })
)
User.schema.index(
    {
        email: 'text', 
        firstName: 'text', 
        lastName: 'text'
    },
    {
        weights: {
            email: 5,
            firstName: 3,
            lastName: 3
        }
    })

User.createIndexes()

module.exports = User