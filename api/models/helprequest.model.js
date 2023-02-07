const mongoose = require("mongoose")

const HelpRequest = mongoose.model(
    "HelpRequest",
    new mongoose.Schema({
        isResolved: Boolean,
        category: Number,
        friends: [
            {
                userID: String,
                firstName: String,
                lastName: String,
                colorScheme: Number,
                status: Number,
                location: [String]
            }
        ],
        messages: [
            {
                messageID: String,
                isAudio: Boolean,
                body: String,
                data: Buffer,
                timeStamp: Date
            }
        ]
    })
)

module.exports = HelpRequest
