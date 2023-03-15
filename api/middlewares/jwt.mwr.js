const { decodeToken } = require('../services/token.service')

exports.userIsEmailVerificationAuthorised = (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(403).send({
                message: "No token provided!"
            })
        }
        //decode token
        const decoded = decodeToken(token)
        if (decoded.access === "emailVerification") {
            //carry user id into request for convinience
            req.userID = decoded.userID
            next()
            return
        } else {
            return res.status(401).send({
                message: "Unauthorized!"
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

exports.userIsAPNTokenAuthorised = (req, res, next) => {
    try {
        var token = req.cookies.jwt
        const header = req.headers.accesstoken
        if (token === undefined && header === undefined) {
            throw new Error("No token provided!")
        }
        if (header !== undefined) {
            token = getJWTFromAuthorizationHeader(header)
        }
        //decode token
        const decoded = decodeToken(token)
        if (decoded.access === "apnToken" || decoded.access === "authorised") {
            //carry user id into request for convinience
            req.userID = decoded.userID
            next()
            return
        } else {
            return res.status(401).send({
                message: "Unauthorized!"
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

exports.userIsAuthorised = (req, res, next) => {
    try {
        const accessTokenHeader = req.headers.accesstoken
        if (!accessTokenHeader && process.env.NODE_ENV !== 'test') {
            throw new Error("No auth header provided!")
        }
        var token;
        if (process.env.NODE_ENV === 'test') {
            token = req.cookies.jwt   
        } else {
            token = getJWTFromAuthorizationHeader(accessTokenHeader)
        }
        if (!token) {
            throw new Error("No auth header provided!")
        }
        //decode token
        const decoded = decodeToken(token)
        if (decoded.access === "authorised") {
            //carry user id into request for convinience
            req.userID = decoded.userID
            next()
            return
        } else {
            throw new Error("Unauthorized!")
        }
    } catch(error) {
        console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

exports.userIDAuthorised = (req, res, next) => {
    //extract userID from path parameters
    const userID = req.params.userID1
    if (userID === req.userID) {
        next()
        return
    } else {
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

function getJWTFromAuthorizationHeader(header) {
    return header.split(" ")[1]
}

exports.socketJwtAuth = (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
        return next(new Error('Authentication error'))
    }
    try {
        const decoded = decodeToken(token)
        if (decoded.access === "authorised") {
            //carry user id into request for convinience
            socket.userID = decoded.userID
            next()
            return
        } else {
            throw new Error("Unauthorized!")
        }
    }
    catch (error) {
        console.log(error)
        return next(new Error('Authentication error'))
    }
}

