const controller = require("../controllers/user.controller")
const { userIsAuthorised, userIDAuthorised } = require("../middlewares/jwt.mwr")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        next()
    })

    app.get("/users/me", [userIsAuthorised], controller.getMyUserObject)
    app.get("/users/:userID", [userIsAuthorised], controller.getUser)
    app.get("/users", [userIsAuthorised], controller.search)
    app.post("/users/:userID1/friends/:userID2", [userIsAuthorised, userIDAuthorised], controller.friendRequest)
    app.delete("/users/:userID1/friends/:userID2", [userIsAuthorised, userIDAuthorised], controller.deleteFriend)
}