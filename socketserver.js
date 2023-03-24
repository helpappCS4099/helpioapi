const io = require('socket.io');
const HelpRequest = require('./api/models/helprequest.model');
const registerSharedSocketHandlers = require('./api/socketHandlers/shared.handlers');
const registerVictimSocketHandlers = require('./api/socketHandlers/victim.handlers');
const registerRespondentSocketHandlers = require('./api/socketHandlers/respondent.handlers');
const { HelpRequestChangeStream } = require('./server');

//namespace sockets: dynamic namespace per helpReuqestID
//socket per help request in the form of /ws/helprequests/:helpRequestID
exports.helpnsp = (socket) => {

    let helpRequestID = socket.nsp.name.split('/')[3]
    socket.helpRequestID = helpRequestID

    socket.join(helpRequestID)

    console.log('connected to help request namespace: ', helpRequestID)
    console.log('userID stored in socket: ', socket.userID)

    socket.emit('update', {
        helpRequestID: helpRequestID,
        owner: {
            userID: socket.helpRequest.owner.userID,
            firstName: socket.helpRequest.owner.firstName,
            lastName: socket.helpRequest.owner.lastName,
            colorScheme: socket.helpRequest.owner.colorScheme
        },
        isResolved: socket.helpRequest.isResolved,
        category: socket.helpRequest.category,
        currentStatus: socket.helpRequest.currentStatus,
        startTime: socket.helpRequest.startTime,
        endTime: socket.helpRequest.endTime,
        location: socket.helpRequest.location,
        respondents: socket.helpRequest.respondents,
        messages: socket.helpRequest.messages
    })
    
    socket.on('disconnect', () => {
        console.log('disconnected from help request namespace: ', helpRequestID)
    })

    //register event handlers
    registerRespondentSocketHandlers(socket)
    registerVictimSocketHandlers(socket)
    registerSharedSocketHandlers(socket)

    if (process.env.NODE_ENV !== 'test') {
        HelpRequestChangeStream.on('change', (change) => {
            if (change.operationType === 'update' && change.documentKey._id.toString() === helpRequestID) {
                console.log('change stream triggered')
                socket.broadcast.emit('update', {
                    helpRequestID: change.fullDocument._id.toString(),
                    owner: {
                        userID: change.fullDocument.owner.userID,
                        firstName: change.fullDocument.owner.firstName,
                        lastName: change.fullDocument.owner.lastName,
                        colorScheme: change.fullDocument.owner.colorScheme
                    },
                    isResolved: change.fullDocument.isResolved,
                    category: change.fullDocument.category,
                    currentStatus: change.fullDocument.currentStatus,
                    startTime: change.fullDocument.startTime,
                    endTime: change.fullDocument.endTime,
                    location: change.fullDocument.location,
                    respondents: change.fullDocument.respondents,
                    messages: change.fullDocument.messages
                })
            }
        })
    }
}
