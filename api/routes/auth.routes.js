const controller = require("../controllers/auth.controller")
const apnController = require("../controllers/apn.controller")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        next()
    })

    app.post("/login", [], controller.login)
    app.get("/logout", [], controller.logout)
    app.post("/users", [], controller.createUser)
    app.get("/users/email", [], controller.checkEmail)
    app.get("/verification/:hash", [], controller.verifyEmail)
    app.post("/verification", [], controller.resendVerificationEmail)
    app.get("/verification", [], controller.queryVerificationStatus)
    app.post("/apntoken", [], apnController.updateAPNToken)
}