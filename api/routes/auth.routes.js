const controller = require("../controllers/auth.controller")
const apnController = require("../controllers/apn.controller")
const { userIsAuthorised, userIsEmailVerificationAuthorised, userIsAPNTokenAuthorised } = require("../middlewares/jwt.mwr")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        res.header( 'Access-Control-Allow-Credentials',true);
        next()
    })

    app.post("/login", [], controller.login)
    app.get("/logout", [userIsAuthorised], controller.logout)
    app.post("/users", [], controller.createUser)
    app.get("/users/email", [], controller.checkEmail)
    app.get("/verification/:hash", [], controller.performEmailVerification)
    app.post("/verification", [userIsEmailVerificationAuthorised], controller.resendVerificationEmail)
    app.get("/verification", [userIsEmailVerificationAuthorised], controller.queryVerificationStatus)
    app.post("/apntoken", [userIsAPNTokenAuthorised], apnController.updateAPNToken)
}