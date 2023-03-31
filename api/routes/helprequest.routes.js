const controller = require("../controllers/helprequest.controller")
const { participatesInHelpRequest, isOwnerOfHelpRequest, requestIsActive, canReadHelpRequest } = require("../middlewares/help.mwr")
const { userIsAuthorised, userIDAuthorised } = require("../middlewares/jwt.mwr")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        next()
    })

    app.get(
        "/helprequests/availableFriends",
        [userIsAuthorised],
        controller.getAvailableFriends
    )
    app.post(
        "/helprequests", 
        [userIsAuthorised], 
        controller.createHelpRequest
    )
    app.post(
        "/helprequests/:requestID/:userID1/accept",
        [userIsAuthorised, userIDAuthorised, canReadHelpRequest, requestIsActive, participatesInHelpRequest],
        controller.acceptHelpRequest
    )
    app.post(
        "/helprequests/:requestID/resolve",
        [userIsAuthorised, canReadHelpRequest, requestIsActive,  isOwnerOfHelpRequest],
        controller.resolveHelpRequest
    )
    app.post(
        "/helprequests/:requestID/:userID1/location", 
        [userIsAuthorised, userIDAuthorised, canReadHelpRequest, requestIsActive, participatesInHelpRequest], 
        controller.updateLocation
    )
    app.get(
        "/helprequests/:requestID/sos",
        [userIsAuthorised, canReadHelpRequest, requestIsActive,  isOwnerOfHelpRequest],
        controller.sendSOS
    )
}