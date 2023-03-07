const jwt = require('jsonwebtoken')
const authConfig = require('../../config/auth.config')
const Errors = require('../utility/errors')

exports.generateEmailVerificationToken = (userID) => {
    const token = jwt.sign(
        {
            userID: userID,
            access: 'emailVerification'
        }, 
        authConfig.jwtSecret, 
        {expiresIn: '10m'})
    return token
}

exports.generateAPNToken = (userID) => {
    const token = jwt.sign(
        {
            userID: userID,
            access: 'apnToken'
        },
        authConfig.jwtSecret,
        {expiresIn: '10m'})
    return token
}

exports.generateAuthorisedToken = (userID) => {
    const token = jwt.sign(
        {
            userID: userID,
            access: 'authorised'
        },
        authConfig.jwtSecret,
        {expiresIn: '180d'})
    return token
}

exports.decodeToken = (token) => {
    try {
        const decoded = jwt.verify(token, authConfig.jwtSecret)
        return decoded
    } catch(err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new Errors.TokenExpiredError("Token expired")
        } else {
            //jsonwebtokenerror; notbeforeerror; 
            throw new Errors.InvalidTokenError()
        }
    }
}

