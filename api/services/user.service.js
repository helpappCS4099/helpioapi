const User = require("../models/user.model")

exports.matchEmailInDB = (email) => {
    
}

//function to add new user to the mongoose db
exports.addNewUser = async (email, passwordHash, firstName, lastName) => {
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
