const chai = require('chai')
    .use(require('chai-as-promised'))
const expect = chai.expect;
const request = require('supertest')
const {app} = require('../server')
const {socketserver} = require('../server')
var io = require('socket.io-client');

const service = require('../api/services/helprequest.service')

const { mockClearUsers, mockUnverifiedUser, mockVerifiedUserNoAPN, mockAndReturnFullyVerifiedUser, mockMyself, mockFullyVerifiedUser, mockOtherUser, mockClearHelpRequests } = require('./mockDBOperations');
const tokenService = require('../api/services/token.service');
const { getUserByID } = require('../api/services/user.service');
const { emit } = require('superagent');

describe("Help Request Tests", function () {
    beforeEach((done) => {
        mockClearUsers()
        mockClearHelpRequests()
        done()
    })
    afterEach((done) => {
        mockClearUsers()
        mockClearHelpRequests()
        done()
    })

    describe('help request service tests', () => {
        it('should create a record for a help request', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
        }).timeout(5000)

        it('should fill in messages from new help request with the owners details', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                ["messageOne", "messageTwo"]
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
            expect(fetchedHelpRequest.messages[0].userID.toString()).to.equal(myself._id.toString())
            expect(fetchedHelpRequest.messages[0].firstName).to.equal(myself.firstName)
            expect(fetchedHelpRequest.messages[0].colorScheme).to.equal(myself.colorScheme)
            expect(fetchedHelpRequest.messages[1].userID.toString()).to.equal(myself._id.toString())
            expect(fetchedHelpRequest.messages[1].firstName).to.equal(myself.firstName)
            expect(fetchedHelpRequest.messages[1].colorScheme).to.equal(myself.colorScheme)
        })


        it('created help request ID is in respondents\' respondingHRID', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedRespondent = await getUserByID(respondent._id)
            expect(fetchedRespondent.respondingCurrentHelpRequestID.toString()).to.equal(newHelpRequest._id.toString())
        })

        it('friends not in help request', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            //valid
            var friendsNotInHelpRequest = await service.friendsNotInHelpRequest(myself.toObject())
            expect(friendsNotInHelpRequest.friends).to.not.be.null
            expect(friendsNotInHelpRequest.friends.length).to.equal(1)
            //add friend's help request ID (they are in critical situation)
            respondent.myCurrentHelpRequestID = '1234'
            await respondent.save()
            friendsNotInHelpRequest = await service.friendsNotInHelpRequest(myself.toObject())
            expect(friendsNotInHelpRequest.friends.length).to.equal(0)
            //revert
            respondent.myCurrentHelpRequestID = ""
            await respondent.save()
            //add particiation in help request
            respondent.respondingCurrentHelpRequestID = '1234'
            await respondent.save()
            friendsNotInHelpRequest = await service.friendsNotInHelpRequest(myself.toObject())
            expect(friendsNotInHelpRequest.friends.length).to.equal(0)
        })

        it('pushed location update correctly to owner', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
            const updatedHelpRequest = await service.pushLocationUpdate(
                newHelpRequest._id,
                myself._id.toString(),
                1,
                2,
                newHelpRequest
            )
            expect(updatedHelpRequest).to.not.be.null
            expect(updatedHelpRequest.location[0].latitude).to.equal(1)
            expect(updatedHelpRequest.location[0].longitude).to.equal(2)
            expect(updatedHelpRequest.location[0].time).to.not.be.null
        })

        it('pushed location update correctly to respondent', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
            const updatedHelpRequest = await service.pushLocationUpdate(
                newHelpRequest._id,
                respondent._id.toString(),
                1,
                2,
                newHelpRequest
            )
            expect(updatedHelpRequest).to.not.be.null
            expect(updatedHelpRequest.respondents[0].location[0].latitude).to.equal(1)
            expect(updatedHelpRequest.respondents[0].location[0].longitude).to.equal(2)
            expect(updatedHelpRequest.respondents[0].location[0].time).to.not.be.null
        })

        it('should update the status when respondent accepts and is on the way', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
            const updatedHelpRequest = await service.updateRespondentStatus(
                newHelpRequest,
                respondent._id.toString(),
                1,
                respondent.firstName
            )
            expect(updatedHelpRequest).to.not.be.null
            expect(updatedHelpRequest.respondents[0].status).to.equal(1)
            expect(updatedHelpRequest.currentStatus.progressStatus).to.equal(1)
        })

        it('should resolve and save help request to user', async () => {
            const myself = await mockMyself(true)
            const respondent = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: respondent._id,
                        firstName: respondent.firstName,
                        lastName: respondent.lastName,
                        colorScheme: respondent.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            const fetchedHelpRequest = await service.getHelpRequest(newHelpRequest._id)
            expect(fetchedHelpRequest).to.not.be.null
            expect(fetchedHelpRequest._id.toString()).to.equal(newHelpRequest._id.toString())
            
            const resolvedHelpRequest = await service.resolveAndSaveHelpRequest(
                fetchedHelpRequest
            )
            expect(resolvedHelpRequest).to.not.be.null
            expect(resolvedHelpRequest.isResolved).to.equal(true)
            const myselfUpdated = await getUserByID(myself._id)
            expect(myselfUpdated.myCurrentHelpRequestID).to.equal('')
            expect(myselfUpdated.helpRequests.length).to.equal(1)
            expect(myselfUpdated.helpRequests[0]._id.toString()).to.equal(fetchedHelpRequest._id.toString())
            const respondentUpdated = await getUserByID(respondent._id)
            expect(respondentUpdated.respondingCurrentHelpRequestID).to.equal('')
        })
    })

    describe('help request endpoint tests', () => {

        it("get available friends endpoint", async () => {
            //mock self and friend
            const myself = await mockMyself(true)
            const friend = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            //call available friends endpoint
            const response = await request(app)
                .get('/helprequests/availableFriends')
                .set('accesstoken', "jwt " + jwt)
                .send()
            expect(response.status).to.equal(200)
            expect(response.body).to.not.be.null
            expect(response.body.friends.length).to.equal(1)
            expect(response.body.friends[0].userID).to.equal(friend._id.toString())
            //change friend to be in a critical situation
            friend.myCurrentHelpRequestID = "123"
            await friend.save()
            //call available friends endpoint
            const response2 = await request(app)
                .get('/helprequests/availableFriends')
                .set('accesstoken', "jwt " + jwt)
                .send()
            expect(response2.status).to.equal(200)
            expect(response2.body).to.not.be.null
            expect(response2.body.friends.length).to.equal(0)
        })

        it('create help request endpoint', async () => {
            //mock self and friend
            const myself = await mockMyself(true)
            const friend = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            //call create help request endpoint
            const response = await request(app)
                .post('/helprequests')
                .set('accesstoken', "jwt " + jwt)
                .send({
                    category: 1,
                    respondents: [
                        {
                            userID: friend._id.toString(),
                            firstName: friend.firstName,
                            lastName: friend.lastName,
                            colorScheme: friend.colorScheme,
                            status: 0,
                            location: []
                        }
                    ],
                    messages: []
                })
            expect(response.status).to.equal(200)
            expect(response.body).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.undefined
            expect(response.body.helpRequestID).to.not.be.empty
            const helpRequest = await service.getHelpRequest(response.body.helpRequestID)
            expect(helpRequest).to.not.be.null
            expect(helpRequest._id.toString()).to.equal(response.body.helpRequestID)
            expect(helpRequest.category).to.equal(response.body.category)
        })

        it('accept help request endpoint', async () => {
            //mock self and friend
            const myself = await mockMyself(true)
            const friend = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const jwtFriend = tokenService.generateAuthorisedToken(friend._id)
            //create help request
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: friend._id.toString(),
                        firstName: friend.firstName,
                        lastName: friend.lastName,
                        colorScheme: friend.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            //call accept help request endpoint
            const response = await request(app)
                .post('/helprequests/' + newHelpRequest._id.toString() 
                        + "/" + friend._id.toString() + '/accept')
                .set('accesstoken', "jwt " + jwtFriend)
                .send()
            expect(response.status).to.equal(200)
            expect(response.body).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.undefined
            expect(response.body.helpRequestID).to.not.be.empty
            const helpRequest = await service.getHelpRequest(response.body.helpRequestID)
            expect(helpRequest).to.not.be.null
            expect(helpRequest._id.toString()).to.equal(response.body.helpRequestID)
            expect(helpRequest.respondents[0].status).to.equal(1)
        })

        it("resolve help request endpoint", async () => {
            //mock self and friend
            const myself = await mockMyself(true)
            const friend = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const jwtFriend = tokenService.generateAuthorisedToken(friend._id)
            //create help request
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: friend._id,
                        firstName: friend.firstName,
                        lastName: friend.lastName,
                        colorScheme: friend.colorScheme,
                        status: 1,
                        location: []
                    }
                ],
                []
            )
            //call resolve help request endpoint
            const response = await request(app)
                .post('/helprequests/' + newHelpRequest._id.toString() + '/resolve')
                .set('accesstoken', "jwt " + jwt)
                .send()
            expect(response.status).to.equal(200)
            expect(response.body).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.undefined
            expect(response.body.helpRequestID).to.not.be.empty
            const helpRequest = await service.getHelpRequest(response.body.helpRequestID)
            expect(helpRequest).to.not.be.null
            expect(helpRequest._id.toString()).to.equal(response.body.helpRequestID)
            expect(helpRequest.isResolved).to.equal(true)
        })

        it("updates location endpoint", async () => {
            //mock self and friend
            const myself = await mockMyself(true)
            const friend = await mockOtherUser(true)
            const jwt = tokenService.generateAuthorisedToken(myself._id)
            const jwtFriend = tokenService.generateAuthorisedToken(friend._id)
            //create help request
            const newHelpRequest = await service.newHelpRequest(
                myself._id,
                myself.firstName,
                1,
                [
                    {
                        userID: friend._id.toString(),
                        firstName: friend.firstName,
                        lastName: friend.lastName,
                        colorScheme: friend.colorScheme,
                        status: 1,
                        location: []
                        }
                        ],
                        []
            )
            //call update location endpoint
            const response = await request(app)
                .post('/helprequests/' + newHelpRequest._id.toString() + "/" + friend._id.toString() + '/location')
                .set('accesstoken', "jwt " + jwtFriend)
                .send({
                    latitude: 1,
                    longitude: 1
                })
            expect(response.status).to.equal(200)
            expect(response.body).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.null
            expect(response.body.helpRequestID).to.not.be.undefined
            expect(response.body.helpRequestID).to.not.be.empty
            const helpRequest = await service.getHelpRequest(response.body.helpRequestID)
            expect(helpRequest).to.not.be.null
            expect(helpRequest._id.toString()).to.equal(response.body.helpRequestID)
            expect(helpRequest.respondents[0].location[0].latitude).to.equal(1)
            expect(helpRequest.respondents[0].location[0].longitude).to.equal(1)
            //call update location for owner
            const response2 = await request(app)
            .post('/helprequests/' + newHelpRequest._id.toString() + "/" + myself._id.toString() + '/location')
                .set('accesstoken', "jwt " + jwt)
                .send({
                    latitude: 2,
                    longitude: 2
                })
            expect(response2.status).to.equal(200)
            expect(response2.body).to.not.be.null
            expect(response2.body.helpRequestID).to.not.be.null
            expect(response2.body.helpRequestID).to.not.be.undefined
            expect(response2.body.helpRequestID).to.not.be.empty
            const helpRequest2 = await service.getHelpRequest(response2.body.helpRequestID)
            expect(helpRequest2).to.not.be.null
            expect(helpRequest2._id.toString()).to.equal(response2.body.helpRequestID)
            expect(helpRequest2.location[0].latitude).to.equal(2)
            expect(helpRequest2.location[0].longitude).to.equal(2)
        })
    })

    describe('socket readers', () => {
        it("should emit update on connect with the help request data", async () => {
            await new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself(true)
                const jwt = tokenService.generateAuthorisedToken(myself._id)
                //mock other
                const other = await mockOtherUser(true)
                //create help request
                const newHelpRequest = await service.newHelpRequest(
                    myself._id,
                    myself.firstName,
                    1,
                    [
                        {
                            userID: other._id.toString(),
                            firstName: other.firstName,
                            lastName: other.lastName,
                            colorScheme: other.colorScheme,
                            status: 0,
                            location: []
                        }
                    ],
                    []
                )
                let helprequestID = newHelpRequest._id.toString()
                let url = "http://localhost:8000/ws/helprequests/" + helprequestID

                var socket = io(
                    url,
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                socket.once('connect', function () {
                    console.log('connected')
                })
                socket.once('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket.disconnect()
                    reject(err)
                })

                socket.once('update', function (data) {
                    expect(data).to.not.be.null
                    expect(data).to.not.be.undefined
                    expect(data).to.not.be.empty
                    expect(data.helpRequestID).to.equal(helprequestID)
                    expect(data.owner.userID).to.equal(myself._id.toString())
                    socket.disconnect()
                    resolve()
                })

            })
        })
    })

    describe('socket victim events', () => {

        it('can resolve a request & other respondents receive a close event', async () => {
            await new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself()
                const jwt = tokenService.generateAuthorisedToken(myself._id)
                //mock other
                const other = await mockOtherUser(true)
                const otherJWT = tokenService.generateAuthorisedToken(other._id)
                //create help request
                const newHelpRequest = await service.newHelpRequest(
                    myself._id,
                    myself.firstName,
                    1,
                    [
                        {
                            userID: other._id.toString(),
                            firstName: other.firstName,
                            lastName: other.lastName,
                            colorScheme: other.colorScheme,
                            status: 0,
                            location: []
                        }
                    ],
                    []
                )
                let helprequestID = newHelpRequest._id.toString()
                let url = "http://localhost:8000/ws/helprequests/" + helprequestID
                //connect both users to socket
                var socket = io(
                    url,
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                socket.once('connect', function () {})
                socket.once('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket.disconnect()
                    reject(err)
                })
                var socket2 = io(
                    url,
                    {
                        auth: {
                            token: otherJWT
                        }
                    }
                );
                socket2.once('connect', function () {})
                socket2.once('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket2.disconnect()
                    reject(err)
                })
                //listen for close event on socket2
                socket2.once('helprequest: close', function (data) {
                    console.log("close event received")
                    resolve()
                })
                //resolve request on socket
                socket.emit('helprequest: resolve')
            })
        })

        it('respondent can accept a request, change to ontheway and reject', async () => {
            var updated1
            var updated2
            var updated3
            await new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself()
                const jwt = tokenService.generateAuthorisedToken(myself._id)
                //mock other
                const other = await mockOtherUser(true)
                const otherJWT = tokenService.generateAuthorisedToken(other._id)
                //create help request
                const newHelpRequest = await service.newHelpRequest(
                    myself._id,
                    myself.firstName,
                    1,
                    [
                        {
                            userID: other._id.toString(),
                            firstName: other.firstName,
                            lastName: other.lastName,
                            colorScheme: other.colorScheme,
                            status: 0,
                            location: []
                        }
                    ],
                    []
                )
                let helprequestID = newHelpRequest._id.toString()
                let url = "http://localhost:8000/ws/helprequests/" + helprequestID
                //connect both users to socket
                var socket = io(
                    url,
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                socket.once('connect', function () {})
                socket.on('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket.disconnect()
                    reject(err)
                })
                var socket2 = io(
                    url,
                    {
                        auth: {
                            token: otherJWT
                        }
                    }
                );
                socket2.once('connect', function () {})
                socket2.on('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket2.disconnect()
                    reject(err)
                })
                //change status to accept
                socket2.emit('helprequest: accept', {
                    respondentID: other._id.toString(),
                    firstName: other.firstName
                })
                await new Promise(r => setTimeout(r, 500));
                //fetch help requets and check
                updated1 = await service.getHelpRequest(helprequestID)
                
                //change status to ontheway
                socket2.emit('helprequest: ontheway', {
                    respondentID: other._id.toString(),
                    firstName: other.firstName
                })
                await new Promise(r => setTimeout(r, 1000));
                //fetch help requets and check
                updated2 = await service.getHelpRequest(helprequestID)
                //change status to reject
                socket2.emit('helprequest: reject', {
                    respondentID: other._id.toString(),
                    firstName: other.firstName
                })
                await new Promise(r => setTimeout(r, 500));
                //fetch help requets and check
                updated3 = await service.getHelpRequest(helprequestID)
                resolve()
            })
            expect(updated1.respondents[0].status).to.equal(1)
            expect(updated2.respondents[0].status).to.equal(2)
            expect(updated3.respondents[0].status).to.equal(3)
        }).timeout(10000)

        it('respondent & owner can add location & a message', async () => {
            var helprequestID;
            var myUID;
            var otherUID;
            await new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself()
                myUID = myself._id.toString()
                const jwt = tokenService.generateAuthorisedToken(myself._id)
                //mock other
                const other = await mockOtherUser(true)
                otherUID = other._id.toString()
                const otherJWT = tokenService.generateAuthorisedToken(other._id)
                //create help request
                const newHelpRequest = await service.newHelpRequest(
                    myself._id,
                    myself.firstName,
                    1,
                    [
                        {
                            userID: other._id.toString(),
                            firstName: other.firstName,
                            lastName: other.lastName,
                            colorScheme: other.colorScheme,
                            status: 0,
                            location: []
                        }
                    ],
                    []
                )
                helprequestID = newHelpRequest._id.toString()
                let url = "http://localhost:8000/ws/helprequests/" + helprequestID
                //connect both users to socket
                var socket = io(
                    url,
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                socket.once('connect', function () {})
                socket.on('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket.disconnect()
                    reject(err)
                })
                var socket2 = io(
                    url,
                    {
                        auth: {
                            token: otherJWT
                        }
                    }
                );
                socket2.once('connect', function () {})
                socket2.on('connect_error', function (err) {
                    console.log('connect_error')
                    console.log(err.req);      // the request object
                    console.log(err.code);     // the error code, for example 1
                    console.log(err.message);  // the error message, for example "Session ID unknown"
                    console.log(err.context);  // some additional error context
                    socket2.disconnect()
                    reject(err)
                })
                //send location
                socket2.emit('helprequest: location', {
                    longitude: 1,
                    latitude: 1
                })
                socket.emit('helprequest: location', {
                    longitude: 2,
                    latitude: 2
                })
                //send message
                socket2.emit('helprequest: message', {
                    message: 'test message'
                })
                await new Promise(r => setTimeout(r, 100));
                socket.emit('helprequest: message', {
                    message: 'test message 2'
                })
                await new Promise(r => setTimeout(r, 100));
                socket.emit('helprequest: message', {
                    message: 'test message 3'
                })
                await new Promise(r => setTimeout(r, 1000));
                resolve()
            })
            //fetch help requets and check
            const updated = await service.getHelpRequest(helprequestID)
            expect(updated.respondents[0].location[0].longitude).to.equal(1)
            expect(updated.respondents[0].location[0].latitude).to.equal(1)
            expect(updated.messages[0].body).to.equal('test message')
            expect(updated.messages[0].userID).to.equal(otherUID)
            expect(updated.messages[1].body).to.equal('test message 2')
            expect(updated.messages[1].userID).to.equal(myUID)
            expect(updated.location[0].longitude).to.equal(2)
            expect(updated.location[0].latitude).to.equal(2)
        }).timeout(10000)

        // it('update event is broadcasted after every event', async () => {
        //     await new Promise(async (resolve, reject) => {
        //         //mock myself
        //         const myself = await mockMyself()
        //         let myUID = myself._id.toString()
        //         const jwt = tokenService.generateAuthorisedToken(myself._id)
        //         //mock other
        //         const other = await mockOtherUser(true)
        //         let otherUID = other._id.toString()
        //         const otherJWT = tokenService.generateAuthorisedToken(other._id)
        //         //create help request
        //         const newHelpRequest = await service.newHelpRequest(
        //             myself._id,
        //             myself.firstName,
        //             1,
        //             [
        //                 {
        //                     userID: other._id.toString(),
        //                     firstName: other.firstName,
        //                     lastName: other.lastName,
        //                     colorScheme: other.colorScheme,
        //                     status: 0,
        //                     location: []
        //                 }
        //             ],
        //             []
        //         )
        //         let helprequestID = newHelpRequest._id.toString()
        //         let url = "http://localhost:8000/ws/helprequests/" + helprequestID
        //         //connect both users to socket
        //         var socket = io(
        //             url,
        //             {
        //                 auth: {
        //                     token: jwt
        //                 }
        //             }
        //         );
        //         socket.once('connect', function () {})
        //         socket.on('connect_error', function (err) {
        //             console.log('connect_error in last test')
        //             console.log(err.req);      // the request object
        //             console.log(err.code);     // the error code, for example 1
        //             console.log(err.message);  // the error message, for example "Session ID unknown"
        //             console.log(err.context);  // some additional error context
        //             socket.disconnect()
        //             reject(err)
        //         })
                
        //         socket.on('update', function (payload) {
        //             console.log('update emmited to owner', payload)
        //         })
        //         var socket2 = io(
        //             url,
        //             {
        //                 auth: {
        //                     token: otherJWT
        //                 }
        //             }
        //         );
        //         socket2.once('connect', function () {})
        //         socket2.on('connect_error', function (err) {
        //             console.log('connect_error in last test')
        //             console.log(err.req);      // the request object
        //             console.log(err.code);     // the error code, for example 1
        //             console.log(err.message);  // the error message, for example "Session ID unknown"
        //             console.log(err.context);  // some additional error context
        //             socket2.disconnect()
        //             reject(err)
        //         })

        //         socket2.on('update', function (payload) {
        //             console.log('update emmited to other user', payload)
        //         })
                
        //         await new Promise(r => setTimeout(r, 600));
        //         //send location
        //         console.log('emit location')
        //         socket2.emit('helprequest: location', {
        //             longitude: 1,
        //             latitude: 1
        //         })
        //         // socket.emit('helprequest: message', {
        //         //     message: 'test message 2'
        //         // })
        //         await new Promise(r => setTimeout(r, 600));
        //     })
        // }).timeout(10000)

        // it('two users connected to same socket: IDS are stored in socket separately?', async () => {
        //     return new Promise(async (resolve, reject) => {
        //         //mock myself
        //         const myself = await mockMyself()
        //         const jwt = tokenService.generateAuthorisedToken(myself._id)
        //         //mock other
        //         const other = await mockOtherUser(true)
        //         const otherJWT = tokenService.generateAuthorisedToken(other._id)
        //         //create help request
        //         const newHelpRequest = await service.newHelpRequest(
        //             myself._id,
        //             myself.firstName,
        //             1,
        //             [
        //                 {
        //                     userID: other._id.toString(),
        //                     firstName: other.firstName,
        //                     lastName: other.lastName,
        //                     colorScheme: other.colorScheme,
        //                     status: 0,
        //                     location: []
        //                 }
        //             ],
        //             []
        //         )
        //         let helprequestID = newHelpRequest._id.toString()
        //         let url = "http://localhost:8000/ws/helprequests/" + helprequestID
        //         //connect both users to socket
        //         var socket1 = io(
        //             url,
        //             {
        //                 auth: {
        //                     token: jwt
        //                 }
        //             }
        //         );
        //         var socket2 = io(
        //             url,
        //             {
        //                 auth: {
        //                     token: otherJWT
        //                 }
        //             }
        //         );
        //         socket1.on('connect', function () {})
        //         socket1.on('connect_error', function (err) {
        //             socket1.disconnect()
        //             socket2.disconnect()
        //             reject(err)
        //         })
        //         socket2.on('connect', function () {})
        //         socket2.on('connect_error', function (err) {
        //             socket1.disconnect()
        //             socket2.disconnect()
        //             reject(err)
        //         })
        //         var storedID1;
        //         var storedID2;
        //         socket1.on('userIDTest', function (data) {
        //             console.log('update', data)
        //             storedID1 = data.userIDStored
        //         })
        //         socket2.on('userIDTest', function (data) {
        //             console.log('update', data)
        //             storedID2 = data.userIDStored
        //         })

        //         setTimeout(() => {
        //             expect(storedID1).to.not.be.null
        //             expect(storedID1).to.not.be.undefined
        //             expect(storedID1).to.not.be.empty
        //             expect(storedID2).to.not.be.null
        //             expect(storedID2).to.not.be.undefined
        //             expect(storedID2).to.not.be.empty
        //             expect(storedID1).to.not.equal(storedID2)
        //             resolve(true)
        //         }, 1500);
        //     })
        // })
    })
})