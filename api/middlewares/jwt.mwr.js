const { decodeToken } = require('../services/token.service')

exports.userIsEmailVerificationAuthorides = (req, res, next) => {
    try {
        const token = req.cookies.jwt
        console.lot("token:", token)
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
        if (decoded.access === "apnToken") {
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

