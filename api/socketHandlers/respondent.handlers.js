const service = require('../services/helprequest.service')
const { sendNotification } = require('../controllers/apn.controller')
const { sendUpdate } = require('../../socketserver')
const { getUserByID } = require('../services/user.service')

module.exports = (socket) => {

    const updateStatus = async (payload, status) => {        

        //confirm payload ID matches the token
        if (payload.respondentID !== socket.userID) {
            console.log('payload ID does not match token ID')
            return
        }

        socket.helpRequest = await service.updateRespondentStatus(
            socket.helpRequest,
            payload.respondentID,
            status,
            payload.firstName
        )

        //notify owner of help request
        var message;
        var body;
        if (status === 1) {
            message = payload.firstName + " accepted."
            body = "Open the app to see their location."
        } else if (status === 2) {
            message = payload.firstName + " is on the way."
            body = "Open the app to see how close they are."
        } else if (status === -1) {
            message = payload.firstName + " rejected."
            body = "Open the app to see other respondents."
        }
        const n = {
            status: 4,
            title: message,
            body: body
        }
        const ownerUser =  await getUserByID(socket.helpRequest.owner.userID)
        await sendNotification(ownerUser, n.title, n.body, n.status)
        const helpRequest = socket.helpRequest
        socket.to(helpRequest._id.toString()).emit('update', {
            helpRequestID: helpRequest._id,
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
            respondents: helpRequest.respondents,
            messages: helpRequest.messages
        })
    }

    //socket events
    socket.on('helprequest: accept', async (payload) => {
        let status = 1
        await updateStatus(payload, status)
    })
    socket.on('helprequest: reject', async (payload) => {
        let status = -1
        console.log("rejecting help request")
        await updateStatus(payload, status)
    })
    socket.on('helprequest: ontheway', async (payload) => {
        let status = 2
        await updateStatus(payload, status)
    })
}