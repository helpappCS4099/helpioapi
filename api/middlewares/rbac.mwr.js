//this function would clear a user for reading permission of the help request
//if they are one of the respondents
exports.canReadHelpRequest = (requestID, userID) => {
    //returns (Bool, {helpRequestObject})
}

//this function would clear a user for writing permission of the help request
//if they are the owner of the help request
exports.canModifyHelpRequest = (requestID, userID, helpRequest) => {
    //help request object param is optional - in case it was passed from previous read
    //returns (Bool, {helpRequestObject})
}

//this function would clear a user for adding messages to the help request
//if they are one of the respondents and they have accepted the help request
//status >= 1
exports.canAddMessageToHelpRequest = (requestID, userID, helpRequest) => {
    //help request object param is optional - in case it was passed from previous read
    //returns (Bool, {helpRequestObject})
}