const db = require("../api/models")
const mongoose = require("mongoose")
const { hashPassword } = require("../api/services/auth.service")
const User = db.user
const HelpRequest = db.helprequest

//function to add a mock User record to the mongoose db
exports.mockUnverifiedUser = async function mockUnverifiedUser(email, password) {

    const passwordHash = await hashPassword(password ? password : "passwordHash")

    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: email ? email : "testemail@email.com",
        passwordHash: passwordHash,
        verified: false,
        friends: [],
        myCurrentHelpRequestID: "",
        respondingCurrentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "",
        colorScheme: 1
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockVerifiedUserNoAPN = async function mockVerifiedUserNoAPN(email, password) {
    const passwordHash = await hashPassword(password ? password : "passwordHash")
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: email ? email : "testemail@email.com",
        passwordHash: passwordHash,
        verified: true,
        friends: [],
        myCurrentHelpRequestID: "",
        respondingCurrentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "",
        colorScheme: 1
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockFullyVerifiedUser = async function mockFullyVerifiedUser(email, password) {
    const passwordHash = await hashPassword(password ? password : "passwordHash")
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        firstName: "Archimedes",
        lastName: "User",
        email: email ? email : "testemail@email.com",
        passwordHash: passwordHash,
        verified: true,
        friends: [],
        myCurrentHelpRequestID: "",
        respondingCurrentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "ejejndbf33000APNTDeviceToken",
        colorScheme: 1
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockAndReturnFullyVerifiedUser = async function mockFullyVerifiedUser(email, password) {
    const passwordHash = await hashPassword(password ? password : "passwordHash")
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        firstName: "Archimedes",
        lastName: "User",
        email: email ? email : "testemail@email.com",
        passwordHash: passwordHash,
        verified: true,
        friends: [],
        myCurrentHelpRequestID: "",
        respondingCurrentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "ejejndbf33000APNTDeviceToken",
        colorScheme: 1
    })
    await mockUser.save()
    return mockUser
}

exports.mockClearUsers = async function mockClearUsers() {
    await User.deleteMany()
}

exports.mockMyself = async (hasFriend = false) => {
    const newUser = new User({
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799431111"),
        helpRequests: [],
        firstName: 'Artem',
        lastName: 'Rakhmanov',
        email: 'ar303@st-andrews.ac.uk',
        passwordHash: '$2b$10$PHEbziarPdZzmzaSRatqhejOHQkJsPvkC4F0NvSJeRJeSQJclGsgW',
        verified: true,
        friends: !hasFriend ? [] : [
            {
               userID: "507f1f77bcf86cd799439011",
                firstName: "Altyn",
                lastName: "Orazgulyyeva",
                email: "ao20@st-andrews.ac.uk",
                colorScheme: 1,
                status: 1
            }
        ],
        myCurrentHelpRequestID: '',
        respondingCurrentHelpRequestID: "",
        deviceToken: '8b03743418cd4582187113508f690a262b93cd0048cae1994ed88eab94071d65',
        colorScheme: 1
    })
    await newUser.save()
    return newUser
}

exports.mockOtherUser = async (hasFriend = true) => {
    const newUser = new User({
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        helpRequests: [],
        firstName: 'Altyn',
        lastName: 'Orazgulyyeva',
        email: 'ao20@st-andrews.ac.uk',
        passwordHash: '$2b$10$PHEbziarPdZzmzaSRatqhejOHQkJsPvkC4F0NvSJeRJeSQJclGsgW',
        verified: true,
        friends: [
            {   
                userID: "507f1f77bcf86cd799431111",
                firstName: "Artem",
                lastName: "Rakhmanov",
                email: "ar303@st-andrews.ac.uk",
                colorScheme: 1,
                status: 1
            }
        ],
        myCurrentHelpRequestID: '',
        respondingCurrentHelpRequestID: "",
        deviceToken: '8b03743418cd4582187113508f690a262b93cd0048cae1994ed88eab94071d66',
        colorScheme: 1
    })
    await newUser.save()
    return newUser
}

exports.mockClearHelpRequests = async () => {
    await HelpRequest.deleteMany()
}