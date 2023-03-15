const io = require('socket.io');

//namespace sockets: dynamic namespace per helpReuqestID
//socket per help request in the form of /ws/helprequests/:helpRequestID
exports.helpnsp = (socket) => {

    let helpRequestID = socket.nsp.name.split('/')[3]

    console.log('connected to help request namespace: ', helpRequestID)
    
    socket.on('disconnect', () => {
        console.log('disconnected from help request namespace')
    })
}


  