const db = require("../api/models")
const mongoose = require("mongoose")
const User = db.user

//function to add a mock User record to the mongoose db
exports.mockUnverifiedUser = async function mockUnverifiedUser(email) {
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: email ? email : "testemail@email.com",
        passwordHash: "passwordHash",
        verified: false,
        friends: [],
        currentHelpRequestID: "",
        helpRequests: [],
        deviceToken: ""
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockVerifiedUserNoAPN = async function mockVerifiedUserNoAPN(email) {
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: email ? email : "testemail@email.com",
        passwordHash: "passwordHash",
        verified: true,
        friends: [],
        currentHelpRequestID: "",
        helpRequests: [],
        deviceToken: ""
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockFullyVerifiedUser = async function mockFullyVerifiedUser(email) {
    const mockUser = new User({
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: email ? email : "testemail@email.com",
        passwordHash: "passwordHash",
        verified: true,
        friends: [],
        currentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "ejejndbf33000APNTDeviceToken"
    })
    await mockUser.save()
    return mockUser._id
}

exports.mockClearUsers = async function mockClearUsers() {
    await User.deleteMany()
}
