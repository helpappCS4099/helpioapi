const { socketIsOwnerOfHelpRequest } = require("../middlewares/help.mwr")
const service = require('../services/helprequest.service')
const apnController = require('../controllers/apn.controller')

module.exports = (socket) => {

    /**
     * function to resolve the help requets via socket connection
     * @param {*} payload 
     */
    const resolveHelpRequest = (payload) => {
        socketIsOwnerOfHelpRequest(socket, async () => {
            socket.helpRequest = await service.resolveAndSaveHelpRequest(socket.helpRequest)
            //send push notifications to all respondents
            for (let i = 0; i < socket.helpRequest.respondents.length; i++) {
                const respondent = socket.helpRequest.respondents[i]
                const n = {
                    status: 4,
                    title: socket.helpRequest.owner.firstName + " is now safe.",
                    body: "Thank you for your help."
                }
                apnController.sendNotification(respondent, n.title, n.body, n.status)
            }
            
            //emit 'close' event
            socket.emit('helprequest: close')
            socket.to(socket.helpRequest._id.toString()).emit('helprequest: close')
        })
    }


    /**
     * Socket event for resolving help request
     */
    socket.on('helprequest: resolve', () => {
        resolveHelpRequest(socket.payload)
    })
}