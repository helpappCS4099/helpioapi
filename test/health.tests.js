const { getUserByID, removeUser } = require('../api/services/user.service');
const { mockUnverifiedUser, mockFullyVerifiedUser, mockVerifiedUserNoAPN, mockClearUsers } = require('./mockDBOperations');
var expect  = require('chai').expect;

describe("Mock User DB Operations", function() {
    describe("Adding different types of users (by verification stage)", function() {
        it("Adds a fully unverified user", async function() {
            const uid = await mockUnverifiedUser()
            const user = await getUserByID(uid)
            expect(user).to.not.equal(null)
            expect(user.verified).to.equal(false)
            expect(user.deviceToken).to.equal("")
        });
        it("Adds a verified user without deviceToken", async function() {
            const uid = await mockVerifiedUserNoAPN()
            const user = await getUserByID(uid)
            expect(user).to.not.equal(null)
            expect(user.verified).to.equal(true)
            expect(user.deviceToken).to.equal("")
        });
        it("Adds a fully verified user with deviceToken", async function() {
            const uid = await mockFullyVerifiedUser()
            const user = await getUserByID(uid)
            expect(user).to.not.equal(null)
            expect(user.verified).to.equal(true)
            expect(user.deviceToken).to.not.equal("")
        })
    });
    describe("Removing users", function() {
        it("Removes all users", async function() {
            const uid1 = await mockUnverifiedUser()
            const uid2 = await mockUnverifiedUser()
            const uid3 = await mockUnverifiedUser()
            await mockClearUsers()
            const user1 = await getUserByID(uid1)
            const user2 = await getUserByID(uid2)
            const user3 = await getUserByID(uid3)
            expect(user1).to.equal(null)
            expect(user2).to.equal(null)
            expect(user3).to.equal(null)
        });
        it("Removes specified user by uid", async function() {
            const uid1 = await mockUnverifiedUser()
            const uid2 = await mockUnverifiedUser()
            const uid3 = await mockUnverifiedUser()
            await removeUser(uid2)
            const user1 = await getUserByID(uid1)
            const user2 = await getUserByID(uid2)
            const user3 = await getUserByID(uid3)
            expect(user1).to.not.equal(null)
            expect(user2).to.equal(null)
            expect(user3).to.not.equal(null)
        })
    })
})
