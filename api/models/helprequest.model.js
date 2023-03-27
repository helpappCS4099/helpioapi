const mongoose = require("mongoose")

const HelpRequest = mongoose.model(
    "HelpRequest",
    new mongoose.Schema({
        owner: {
            userID: String,
            firstName: String,
            lastName: String,
            colorScheme: Number
        },
        isResolved: Boolean,
        category: Number,
        currentStatus: {
            progressStatus: Number,
            progressMessageOwner: String,
            progressMessageRespondent: String
        },
        startTime: { type: Date, default: Date.now },
        endTime: Date,
        location: [
            {
                latitude: Number,
                longitude: Number,
                time: { type: Date, default: Date.now }
            }
        ],
        respondents: [
            {
                userID: String,
                firstName: String,
                lastName: String,
                colorScheme: Number,
                status: Number,
                deviceToken: String,
                location: [
                    {
                        latitude: Number,
                        longitude: Number,
                        time: { type: Date, default: Date.now }
                    }
                ]
            }
        ],
        messages: [
            {
                messageID: {type: String, required: true, unique: true, default: mongoose.Types.ObjectId},
                userID: String,
                firstName: String,
                colorScheme: Number,
                isAudio: Boolean,
                body: String,
                data: Buffer,
                timeStamp: { type: Date, required: true, default: Date.now }
            }
        ]
    })
)

module.exports = HelpRequest
