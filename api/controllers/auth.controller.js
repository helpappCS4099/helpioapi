const { comparePassword } = require("../services/auth.service")
const { sendEmailVerificationEmail, setEmailVerificationHash } = require("../services/emailverification.service")
const { getUserByEmail } = require("../services/user.service")
const { generateAPNToken, generateAuthorisedToken, generateEmailVerificationToken } = require("../services/token.service")
const { setAPNToken } = require("../services/apn.service")

exports.login = async (req, res) => {
    //retrieve email and password from request body
    const email = req.body.email
    const password = req.body.password
    //check if email and password are valid
    const user = await getUserByEmail(email)
    if (user === null) {
        console.log("no user")
        res.status(200).send({
            authenticated: false,
            message: "User not found"
        })
    }
    const userPasswordHash = user.passwordHash
    const passwordMatches = await comparePassword(password, userPasswordHash)
    if (passwordMatches === false) {
        res.status(200).send({
            authenticated: false,
            message: "Incorrect password"
        })
    }
    //determine which type of JWT to send
    if (user.verified === false) {
        //send email verification
        const emailVerificationHash = await setEmailVerificationHash(user._id)
        await sendEmailVerificationEmail(user.email, emailVerificationHash)
        //JWT for email authentication
        const emailVerificationToken = await generateEmailVerificationToken(user._id)
        res.cookie("jwt", emailVerificationToken, { httpOnly: true })
    } else if (user.deviceToken === "") {
        //JWT for apn token update
        const apnToken = await generateAPNToken(user._id)
        res.cookie("jwt", apnToken, { httpOnly: true })
    } else {
        //JWT for authorised user
        const authorisedToken = await generateAuthorisedToken(user._id)
        res.cookie("jwt", authorisedToken, { httpOnly: true })
    }
    return res.status(200).send({
        authenticated: true,
        userID: user._id,
        ...user
    })
}

exports.logout = async (req, res) => {
    //remove cookie
    res.clearCookie("jwt")
    //delete APN token
    await setAPNToken(req.userID, "")
    return res.status(200).send({authenticated: false})
}

exports.createUser = (req, res) => {
    return res.status(200).send("OK")
}

exports.verifyEmail = (req, res) => {
    return res.status(200).send("OK")
}

exports.checkEmail = (req, res) => {
    return res.status(200).send("OK")
}

exports.resendVerificationEmail = (req, res) => {
    return res.status(200).send("OK")
}

exports.queryVerificationStatus = (req, res) => {
    return res.status(200).send("OK")
}