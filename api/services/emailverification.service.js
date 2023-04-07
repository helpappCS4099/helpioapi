const VerificationHash = require('../models/verificationHash.model')
const { getUserByID } = require('./user.service')
const Errors = require('../utility/errors')
const { hashPassword } = require('./auth.service')
const authConfig = require('../../config/auth.config')
const nodemailer = require("nodemailer")

/**
 * Creates a hash to be used for the verification URL
 *   
 */
exports.generateEmailVerificationHash = async () => {
    const emailVerificationHash = await hashPassword(Date.now().toString())
    const urlFriendly = emailVerificationHash.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
    return urlFriendly
}

/**
 * saves the verification hash and corresponding userID 
 * @param {*} userID 
 *   
 */
exports.setEmailVerificationHash = async (userID) => {
    const emailVerificationHash = await this.generateEmailVerificationHash()
    await this.clearEmailVerificationHash(userID)
    const verificationRecord = new VerificationHash({
        hash: emailVerificationHash,
        userID: userID
    })
    await verificationRecord.save()
    return emailVerificationHash
}

/**
 * Deletes the verification hash
 * @param {*} userID 
 */
exports.clearEmailVerificationHash = async (userID) => {
    await VerificationHash.deleteOne({userID: userID}).catch(err => console.log(err))
}

/**
 * queries the user by verification hash
 * @param {*} emailVerificationHash 
 *   
 */
exports.getUserByEmailVerificationHash = async (emailVerificationHash) => {
    const verificationRecord = await VerificationHash.findOne({hash: emailVerificationHash})
    if (verificationRecord === null) {
        return null
    }
    const user = await getUserByID(verificationRecord.userID)
    return user
}

/**
 * checks the DB for the hash and verifies the corresponding user
 * @param {*} emailVerificationHash 
 *   
 */
exports.verifyEmail = async (emailVerificationHash) => {
    const user = await this.getUserByEmailVerificationHash(emailVerificationHash)
    if (user === null) {
        throw new Errors.NoVerificationHasBeenRequestedError()
    }
    user.verified = true
    await user.save()
    this.clearEmailVerificationHash(user._id)
    return user._id
}

/**
 * Nodemailer Transporter
 */
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: authConfig.gmailAddress,
        pass: authConfig.gmailAppPassword,
    },
    secure: true,
    tls: {
        rejectUnauthorized: true    //reject non-encrypted emailing
    }
})

/**
 * function that sends an email verification email to the user via nodemailer
 * @param {*} email 
 * @param {*} emailVerificationHash 
 *   
 */
exports.sendEmailVerificationEmail = async (email, emailVerificationHash) => {
    return new Promise((resolve, reject)=> {
        const mailData = {
            from: authConfig.gmailAddress,
            to: email,
            subject: "Email Verification",
            html: `<h1>Click <a href="${authConfig.rootURL}/verification/${emailVerificationHash}">here</a> to verify your email</h1>`,
        }
        
        transporter.sendMail(mailData, (error, info)=> {
            if (error) {
                // console.log(error)
                reject(new Errors.EmailNotSentError())
            }
            resolve(true)
        })
    })
}
