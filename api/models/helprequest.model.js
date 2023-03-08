const mongoose = require("mongoose")

const HelpRequest = mongoose.model(
    "HelpRequest",
    new mongoose.Schema({
        authorUserID: String,
        isResolved: Boolean,
        category: Number,
        location: [String],
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
