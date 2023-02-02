var apn = require("apn")
const apnConfig = require("../../config/apn.config")

var options = {
    token: {
        key: apnConfig.key,
        keyId: apnConfig.keyId,
        teamId: apnConfig.teamId
    },
    // proxy: {
    //     host: "",
    //     port: 
    // },
    production: false
}

export var apnProvider = new apn.Provider(options)