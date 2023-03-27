const HelpRequest = require("../models/helprequest.model")
const { getUserByID } = require("./user.service")


exports.getHelpRequest = async (helpRequestID) => {
    const helpRequest = await HelpRequest.findById(helpRequestID)
    return helpRequest
}

exports.friendsNotInHelpRequest = async (user) => {
    var friends = user.friends.filter(friend => friend.status === 1)
    if (friends === undefined) {
        return {
            message: "You need to have approved friends to create a help request.",
            friends: []
        }
    }
    for (let i = 0; i < friends.length; i++) {
        const friend = friends[i]
        const friendUser = await getUserByID(friend.userID)
        if (friendUser.myCurrentHelpRequestID !== '' || friendUser.respondingCurrentHelpRequestID !== "") {
            friends.splice(i, 1)
        }
    }
    return friends !== [] ? 
        {
            message: "",
            friends: friends
        } 
        : 
        {
            message: "All your friends are currently helping someone else or are in a critical situation.",
            friends: []
        }
}

exports.newHelpRequest = async (
    userID,
    firstName,
    category,
    respondents,
    messages
) => {

    //get user by userID
    const user = await getUserByID(userID)
    //transform messages to the DB format
    var messagesDB = []
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        messagesDB.push({
            userID: userID,
            firstName: firstName,
            colorScheme: user.colorScheme,
            isAudio: false,
            body: message,
            data: null
        })
    }

    const helpRequest = new HelpRequest({
        owner: {
            userID: userID,
            firstName: firstName,
            colorScheme: user.colorScheme,
            lastName: user.lastName
        },
        isResolved: false,
        category: category,
        currentStatus: {
            progressStatus: 0,
            progressMessageOwner: this.getStatusMessageTuple(0, firstName)[0],
            progressMessageRespondent: this.getStatusMessageTuple(0, firstName)[1]
        },
        startTime: Date.now(),
        endTime: null,
        location: [],
        respondents: respondents,
        messages: messagesDB
    })
    await helpRequest.save()
    //for each respondent, add request ID to respondent current HR ID
    for (let i = 0; i < respondents.length; i++) {
        const respondent = respondents[i]
        const respondentUser = await getUserByID(respondent.userID)
        respondentUser.respondingCurrentHelpRequestID = helpRequest._id.toString()
        await respondentUser.save()
    }
    return helpRequest
}

exports.pushLocationUpdate = async (
    helpRequestID,
    userID,
    latitude,
    longitude,
    helpRequestObject
) => {
    //determine if the user is the owner or a respondent
    if (helpRequestObject.owner.userID === userID) {
        //owner
        helpRequestObject.location.push({
            latitude: latitude,
            longitude: longitude,
            time: Date.now()
        })
    } else {
        //respondent
        for (let i = 0; i < helpRequestObject.respondents.length; i++) {
            const respondent = helpRequestObject.respondents[i]
            if (respondent.userID === userID) {
                respondent.location.push({
                    latitude: latitude,
                    longitude: longitude,
                    time: Date.now()
                })
                break
            }
        }
    }
    return await helpRequestObject.save()

}

//generates a tuple of the status message for the owner and the respondent
//based on the change
exports.getStatusMessageTuple = (
    status,
    firstName,
    helpRequestID,
    helpRequestObject,
    respondent,
) => {
    if (status === 0) {
        //request created -> notifying respondents
        return [
            "Notifications sent. Hold on for a moment",
            firstName + "is calling for help right now"
        ]
    } else if (status === 1) {
        //respondent accepted
        return [
            "Your friends are responding now. Hold on for a moment",
            "Friends are starting to respond"
        ]
    } else if (status === 2) {
        return [
            "Your friends are on their way. They will be there soon",
            "Friends are on their way"
        ]
    }
}

exports.updateRespondentStatus = async (
    helpRequestObject,
    userID,
    status,
    firstName
) => {
    for (let i = 0; i < helpRequestObject.respondents.length; i++) {
        const respondent = helpRequestObject.respondents[i]
        if (respondent.userID === userID) {
            respondent.status = status
            if (status === -1) break
            if (status < helpRequestObject.currentStatus.progressStatus) break
            helpRequestObject.currentStatus.progressStatus = status
            helpRequestObject.currentStatus.progressMessageOwner = this.getStatusMessageTuple(
                status,
                firstName
            )[0]
            helpRequestObject.currentStatus.progressMessageRespondent = this.getStatusMessageTuple(
                status,
                firstName
            )[1]
            break
        }
    }
    return await helpRequestObject.save()
}



exports.resolveAndSaveHelpRequest = async (helpRequestObject) => {
    helpRequestObject.isResolved = true
    helpRequestObject.endTime = Date.now()
    await helpRequestObject.save()
    //save to user
    const ownerUser = await getUserByID(helpRequestObject.owner.userID)
    ownerUser.myCurrentHelpRequestID = ""
    ownerUser.helpRequests.push(helpRequestObject.toObject())
    await ownerUser.save()
    //save to respondents
    for (let i = 0; i < helpRequestObject.respondents.length; i++) {
        const respondent = helpRequestObject.respondents[i]
        const respondentUser = await getUserByID(respondent.userID)
        respondentUser.respondingCurrentHelpRequestID = ""
        respondentUser.helpRequests.push(helpRequestObject.toObject())
        await respondentUser.save()
    }
    return helpRequestObject
}