const { decodeToken } = require('../services/token.service')

/**
 * Middleware checking if token is cleared for email verification
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 *   
 */
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
        // console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

/**
 * Middleware checking if token is cleared for APN token updating
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 *   
 */
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
        // console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

/**
 * Middleware checking user being verified and with access to the app
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 *   
 */
exports.userIsAuthorised = (req, res, next) => {
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
        if (decoded.access === "authorised") {
            //carry user id into request for convinience
            req.userID = decoded.userID
            next()
            return
        } else {
            throw new Error("Unauthorized!")
        }
    } catch(error) {
        // console.log(error)
        return res.status(401).send({
            message: "Unauthorized!"
        })
    }
}

/**
 * Middleware checking if the token encoded ID corresponds to the URI path userID1 parameter
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 *   
 */
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

/**
 * utility method for retrieving a bearer token from the http header
 * @param {*} header 
 *   
 */
function getJWTFromAuthorizationHeader(header) {
    return header.split(" ")[1]
}

/**
 * Middleware checking if token is cleared for app use for sockets
 * @param {*} socket 
 * @param {*} next 
 *   
 */
exports.socketJwtAuth = (socket, next) => {
    // console.log("socketJwtAuth")
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
            return next(new Error('Not Authorized'))
        }
    }
    catch (error) {
        // console.log(error)
        return next(new Error('Authentication error'))
    }
}

