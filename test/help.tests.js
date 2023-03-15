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
    
    // describe('socket tests', () => {
    //     it('should connect to socket', async () => {
    //         return new Promise(async (resolve, reject) => {
    //             //mock myself
    //             const myself = await mockMyself()
    //             const jwt = tokenService.generateAuthorisedToken(myself._id)

    //             var socket = io(
    //                 'http://localhost:8000/ws/helprequests/1234',
    //                 {
    //                     auth: {
    //                         token: jwt
    //                     }
    //                 }
    //             );
    //             socket.on('connect', function () {
    //                 console.log('connected')
    //                 socket.disconnect()
    //                 resolve(true)
    //             })
    //             socket.on('connect_error', function (err) {
    //                 console.log('connect_error', err)
    //                 socket.disconnect()
    //                 reject(err)
    //             })
    //         })
    //     })

    //     it ('can connect to two different namespace sockets', async () => {
    //         return new Promise(async (resolve, reject) => {
    //             //mock myself
    //             const myself = await mockMyself()
    //             const jwt = tokenService.generateAuthorisedToken(myself._id)
    //             var socket1 = io(
    //                 'http://localhost:8000/ws/helprequests/1234',
    //                 {
    //                     auth: {
    //                         token: jwt
    //                     }
    //                 }
    //             );
    //             var socket2 = io(
    //                 'http://localhost:8000/ws/helprequests/5678',
    //                 {
    //                     auth: {
    //                         token: jwt
    //                     }
    //             })
    //             socket1.on('connect', function () {})
    //             socket1.on('connect_error', function (err) {
    //                 socket1.disconnect()
    //                 reject(err)
    //             })
    //             socket2.on('connect', function () {
    //                 socket1.disconnect()
    //                 socket2.disconnect()
    //                 resolve(true)
    //             })
    //             socket2.on('connect_error', function (err) {
    //                 console.log('connect_error', err)
    //                 socket1.disconnect()
    //                 socket2.disconnect()
    //                 reject(err)
    //             })
    //         })})
    // })

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
            expect(friendsNotInHelpRequest).to.not.be.null
            expect(friendsNotInHelpRequest.length).to.equal(1)
            //add friend's help request ID (they are in critical situation)
            respondent.myCurrentHelpRequestID = '1234'
            await respondent.save()
            friendsNotInHelpRequest = await service.friendsNotInHelpRequest(myself.toObject())
            expect(friendsNotInHelpRequest.length).to.equal(0)
            //revert
            respondent.myCurrentHelpRequestID = ""
            await respondent.save()
            //add particiation in help request
            respondent.respondingCurrentHelpRequestID = '1234'
            await respondent.save()
            friendsNotInHelpRequest = await service.friendsNotInHelpRequest(myself.toObject())
            expect(friendsNotInHelpRequest.length).to.equal(0)
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
})