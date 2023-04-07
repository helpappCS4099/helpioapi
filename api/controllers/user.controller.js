const User = require("../models/user.model")
const { getUserByID, userIsInFriendsArray, addFriend, performSearch, resolveFriendRequest, removeFriendRecords } = require("../services/user.service")
const { sendNotification } = require("./apn.controller")

exports.getMyUserObject = async (req, res) => {
    const user = await getUserByID(req.userID)
    if (user === null) {
        return res.status(404).send({
            message: "User not found!"
        })
    }
    return res.status(200).send({
        userID: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verified: user.verified,
        friends: user.friends,
        myCurrentHelpRequestID: user.myCurrentHelpRequestID,
        respondingCurrentHelpRequestID: user.respondingCurrentHelpRequestID,
        colorScheme: user.colorScheme
    })
}

exports.getUser = async (req, res) => {
    const userID = req.params.userID
    const user = await getUserByID(userID)
    if (user === null) {
        return res.status(404).send({
            message: "User not found!"
        })
    }
    return res.status(200).send({
        userID: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verified: user.verified,
        friends: user.friends,
        myCurrentHelpRequestID: user.myCurrentHelpRequestID,
        respondingCurrentHelpRequestID: user.respondingCurrentHelpRequestID,
        colorScheme: user.colorScheme
    })
}

exports.search = async (req, res) => {
    try {
        const searchString = req.query.search
        if (searchString === undefined || searchString === "") {
            return res.status(200).send({
                searchResults: []
            })
        }
        const searchResults = await performSearch(searchString)
        // console.log(searchResults)
        return res.status(200).send({
            searchResults: searchResults
        })
    } catch(err) {
        // console.log(err)
        return res.status(500).send({
            message: "Internal server error"
        })
    }
}

//NEEDS REFACTORING
exports.friendRequest = async (req, res) => {
    try {
        const userID1 = req.userID
        const userID2 = req.params.userID2
        const user1 = await getUserByID(userID1)
        if (user1 === null) {
            return res.status(404).send({
                message: "User not found!"
            })
        }
        const user2 = await getUserByID(userID2)
        if (user2 === null) {
            return res.status(404).send({
                message: "User not found!"
            })
        }
        //check for mutual presence in each other's friend lists
        let user1Status = userIsInFriendsArray(user1, userID2)
        let user2Status = userIsInFriendsArray(user2, userID1)
        //status 0 means they are not friends
        if (user1Status === 0 &&
            user2Status === 0) {
            //users are not friends, perform FriendFlow1
            const updatedUser1 = await addFriend(user1, user2, 2)
            const updatedUser2 = await addFriend(user2, user1, 3)

            //send push notification to user2
            let title = updatedUser1.firstName + " has sent you a friend request!"
            let body = "Accept the request to be each others emergency contacts."
            let deepLinkStatus = 2 //status 2 means deep link to friends page
            await sendNotification(user2, title, body, deepLinkStatus)

            return res.status(200).send({
                message: "Friend request sent!",
                user: {
                    userID: updatedUser1._id,
                    firstName: updatedUser1.firstName,
                    lastName: updatedUser1.lastName,
                    email: updatedUser1.email,
                    verified: updatedUser1.verified,
                    friends: updatedUser1.friends,
                    myCurrentHelpRequestID: updatedUser1.myCurrentHelpRequestID,
                    respondingCurrentHelpRequestID: updatedUser1.respondingCurrentHelpRequestID,
                    colorScheme: updatedUser1.colorScheme
                }
            })
        } else if (user1Status === 1 &&
                    user2Status === 1) {
            //status 1 means they are already friends
            //users are friends, return error
            return res.status(400).send({
                message: "Users are already friends!"
            })
        } else {
            //here status can be a combination of 2 and 3
            //meaning one of the users has a pending request
            //users requests pending, perform FriendFlow2
            const updatedUser = await resolveFriendRequest(user1, user2, user1Status, user2Status)
            if (updatedUser) {
                //send push notification to user2
                let title = updatedUser.firstName + " has accepted your friend request!"
                let body = "You can now both be emergency contacts for each other."
                let deepLinkStatus = 2 //status 2 means deep link to friends page
                await sendNotification(user2, title, body, deepLinkStatus)
                //PUSH HERE
                return res.status(200).send({
                    message: "Friend request accepted!",
                    user: {
                        userID: updatedUser._id,
                        firstName: updatedUser.firstName,
                        lastName: updatedUser.lastName,
                        email: updatedUser.email,
                        verified: updatedUser.verified,
                        friends: updatedUser.friends,
                        myCurrentHelpRequestID: updatedUser.myCurrentHelpRequestID,
                        respondingCurrentHelpRequestID: updatedUser.respondingCurrentHelpRequestID,
                        colorScheme: updatedUser.colorScheme
                    }
                })

            } else {
                //return error message
                return res.status(500).send({
                    message: "Could not add friend. Please try again later."
                })
            }
        }


    } catch(err) {
        // console.log(err)
        return res.status(500).send({
            message: "Internal server error"
        })
    }
}

exports.deleteFriend = async (req, res) => {
    try {
        const userID1 = req.userID
        const userID2 = req.params.userID2
        const user1 = await getUserByID(userID1)
        if (user1 === null) {
            return res.status(404).send({
                message: "User not found!"
            })
        }
        const user2 = await getUserByID(userID2)
        if (user2 === null) {
            return res.status(404).send({
                message: "User not found!"
            })
        }
        //check that users are not engaged in a help request
        if (user1.myCurrentHelpRequestID !== "" || user2.myCurrentHelpRequestID !== "") {
            return res.status(400).send({
                message: "Your friend is in a critical situation now. You will be able to remove them from your friends list after the help request is completed."
            })
        }
        const updatedUser1 = await removeFriendRecords(user1, user2)
        return res.status(200).send({
            message: "Friend removed!",
            user: {
                userID: updatedUser1._id,
                firstName: updatedUser1.firstName,
                lastName: updatedUser1.lastName,
                email: updatedUser1.email,
                verified: updatedUser1.verified,
                friends: updatedUser1.friends,
                myCurrentHelpRequestID: updatedUser1.myCurrentHelpRequestID,
                respondingCurrentHelpRequestID: updatedUser1.respondingCurrentHelpRequestID,
                colorScheme: updatedUser1.colorScheme
            }
        })
    } catch (err) {
        // console.log(err)
        return res.status(500).send({
            message: "Internal server error"
        })
    }
}
