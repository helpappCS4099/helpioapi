const {getUserByID} = require("./user.service")
const Errors = require("../utility/errors")

/**
 * Hey, this is a comment.
 * @async
 * @param {*} userID 
 * @param {*} token 
 */
exports.setAPNToken = async (userID, token) => {
    const user = await getUserByID(userID)
    if (user === null) {
        throw new Errors.UserNotFoundError("User not found")
    }
    if (user.verified === false) {
        throw new Errors.UserNotVerifiedError("User not verified")
    }
    user.deviceToken = token
    await user.save()
}

// exports.sendNotification = async (toUser, title, body) => {

// }