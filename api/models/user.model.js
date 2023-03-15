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
        colorScheme: Number,
        friends: [
            {
                userID: String,
                status: Number,
                firstName: String,
                lastName: String,
                email: String,
                colorScheme: Number
            }
        ],
        myCurrentHelpRequestID: String,
        respondingCurrentHelpRequestID: String,
        helpRequests: [
            {
                _id: String,
                ownerUserID: String,
                isResolved: Boolean,
                category: Number,
                currentStatus: {
                    progressStatus: Number,
                    progressMessageOwner: String,
                    progressMessageRespondent: String
                },
                startTime: Date,
                endTime: Date,
                location: [
                    {
                        latitude: Number,
                        longitude: Number,
                        time: Date
                    }
                ],
                respondents: [
                    {
                        userID: String,
                        firstName: String,
                        lastName: String,
                        colorScheme: Number,
                        status: Number,
                        location: [
                            {
                                latitude: Number,
                                longitude: Number,
                                time: Date
                            }
                        ]
                    }
                ],
                messages: [
                    {
                        messageID: String,
                        userID: String,
                        firstName: String,
                        colorScheme: Number,
                        isAudio: Boolean,
                        body: String,
                        data: Buffer,
                        timeStamp: Date
                    }
                ]
            }]
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