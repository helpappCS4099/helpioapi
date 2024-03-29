const { sendUpdate, printHello } = require('../../socketserver')
const apnController = require('../controllers/apn.controller')
const { getUserByID } = require('../services/user.service')
const service = require('../services/helprequest.service')

module.exports = (socket) => {

    /**
     * function to update location via socket connection
     * @param {*} payload 
     */
    const updateLocation = async (payload) => {

        socket.helpRequest = await service.getHelpRequest(socket.helpRequest._id)

        // console.log('updating location')
        const helpRequest = socket.helpRequest

        //check if user is owner of help request
        if (socket.helpRequest.owner.userID === socket.userID) {
            //append location for owner
            helpRequest.location.push({
                latitude: payload.latitude,
                longitude: payload.longitude
            })
            socket.helpRequest = await helpRequest.save()
        } else {
            //append location for respondent
            for (let i = 0; i < helpRequest.respondents.length; i++) {
                const respondent = helpRequest.respondents[i]
                if (respondent.userID === socket.userID) {
                    respondent.location.push({
                        latitude: payload.latitude,
                        longitude: payload.longitude
                    })
                    socket.helpRequest = await helpRequest.save()
                    break
                }
            }
        }
        // console.log("calling send update")
        
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

    /**
     * function to send a message via socket connection
     * @param {*} payload 
     */
    const addMessage = async (payload) => {

        socket.helpRequest = await service.getHelpRequest(socket.helpRequest._id)

        const helpRequest = socket.helpRequest

        //check if user is owner of help request
        if (helpRequest.owner.userID === socket.userID) {
            //append message for owner
            helpRequest.messages.push({
                userID: helpRequest.owner.userID,
                body: payload.message,
                isAudio: false,
                data: null, 
                firstName: helpRequest.owner.firstName,
                lastName: helpRequest.owner.lastName,
                colorScheme: helpRequest.owner.colorScheme
            })
            socket.helpRequest = await helpRequest.save()
            
            const n = {
                status: 4,
                title: helpRequest.owner.firstName,
                body: payload.message
            }
            //send push notification to all respondents
            for (let i = 0; i < helpRequest.respondents.length; i++) {
                const respondent = helpRequest.respondents[i]
                apnController.sendNotification(respondent, n.title, n.body, n.status)
            }
        } else {
            //append message for respondent
            for (let i = 0; i < helpRequest.respondents.length; i++) {
                const respondent = helpRequest.respondents[i]
                if (respondent.userID === socket.userID) {
                    helpRequest.messages.push({
                        userID: respondent.userID,
                        body: payload.message,
                        isAudio: false,
                        data: null,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme
                    })
                    socket.helpRequest = await helpRequest.save()

                    const n = {
                        status: 4,
                        title: respondent.firstName,
                        body: payload.message
                    }
                    //send push notification to owner
                    const ownerUser = await getUserByID(helpRequest.owner.userID)
                    apnController.sendNotification(ownerUser, n.title, n.body, n.status)
                    //send to all other respondents
                    for (let i = 0; i < helpRequest.respondents.length; i++) {
                        const respondent = helpRequest.respondents[i]
                        if (respondent.userID !== socket.userID) {
                            apnController.sendNotification(respondent, n.title, n.body, n.status)
                        }
                    }
                    console.log("finished sending notifications")
                    break
                }
            }
        }

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

    //events
    /**
     * Socket location update event
     */
    socket.on('helprequest: location', async (payload) => updateLocation(payload))
    /**
     * Socket message event
     */
    socket.on('helprequest: message', async (payload) => addMessage(payload))
}