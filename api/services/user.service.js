const User = require("../models/user.model")
const mongoose = require("mongoose")
const { UserWithThisEmailAlreadyExistsError, InvalidUserDetailsError } = require("../utility/errors")

exports.matchEmailInDB = async (email) => {
    const user = await User.findOne({email: email}).exec()
    if (user === null) {
        return false
    }
    return true
}

exports.getUserByEmail = async (email) => {
    const user = await User.findOne({email: email}).exec()
    return user
}

//function to add new user to the mongoose db
exports.addNewUser = async (email, passwordHash, firstName, lastName) => {
    const emailExists = await this.matchEmailInDB(email)
    if (emailExists) {
        throw new UserWithThisEmailAlreadyExistsError()
    }
    if (passwordHash === "" || firstName === "" || lastName === "" || email === "") {
        throw new InvalidUserDetailsError()
    }
    const emailIsValid = String(email).toLowerCase().match(/^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@st-andrews.ac.uk$/)
    if (!emailIsValid) {
        throw new InvalidUserDetailsError()
    }
    const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        firstname: firstName,
        lastname: lastName,
        email: email,
        passwordHash: passwordHash,
        verified: false,
        friends: [],
        currentHelpRequestID: "",
        helpRequests: [],
        deviceToken: ""
    })
    await newUser.save()
    return newUser._id
}

//function to remove a user from the mongoose db
exports.removeUser = async (userID) => {
    try {
        await User.deleteOne({_id: userID})
        return true
    } catch(err) {
        return false
    }
}

exports.getUserByID = async (userID) => {
    try {
        const user = await User.findById(userID).exec()
        return user
    }
    catch(err) {
        console.log(err)
        return null
    }
}
