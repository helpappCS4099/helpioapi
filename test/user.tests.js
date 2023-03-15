const chai = require('chai')
    .use(require('chai-as-promised'))
const expect = chai.expect;
const request = require('supertest')
const { assert } = require('chai')
const {app} = require('../server')

const { mockClearUsers, mockUnverifiedUser, mockVerifiedUserNoAPN, mockAndReturnFullyVerifiedUser, mockMyself } = require('./mockDBOperations');
const { sendNotification } = require('../api/controllers/apn.controller');
const userController = require('../api/controllers/user.controller');
const { performSearch } = require('../api/services/user.service');
const userService = require('../api/services/user.service');
const tokenService = require('../api/services/token.service');

describe("User Tests", () => {
    beforeEach((done) => {
        mockClearUsers()
        done()
    })
    afterEach((done) => {
        mockClearUsers()
        done()
    })

    describe('User/friends Object Functions', () => {

        it('Friend request function updates fields correctly', async () => {
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //add otherUser to my friends list
            const updatedMyself = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser = await userService.addFriend(otherUser, myself, 3)
            //check if otherUser is in my friends list
            expect(updatedMyself.friends).to.have.lengthOf(1)
            expect(updatedMyself.friends[0].userID.toString()).to.equal(otherUser._id.toString())
            expect(updatedMyself.friends[0].status).to.equal(2)
            //check if my id is in otherUser's friend requests list
            expect(updatedOtherUser.friends).to.have.lengthOf(1)
            expect(updatedOtherUser.friends[0].userID.toString()).to.equal(myself._id.toString())
            expect(updatedOtherUser.friends[0].status).to.equal(3)
        })

        it('userIsInFriendsArray returns accurate statuses', async () => {
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()

            //check that the statuses are 0 - as users do not exist in friends array
            const myselfStatus1 = await userService.userIsInFriendsArray(myself, otherUser._id.toString())
            const otherUserStatus1 = await userService.userIsInFriendsArray(otherUser, myself._id.toString())
            expect(myselfStatus1).to.equal(0)
            expect(otherUserStatus1).to.equal(0)

            //add otherUser to my friends list
            const updatedMyself = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser = await userService.addFriend(otherUser, myself, 3)
            
            //check that the statuses returned are correct
            const myselfStatus = await userService.userIsInFriendsArray(updatedMyself, updatedOtherUser._id.toString())
            const otherUserStatus = await userService.userIsInFriendsArray(updatedOtherUser, updatedMyself._id.toString())
            expect(myselfStatus).to.equal(2)
            expect(otherUserStatus).to.equal(3)
        })

        it('Friend request can be resolved with correct resulting statuses', async () => {
            // mock myself and another user and add each other to friends 
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            const updatedMyself = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser = await userService.addFriend(otherUser, myself, 3)
            const myselfStatus = await userService.userIsInFriendsArray(updatedMyself, updatedOtherUser._id.toString())
            const otherUserStatus = await userService.userIsInFriendsArray(updatedOtherUser, updatedMyself._id.toString())
            //resolve the friend request, values are swapped as the function is called from the other user's perspective
            const resolvedOtherUser = await userService.resolveFriendRequest(updatedOtherUser, updatedMyself, otherUserStatus, myselfStatus)
            //resolved should not be undefined and should have a status of 1
            expect(resolvedOtherUser).to.not.be.undefined
            expect(resolvedOtherUser.friends[0].status).to.equal(1)
        })

        it('Friend request wont be resolved if statuses do not represent incoming friend request', async () => {
            // mock myself and another user and add each other to friends 
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            const updatedMyself = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser = await userService.addFriend(otherUser, myself, 3)
            //resolve the friend request, values are swapped as the function is called from the other user's perspective
            const case1 = await userService.resolveFriendRequest(updatedOtherUser, updatedMyself, 2, 2)
            const case2 = await userService.resolveFriendRequest(updatedOtherUser, updatedMyself, 3, 3)
            const case3 = await userService.resolveFriendRequest(updatedOtherUser, updatedMyself, 1, 1)
            const case4 = await userService.resolveFriendRequest(updatedOtherUser, updatedMyself, 2, 3)
            //resolved should be undefined
            expect(case1).to.be.undefined
            expect(case2).to.be.undefined
            expect(case3).to.be.undefined
            expect(case4).to.be.undefined
        })

        it('Friends can be removed', async () => {
            // mock myself and another user and add each other to friends 
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            const updatedMyself = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser = await userService.addFriend(otherUser, myself, 3)
            //cancel the friend request, values are swapped as the function is called from the other user's perspective
            const myselfWithoutFriend = await userService.removeFriendRecords(updatedMyself, updatedOtherUser)
            //check not undefined and friend is not in the friends array
            expect(myselfWithoutFriend).to.not.be.undefined
            expect(myselfWithoutFriend.friends).to.be.empty
            //add each other again but now resolve friend request and then delete
            const updatedMyself2 = await userService.addFriend(myself, otherUser, 2)
            const updatedOtherUser2 = await userService.addFriend(otherUser, myself, 3)
            const resolvedOtherUser = await userService.resolveFriendRequest(updatedOtherUser2, updatedMyself2, 3, 2)
            const otherWithoutFriend = await userService.removeFriendRecords(resolvedOtherUser, updatedMyself2)
            //check not undefined and friend is not in the friends array
            expect(otherWithoutFriend).to.not.be.undefined
            expect(otherWithoutFriend.friends).to.be.empty
        })
    })

    describe('User/friends Object Endpoints', () => {
        it('Send a friend request', async () => {
            //mock myself and another user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const otherToken = tokenService.generateAuthorisedToken(otherUser._id.toString())
            //send friend request
            const response = 
            await request(app)
                    .post('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response.status).to.equal(200)
            //check that the friend request was added to the other user's friends array
            const updatedOtherUser = await userService.getUserByID(otherUser._id.toString())
            expect(updatedOtherUser.friends).to.have.lengthOf(1)
            expect(updatedOtherUser.friends[0].status).to.equal(3)
            //check that myself has a record of the friend request
            const updatedMyself = await userService.getUserByID(myself._id.toString())
            expect(updatedMyself.friends).to.have.lengthOf(1)
            expect(updatedMyself.friends[0].status).to.equal(2)
        })

        it('Send a friend request to self', async () => {
            //mock myself and another user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const otherToken = tokenService.generateAuthorisedToken(otherUser._id.toString())
            //send friend request
            const response = 
            await request(app)
                    .post('/users/' + otherUser._id.toString() + '/friends/' + myself._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + otherToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response.status).to.equal(200)
            //check that the friend request was added to the other user's friends array
            const updatedOtherUser = await userService.getUserByID(otherUser._id.toString())
            expect(updatedOtherUser.friends).to.have.lengthOf(1)
            expect(updatedOtherUser.friends[0].status).to.equal(2)
            //check that myself has a record of the friend request
            const updatedMyself = await userService.getUserByID(myself._id.toString())
            expect(updatedMyself.friends).to.have.lengthOf(1)
            expect(updatedMyself.friends[0].status).to.equal(3)
        })

        it('Resolve a friend request', async () => {
            //mock myself and another user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const otherToken = tokenService.generateAuthorisedToken(otherUser._id.toString())
            //send friend request
            const response = 
            await request(app)
                    .post('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response.status).to.equal(200)
            //accept friend request from other user's perspective
            const response2 =
            await request(app)
                    .post('/users/' + otherUser._id.toString() + '/friends/' + myself._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + otherToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response2.status).to.equal(200)
            //check that the friend request was added to the other user's friends array
            const updatedOtherUser = await userService.getUserByID(otherUser._id.toString())
            expect(updatedOtherUser.friends).to.have.lengthOf(1)
            expect(updatedOtherUser.friends[0].status).to.equal(1)
            //check that myself has a record of the friend request
            const updatedMyself = await userService.getUserByID(myself._id.toString())
            expect(updatedMyself.friends).to.have.lengthOf(1)
            expect(updatedMyself.friends[0].status).to.equal(1)
        })

        it('Delete a friend', async () => {
            //mock myself and another user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const otherToken = tokenService.generateAuthorisedToken(otherUser._id.toString())
            //send friend request
            const response = 
            await request(app)
                    .post('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response.status).to.equal(200)
            //accept friend request from other user's perspective
            const response2 =
            await request(app)
                    .post('/users/' + otherUser._id.toString() + '/friends/' + myself._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + otherToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response2.status).to.equal(200)
            //delete friend
            const response3 =
            await request(app)
                    .delete('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response3.status).to.equal(200)
            //check that users are absent from each other's friends list
            const updatedOtherUser = await userService.getUserByID(otherUser._id.toString())
            expect(updatedOtherUser.friends).to.be.empty
            const updatedMyself = await userService.getUserByID(myself._id.toString())
            expect(updatedMyself.friends).to.be.empty
        })

        it('Cannot delete while either user is in a critical situation', async () => {
            //mock myself and another user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const otherToken = tokenService.generateAuthorisedToken(otherUser._id.toString())
            //send friend request
            const response = 
            await request(app)
                    .post('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response.status).to.equal(200)
            //accept friend request from other user's perspective
            const response2 =
            await request(app)
                    .post('/users/' + otherUser._id.toString() + '/friends/' + myself._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + otherToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response2.status).to.equal(200)

            //mock a current critical situation for other user
            otherUser.myCurrentHelpRequestID = "test"
            await otherUser.save()

            //delete friend
            const response3 =
            await request(app)
                    .delete('/users/' + myself._id.toString() + '/friends/' + otherUser._id.toString())
                    .set("Content-Type", "application/json")
                    .set('Cookie', [
                        "jwt=" + myToken + "; HttpOnly"
                    ])
                    .send({})
            //check response is 200
            expect(response3.status).to.equal(400)
        })
        
    })

    describe('User Search Functions', () => {
        it('Search returns empty over empty user database', async () => {
            const searchString = "test"
            const searchResult = await performSearch(searchString)
            expect(searchResult).to.be.empty
        })

        it('(Correct) Search returns self when looked for by name, surname and email', async () => {
            const myself = await mockMyself()
            //add another fully verified user to the DB
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //search by first name returns self
            const searchResult = await performSearch(myself.firstName)
            expect(searchResult).to.have.lengthOf(1)
            expect(searchResult[0].userID.toString()).to.equal(myself._id.toString())
            //search by last name returns self
            const searchResult2 = await performSearch(myself.lastName)
            expect(searchResult2).to.have.lengthOf(1)
            expect(searchResult2[0].userID.toString()).to.equal(myself._id.toString())
            //search by email returns self
            const searchResult3 = await performSearch(myself.email)
            expect(searchResult3).to.have.lengthOf(1)
            expect(searchResult3[0].userID.toString()).to.equal(myself._id.toString())
        })

        it('Search by matching first letter would return both options', async () => {
            //mock me and fully verified user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //the matching first letter is A, the search result should be both users
            const searchResult = await performSearch("A")
            expect(searchResult).to.have.lengthOf(2)
            expect(searchResult[0].userID.toString()).to.be.oneOf([myself._id.toString(), otherUser._id.toString()])
            expect(searchResult[1].userID.toString()).to.be.oneOf([myself._id.toString(), otherUser._id.toString()])
        })

        it('Search by email prefix returns corect user (partical search over email)', async () => {
            //mock me and fully verified user
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //test on myself, email starts with ar303:
            const searchResult = await performSearch("ar303")
            expect(searchResult).to.have.lengthOf(1)
            expect(searchResult[0].userID.toString()).to.equal(myself._id.toString())
            //test on other user, email starts with test:
            const searchResult2 = await performSearch("test")
            expect(searchResult2).to.have.lengthOf(1)
            expect(searchResult2[0].userID.toString()).to.equal(otherUser._id.toString())
        })
    })

    describe('User Search Endpoint', () => {
        it('Search returns empty over database without matches', async () => {
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            const searchString = "somenonexistantstring"
            const response = await request(app)
                .get('/users' + "?search=" + searchString)
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response.status).to.equal(200)
            expect(response.body.searchResults).to.be.empty
        })

        it('Search returns self when looked for by name, surname and email', async () => {
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            //search by first name returns self
            const response = await request(app)
                .get('/users' + "?search=" + myself.firstName)
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response.status).to.equal(200)
            expect(response.body.searchResults).to.have.lengthOf(1)
            expect(response.body.searchResults[0].userID).to.equal(myself._id.toString())
            //search by last name returns self
            const response2 = await request(app)
                .get('/users' + "?search=" + myself.lastName)
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response2.status).to.equal(200)
            expect(response2.body.searchResults).to.have.lengthOf(1)
            expect(response2.body.searchResults[0].userID).to.equal(myself._id.toString())
            //search by email returns self
            const response3 = await request(app)
                .get('/users' + "?search=" + myself.email)
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response3.status).to.equal(200)
            expect(response3.body.searchResults).to.have.lengthOf(1)
            expect(response3.body.searchResults[0].userID).to.equal(myself._id.toString())
            //search by email prefix returns self
            const response4 = await request(app)
                .get('/users' + "?search=" + myself.email.substring(0, 5))
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response4.status).to.equal(200)
            expect(response4.body.searchResults).to.have.lengthOf(1)
            expect(response4.body.searchResults[0].userID).to.equal(myself._id.toString())
        })

        it('Search by matching first letter would return both options', async () => {
            const myself = await mockMyself()
            const otherUser = await mockAndReturnFullyVerifiedUser()
            //generate jwt tokens
            const myToken = tokenService.generateAuthorisedToken(myself._id.toString())
            //the matching first letter is A, the search result should be both users
            const response = await request(app)
                .get('/users' + "?search=" + "a")
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    "jwt=" + myToken + "; HttpOnly"
                ])
                .send({})
            expect(response.status).to.equal(200)
            expect(response.body.searchResults).to.have.lengthOf(2)
            expect(response.body.searchResults[0].userID).to.be.oneOf([myself._id.toString(), otherUser._id.toString()])
            expect(response.body.searchResults[1].userID).to.be.oneOf([myself._id.toString(), otherUser._id.toString()])
        })
    })
})