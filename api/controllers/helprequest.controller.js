const { friendsNotInHelpRequest, newHelpRequest, updateRespondentStatus, resolveAndSaveHelpRequest, pushLocationUpdate } = require("../services/helprequest.service")
const { getUserByID } = require("../services/user.service")
const { sendNotification } = require("./apn.controller")

exports.getAvailableFriends = async (req, res) => {
    try {
        //get user id from request
        const userID = req.userID
        //get user from database
        const user = await getUserByID(userID)
        
        let availableFriends = await friendsNotInHelpRequest(user)

        res.status(200).send({
            message: availableFriends.message,
            friends: availableFriends.friends
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "Something went wrong."
        })
    }
}

exports.createHelpRequest = async (req, res) => {
    //get user id from request
    try {
        const userID = req.userID
        const user = await getUserByID(userID)
        const category = req.body.category
        const respondents = req.body.respondents
        const messages = req.body.messages
        // create help request
        const helpRequest = await newHelpRequest(userID, 
                                                user.firstName, 
                                                category, 
                                                respondents, 
                                                messages
        )
        console.log(helpRequest)
        //update user's current help request ID
        user.myCurrentHelpRequestID = helpRequest._id.toString()
        await user.save()
        //send notifications to all respondents
        for (let i = 0; i < respondents.length; i++) {
            const respondent = respondents[i]
            const respondentUser = await getUserByID(respondent.userID)
            //send notification to respondent
            const n = {
                status: 4,
                title: user.firstName + " needs your help right now.",
                body: "Please respond urgently."
            }
            await sendNotification(respondentUser, n.title, n.body, n.status)
        }
        //send response
        res.status(200).send({
            helpRequestID: helpRequest._id,
            messages: helpRequest.messages,
            owner: {
                userID: helpRequest.owner.userID,
                firstName: helpRequest.owner.firstName,
                lastName: helpRequest.owner.lastName,
                colorScheme: helpRequest.owner.colorScheme
            },
            isResolved: helpRequest.isResolved,
            category: helpRequest.category,
            currentStatus: helpRequest.currentStatus,
            startTime: helpRequest.startTime,
            endTime: helpRequest.endTime,
            location: helpRequest.location,
            respondents: helpRequest.respondents
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

exports.acceptHelpRequest = async (req, res) => {
    try {
        const helpRequest = req.helpRequest
        const userID = req.userID
        let respondentIndex = helpRequest.respondents.findIndex(r => r.userID === userID)
        if (respondentIndex === -1) {
            res.status(400).send({
                message: "You are not a respondent to this help request."
            })
            return
        }
        const updatedHelpRequest = await updateRespondentStatus(helpRequest, userID, 1)

        //send notification to owner
        let name = helpRequest.respondents[respondentIndex].firstName
        const ownerUser = await getUserByID(helpRequest.owner.userID)
        let title = name + " has responded to your help request."
        let body = "Please check your app for more details."
        let status = 4
        await sendNotification(ownerUser, title, body, status)

        res.status(200).send({
            helpRequestID: updatedHelpRequest._id,
            messages: updatedHelpRequest.messages,
            owner: {
                userID: helpRequest.owner.userID,
                firstName: helpRequest.owner.firstName,
                lastName: helpRequest.owner.lastName,
                colorScheme: helpRequest.owner.colorScheme
            },
            isResolved: updatedHelpRequest.isResolved,
            category: updatedHelpRequest.category,
            currentStatus: updatedHelpRequest.currentStatus,
            startTime: updatedHelpRequest.startTime,
            endTime: updatedHelpRequest.endTime,
            location: updatedHelpRequest.location,
            respondents: updatedHelpRequest.respondents
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

exports.resolveHelpRequest = async (req, res) => {
    try {
        var helpRequest = req.helpRequest
        
        helpRequest = await resolveAndSaveHelpRequest(helpRequest)

        //notify all respondents
        let title = helpRequest.owner.firstName + " is now safe"
        let body = "Thank you for your help."
        let status = 1
        for (let i = 0; i < helpRequest.respondents.length; i++) {
            const respondent = helpRequest.respondents[i]
            const respondentUser = await getUserByID(respondent.userID)
            await sendNotification(respondentUser, title, body, status)
        }

        res.status(200).send({
            helpRequestID: helpRequest._id,
            messages: helpRequest.messages,
            owner: {
                userID: helpRequest.owner.userID,
                firstName: helpRequest.owner.firstName,
                lastName: helpRequest.owner.lastName,
                colorScheme: helpRequest.owner.colorScheme
            },
            isResolved: helpRequest.isResolved,
            category: helpRequest.category,
            currentStatus: helpRequest.currentStatus,
            startTime: helpRequest.startTime,
            endTime: helpRequest.endTime,
            location: helpRequest.location,
            respondents: helpRequest.respondents
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Internal Server Error"
        })
    }
}

exports.updateLocation = async (req, res) => {
    try {
        var helpRequest = req.helpRequest
        const userID = req.userID
        const longitude = req.body.longitude
        const latitude = req.body.latitude
        
        helpRequest = await pushLocationUpdate(
            helpRequest._id.toString(),
            userID,
            latitude,
            longitude,
            helpRequest
        )

        res.status(200).send({
            helpRequestID: helpRequest._id,
            messages: helpRequest.messages,
            owner: {
                userID: helpRequest.owner.userID,
                firstName: helpRequest.owner.firstName,
                lastName: helpRequest.owner.lastName,
                colorScheme: helpRequest.owner.colorScheme
            },
            isResolved: helpRequest.isResolved,
            category: helpRequest.category,
            currentStatus: helpRequest.currentStatus,
            startTime: helpRequest.startTime,
            endTime: helpRequest.endTime,
            location: helpRequest.location,
            respondents: helpRequest.respondents
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Internal Server Error"
        })
    }
}


