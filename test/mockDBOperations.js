const db = require("../api/models")
const mongoose = require("mongoose")
const { hashPassword } = require("../api/services/auth.service")
const User = db.user

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
        deviceToken: ""
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
        deviceToken: ""
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
        deviceToken: "ejejndbf33000APNTDeviceToken"
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
        deviceToken: "ejejndbf33000APNTDeviceToken"
    })
    await mockUser.save()
    return mockUser
}

exports.mockClearUsers = async function mockClearUsers() {
    await User.deleteMany()
}

exports.mockMyself = async () => {
    const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        helpRequests: [],
        firstName: 'Artem',
        lastName: 'Rakhmanov',
        email: 'ar303@st-andrews.ac.uk',
        passwordHash: '$2b$10$PHEbziarPdZzmzaSRatqhejOHQkJsPvkC4F0NvSJeRJeSQJclGsgW',
        verified: true,
        friends: [],
        myCurrentHelpRequestID: '',
        respondingCurrentHelpRequestID: "",
        deviceToken: '8b03743418cd4582187113508f690a262b93cd0048cae1994ed88eab94071d65',
    })
    await newUser.save()
    return newUser
}