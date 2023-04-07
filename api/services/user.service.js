const User = require("../models/user.model")
const mongoose = require("mongoose")
const { UserWithThisEmailAlreadyExistsError, InvalidUserDetailsError } = require("../utility/errors")

/**
 * Checks if email is present for any user record
 * @param {*} email 
 *   
 */
exports.matchEmailInDB = async (email) => {
    const user = await User.findOne({email: email}).exec()
    if (user === null) {
        return false
    }
    return true
}

/**
 * retrieves a user object from DB
 * @param {*} email 
 *   
 */
exports.getUserByEmail = async (email) => {
    const user = await User.findOne({email: email}).exec()
    return user
}

/**
 * function to add new user to the mongoose db
 * @param {*} email 
 * @param {*} passwordHash 
 * @param {*} firstName 
 * @param {*} lastName 
 *   
 */
exports.addNewUser = async (email, passwordHash, firstName, lastName) => {
    const emailExists = await this.matchEmailInDB(email)
    if (emailExists) {
        throw new UserWithThisEmailAlreadyExistsError()
    }
    // console.log("email is valid")
    if (passwordHash === "" || firstName === "" || lastName === "" || email === "") {
        throw new InvalidUserDetailsError()
    }
    // console.log("fields are valid")
    const emailIsValid = String(email).toLowerCase().match(/^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@st-andrews.ac.uk$/)
    if (!emailIsValid) {
        throw new InvalidUserDetailsError()
    }
    // console.log("email is valid")
    //randomly assign color scheme
    let colorSchemeCode = Math.floor(Math.random() * 5)
    const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        firstName: firstName,
        lastName: lastName,
        email: email,
        passwordHash: passwordHash,
        verified: false,
        friends: [],
        myCurrentHelpRequestID: "",
        respondingCurrentHelpRequestID: "",
        helpRequests: [],
        deviceToken: "",
        colorScheme: colorSchemeCode
    })
    await newUser.save()
    // console.log("user saved", newUser)
    return newUser._id
}

/**
 * function to remove a user from the mongoose db
 * @param {*} userID 
 *   
 */
exports.removeUser = async (userID) => {
    try {
        await User.deleteOne({_id: userID})
        return true
    } catch(err) {
        return false
    }
}

/**
 * Retrieves the user by User ID
 * @param {*} userID 
 *   
 */
exports.getUserByID = async (userID) => {
    try {
        const user = await User.findById(userID).exec()
        return user
    }
    catch(err) {
        // console.log(err)
        return null
    }
}

/**
 * friend functionality, returns friend status, if not present - status is 0
 * @param {*} user 
 * @param {*} friendID 
 *   
 */
exports.userIsInFriendsArray = (user, friendID) => {
    const friend = user.friends.find(friend => friend.userID === friendID)
    if (friend === undefined) {
        return 0
    }
    return friend.status
}

/**
 * Method for setting the status to the user objects
 * @param {*} user 
 * @param {*} friend 
 * @param {*} status 
 *   
 */
exports.addFriend = async (user, friend, status) => {
    const friendObject = {
        userID: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        colorScheme: friend.colorScheme,
        status: status,
        email: friend.email,
    }
    if (user.friends === undefined) {
        user.friends = [friendObject]
    } else {
        user.friends.push(friendObject)
    }
    await user.save()
    return user
}

/**
 * this function is used to validate friend request and make users friends
 * FriendFlow 2 - see code design notes
 * returns new user object if successful, undef if not
 * @param {*} user1 
 * @param {*} user2 
 * @param {*} status1 
 * @param {*} status2 
 *   
 */
exports.resolveFriendRequest = async (user1, user2, status1, status2) => {
    //resolution requires status1 to be 3 and status2 to be 2 (user 1 adds back)
    if (status1 !== 3 || status2 !== 2) {
        return
    }
    try {
        //update user1
        let user1FriendIndex = user1.friends.findIndex(friend => friend.userID.toString() === user2._id.toString())
        user1.friends[user1FriendIndex].status = 1
        //update user2
        let user2FriendIndex = user2.friends.findIndex(friend => friend.userID.toString() === user1._id.toString())
        user2.friends[user2FriendIndex].status = 1
        //save both users
        await user1.save()
        await user2.save()
        return user1
    } catch(err) {
        // console.log(err)
        return
    }
}

/**
 * Performs an index search over the DB
 * @param {*} searchString 
 *   
 */
exports.performSearch = async (searchString) => {
    try {
        var searchResults = await User.find({$text: {$search: searchString}}).exec()
        if (searchResults.length === 0) {
            //perform regex search (inefficient) over name, email, lastName
            const regexSearchResults = await User.find({
                $or: [
                    {firstName: {$regex: searchString, $options: "i"}},
                    {lastName: {$regex: searchString, $options: "i"}},
                    {email: {$regex: searchString, $options: "i"}}
                ]
            }).exec()
            searchResults = regexSearchResults
        }
        // console.log("searchRes", searchResults)
        searchResults = searchResults.map(function(model) { return model.toObject(); })
        return searchResults.map(({
            _id: userID,
            ...rest
          }) => ({
            userID,
            ...rest
          }));
    } catch(err) {
        // console.log(err)
        return []
    }
}

/**
 * Removes friend mutually for both users
 * @param {*} user 
 * @param {*} friend 
 *   
 */
exports.removeFriendRecords = async (user, friend) => {
    //find each other in friends array and remove
    const userFriendIndex = user.friends.findIndex(friend => friend.userID.toString() === friend._id.toString())
    const friendFriendIndex = friend.friends.findIndex(friend => friend.userID.toString() === user._id.toString())
    user.friends.splice(userFriendIndex, 1)
    friend.friends.splice(friendFriendIndex, 1)
    //save both users
    await user.save()
    await friend.save()
    return user
}