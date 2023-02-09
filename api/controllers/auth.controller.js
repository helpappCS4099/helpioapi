const { comparePassword } = require("../services/auth.service")
const { sendEmailVerificationEmail, setEmailVerificationHash, verifyEmail, getUserByEmailVerificationHash } = require("../services/emailverification.service")
const { getUserByEmail, addNewUser, getUserByID } = require("../services/user.service")
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

exports.createUser = async (req, res) => {
    try {
        //create user
        const userID = await addNewUser(
            req.body.email,
            req.body.password,
            req.body.firstName,
            req.body.lastName,)
        //email verification
        const emailVerificationHash = await setEmailVerificationHash(userID)
        await sendEmailVerificationEmail(req.body.email, emailVerificationHash)
        //JWT for email authentication
        const emailVerificationToken = await generateEmailVerificationToken(userID)
        res.cookie("jwt", emailVerificationToken, { httpOnly: true })
        return res.status(200).send({
            userWasCreated: true,
            userID: userID
        })
    } catch (error) {
        return res.status(200).send({userWasCreated: false})
    }
}

exports.performEmailVerification = async (req, res) => {
    try {
        const hash = req.params.hash
        const userID = await verifyEmail(hash)
        return res.status(200).send({userIsVerified: true})
    } catch (error) {
        // console.log(error)
        return res.status(403).send({userIsVerified: false})
    }
}

exports.resendVerificationEmail = async (req, res) => {
    try {
        const userID = req.userID
        //email verification
        const emailVerificationHash = await setEmailVerificationHash(userID)
        const user = await getUserByID(userID)
        await sendEmailVerificationEmail(user.email, emailVerificationHash)
        //JWT for email authentication
        const emailVerificationToken = generateEmailVerificationToken(userID)
        res.cookie("jwt", emailVerificationToken, { httpOnly: true })
        return res.status(200).send({hashWasRefreshed: true})
    } catch (error) {
        console.log(error)
        return res.status(200).send({hashWasRefreshed: false})
    }
}

exports.queryVerificationStatus = async (req, res) => {
    try {
        const userID = req.userID
        const user = await getUserByID(userID)
        if (user.verified === true) {
            //JWT for apn token update
            const apnToken = generateAPNToken(userID)
            res.cookie("jwt", apnToken, { httpOnly: true })
            return res.status(200).send({userIsVerified: true})
        } else {
            res.cookie("jwt", req.cookies.jwt, { httpOnly: true })
            return res.status(200).send({userIsVerified: false})
        }
    } catch (error) {
        console.log(error)
        return res.status(403).send({userIsVerified: false})
    }
}

exports.checkEmail = (req, res) => {
    return res.status(200).send("OK")
}