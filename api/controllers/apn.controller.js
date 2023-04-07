var apn = require("apn")
const apnConfig = require("../../config/apn.config")
const { generateAuthorisedToken } = require("../services/token.service")
var join = require('path').join
const {setAPNToken} = require("../services/apn.service")

var options = {
    token: {
        key: join(__dirname, apnConfig.keyPath),
        keyId: apnConfig.keyId,
        teamId: apnConfig.teamId
    },
    // proxy: {
    //     host: "helpapp.loca.lt",
    //     port: 8000
    // },
    production: false
}

/**
 * APN apple push notification service provider
 */
exports.apnProvider = new apn.Provider(options)

exports.updateAPNToken = async (req, res) => {
    try {
        const userID = req.userID
        const token = req.body.deviceToken
        await setAPNToken(userID, token)
        //set cleared JWT cookie
        const authorisedToken = generateAuthorisedToken(userID)
        res.cookie("jwt", authorisedToken, { httpOnly: true })
        return res.status(200).send({
            apnTokenWasUpdated: true,
            jwt: authorisedToken
        })
    } catch(error) {
        // console.log(error)
        return res.status(500).send({apnTokenWasUpdated: false})
    }
}

/**
 * Reusable method for sending a push notification to the user
 * @param {UserModel} toUser 
 * @param {String} title 
 * @param {String} body 
 * @param {Int} status 
 *   
 */
exports.sendNotification = async (toUser, title, body, status) => {
    if (toUser.deviceToken === undefined || toUser.deviceToken === "") {
        // console.log("User has no device token")
        return
    }
    try {
        const note = new apn.Notification()
        note.expiry = Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
        note.badge = 1
        note.sound = "ping.aiff"
        note.alert = { title: title, body: body }
        note.topic = apnConfig.bundleID
        note.payload = {
            "s": status
        }
        const result = await this.apnProvider.send(note, [toUser.deviceToken])
        return
    } catch (error) {
        // console.log(error)
        return
    }
}
