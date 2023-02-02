const controller = require("../controllers/user.controller")

module.exports = function(app) {
    app.use(function(req,res,next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        )
        next()
    })

    app.get("/users/me", [], controller.getMyUserObject)
    app.get("/users/:userID", [], controller.getUser)
    app.get("/users/:userID/friends", [], controller.getUserFriends)
    app.get("/users/me/friends", [], controller.getMyFriends)
    app.get("/users", [], controller.search)
    app.post("/users/:userID1/friends/:userID2", [], controller.addFriend)
    app.delete("/users/:userID1/friends/:userID2", [], controller.deleteFriend)
}