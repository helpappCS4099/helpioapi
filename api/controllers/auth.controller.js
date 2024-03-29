const { comparePassword, hashPassword } = require("../services/auth.service")
const { sendEmailVerificationEmail, setEmailVerificationHash, verifyEmail, getUserByEmailVerificationHash } = require("../services/emailverification.service")
const { getUserByEmail, addNewUser, getUserByID, matchEmailInDB } = require("../services/user.service")
const { generateAPNToken, generateAuthorisedToken, generateEmailVerificationToken } = require("../services/token.service")
const { setAPNToken } = require("../services/apn.service")

/**
 * Request hadling: login
 * @param {*} req 
 * @param {*} res 
 *   
 */
exports.login = async (req, res) => {
    //retrieve email and password from request body
    const email = req.body.email
    const password = req.body.password
    //check if email and password are valid
    const user = await getUserByEmail(email)
    if (user === null) {
        // console.log("no user")
        return res.status(200).send({
            authenticated: false,
            message: "User not found"
        })
    }
    // console.log(user)
    const userPasswordHash = user.passwordHash
    const passwordMatches = await comparePassword(password, userPasswordHash)
    if (passwordMatches === false) {
        return res.status(200).send({
            authenticated: false,
            message: "Incorrect password"
        })
    }
    //determine which type of JWT to send
    var token;
    if (user.verified === false) {
        //send email verification
        const emailVerificationHash = await setEmailVerificationHash(user._id)
        await sendEmailVerificationEmail(user.email, emailVerificationHash)
        //JWT for email authentication
        token = generateEmailVerificationToken(user._id)
        res.cookie("jwt", token, { httpOnly: true })
    } else {
        //JWT for verified & authorised user
        token = generateAuthorisedToken(user._id)
        res.cookie("jwt", token, { httpOnly: true })
    }
    return res.status(200).send({
        authenticated: true,
        jwt: token,
        userID: user._id,
        user: {
            userID: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            verified: user.verified,
            friends: user.friends,
            myCurrentHelpRequestID: user.myCurrentHelpRequestID,
            respondingCurrentHelpRequestID: user.respondingCurrentHelpRequestID,
            colorScheme: user.colorScheme
        }
    })
}

/**
 * Request handing: logout
 * @param {*} req 
 * @param {*} res 
 *   
 */
exports.logout = async (req, res) => {
    //remove cookie
    res.clearCookie("jwt")
    //delete APN token
    await setAPNToken(req.userID, "")
    // console.log("logged out")
    return res.status(200).send({authenticated: false})
}

/**
 * Request handling: create user
 * @param {*} req 
 * @param {*} res 
 *   
 */
exports.createUser = async (req, res) => {
    try {
        //hash password
        // console.log("create user")
        // console.log(req.body)
        const passwordHash = await hashPassword(req.body.password)
        // console.log("password hashed")
        //create user
        const userID = await addNewUser(
            req.body.email,
            passwordHash,
            req.body.firstName,
            req.body.lastName
            )
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

/**
 * Request handing for user verificaion
 * @param {*} req 
 * @param {*} res 
 *   
 */
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

/**
 * Request handing of resending email for verification
 * @param {*} req 
 * @param {*} res 
 *   
 */
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
        // console.log(error)
        return res.status(200).send({hashWasRefreshed: false})
    }
}

/**
 * Request handing for checking if the user is verified
 * @param {*} req 
 * @param {*} res 
 *   
 */
exports.queryVerificationStatus = async (req, res) => {
    try {
        const userID = req.userID
        const user = await getUserByID(userID)
        if (user.verified === true) {
            //JWT for apn token update
            const apnToken = generateAPNToken(userID)
            const authorisedToken = generateAuthorisedToken(userID)
            res.cookie("jwt", apnToken, { httpOnly: true })
            return res.status(200).send({
                userIsVerified: true,
                jwt: authorisedToken
            })
        } else {
            // res.cookie("jwt", req.cookies.jwt, { httpOnly: true })
            return res.status(200).send({userIsVerified: false})
        }
    } catch (error) {
        // console.log(error)
        return res.status(403).send({userIsVerified: false})
    }
}

/**
 * Request handing for checking if email can be used for a new account
 * @param {*} req 
 * @param {*} res 
 *   
 */
exports.checkEmail = async (req, res) => {
    try {
        const email = req.query.email
        const emailIsValid = String(email).toLowerCase().match(/^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@st-andrews.ac.uk$/)
        if (emailIsValid === false) {
            return res.status(200).send({emailIsAvailable
                : false})
        }
        const user = await matchEmailInDB(email)
        if (user === true) {
            return res.status(200).send({emailIsAvailable: false})
        } else {
            return res.status(200).send({emailIsAvailable: true})
        }
    } catch (error) {
        // console.log(error)
        //revise this error management
        return res.status(200).send({emailIsAvailable: false})
    }
}