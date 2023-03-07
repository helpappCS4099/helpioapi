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
        const token = req.cookies.jwt
        if (!token) {
            return res.status(403).send({
                message: "No token provided!"
            })
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
        const token = req.cookies.jwt
        if (!token) {
            return res.status(403).send({
                message: "No token provided!"
            })
        }
        //decode token
        const decoded = decodeToken(token)
        if (decoded.access === "authorised") {
            //carry user id into request for convinience
            req.userID = decoded.userID
            next()
            return
        } else {
            return res.status(401).send({
                message: "Unauthorized!"
            })
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

