//this function would clear a user for reading permission of the help request

const { getHelpRequest } = require("../services/helprequest.service")

//if they are one of the respondents
exports.canReadHelpRequest = async (req, res, next) => {
    const helpRequestID = req.params.requestID
    const userID = req.userID
    const helpRequest = await getHelpRequest(helpRequestID)
    if (helpRequest === null) {
        return res.status(404).send({
            message: "Help request not found."
        })
    }
    req.helpRequest = helpRequest
    if (helpRequest.owner.userID === userID) {
        return next()
    }
    const respondents = helpRequest.respondents
    for (let i = 0; i < respondents.length; i++) {
        if (respondents[i].userID === userID) {
            return next()
        }
    }
    return res.status(403).send({
        message: "You do not have permission to read this help request."
    })
}

//this function would clear a user for writing permission of the help request
//if they are the owner of the help request
exports.isOwnerOfHelpRequest = (req, res, next) => {
    const helpRequest = req.helpRequest
    const userID = req.userID
    if (helpRequest.owner.userID === userID) {
        return next()
    }
    return res.status(403).send({
        message: "You do not have permission to write to this help request."
    })
}

//respondent
exports.participatesInHelpRequest = (req, res, next) => {
    const helpRequest = req.helpRequest
    const userID = req.userID
    const respondents = helpRequest.respondents
    if (helpRequest.owner.userID === userID) {
        return next()
    }
    for (let i = 0; i < respondents.length; i++) {
        if (respondents[i].userID === userID) {
            return next()
        }
    }
    return res.status(403).send({
        message: "You do not have permission to write to this help request."
    })
}

//this function would clear a user for adding messages to the help request
//if they are one of the respondents and they have accepted the help request
//status >= 1
exports.canAddMessageToHelpRequest = (req, res, next) => {
    
}

exports.requestIsActive = (req, res, next) => {
    const helpRequest = req.helpRequest
    if (helpRequest.isResolved === false) {
        return next()
    }
    return res.status(403).send({
        message: "You cannot write to this help request because it has been resolved."
    })
}

//WEBSOCKET
exports.socketCanReadHelpRequest = async (socket, next) => {
    const helpRequestID = socket.nsp.name.split('/')[3]
    const userID = socket.userID
    const helpRequest = await getHelpRequest(helpRequestID)
    socket.helpRequest = helpRequest
    if (helpRequest === null) {
        return next(new Error("Help request not found."))
    }
    if (helpRequest.owner.userID === userID) {
        return next()
    }
    const respondents = helpRequest.respondents
    for (let i = 0; i < respondents.length; i++) {
        if (respondents[i].userID === userID) {
            return next()
        }
    }
    return next(new Error("You do not have permission to read this help request."))
}

exports.socketHelpRequestIsActive = (socket, next) => {
    const helpRequest = socket.helpRequest
    if (helpRequest.isResolved === false) {
        return next()
    }
    return next(new Error("You cannot write to this help request because it has been resolved."))
}

exports.socketIsOwnerOfHelpRequest = (socket, next) => {
    const helpRequest = socket.helpRequest
    const userID = socket.userID
    if (helpRequest.owner.userID === userID) {
        return next()
    }
    return next(new Error("You do not have permission to write to this help request."))
}