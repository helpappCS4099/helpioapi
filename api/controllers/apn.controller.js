var apn = require("apn")
const apnConfig = require("../../config/apn.config")
var join = require('path').join

var options = {
    token: {
        key: join(__dirname, apnConfig.keyPath),
        keyId: apnConfig.keyId,
        teamId: apnConfig.teamId
    },
    // proxy: {
    //     host: "",
    //     port: 
    // },
    production: false
}

exports.apnProvider = new apn.Provider(options)

exports.updateAPNToken = (req, res) => {
    
}