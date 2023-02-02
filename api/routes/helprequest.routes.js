const controller = require("../controllers/helprequest.controller")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        next()
    })

    app.post("/helprequests/new", [], controller.createHelpRequest)
    app.get("/helprequests", [], controller.getMyHelpRequests)
    app.get("/helprequests/:requestID", [], controller.getHelpRequest)
    app.get("/helprequests/current", [], controller.getCurrentHelpRequest)
    app.patch("/helprequests/current", [], controller.updateOnHelpRequest)
    app.patch("/helprequests/:requestID/me", [], controller.respondToHelpRequest)
    app.post("/helprequests/current/messages", [], controller.addNewMessage)
}