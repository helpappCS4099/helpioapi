const chai = require('chai')
    .use(require('chai-as-promised'))
const expect = chai.expect;
const request = require('supertest')
const { assert } = require('chai')
const { addNewUser, getUserByID, matchEmailInDB } = require('../api/services/user.service')
const { mockClearUsers, mockUnverifiedUser, mockVerifiedUserNoAPN, mockFullyVerifiedUser } = require('./mockDBOperations')
const Errors = require('../api/utility/errors')
const { hashPassword, comparePassword } = require('../api/services/auth.service')
const { generateEmailVerificationToken, generateAPNToken, generateAuthorisedToken, decodeToken } = require('../api/services/token.service')
const { setAPNToken } = require('../api/services/apn.service')
const { setEmailVerificationHash, getUserByEmailVerificationHash, verifyEmail, generateEmailVerificationHash } = require('../api/services/emailverification.service')
const {app} = require('../server')
var Cookies = require('expect-cookies')
const setCookie = require('set-cookie-parser');
const VerificationHash = require('../api/models/verificationHash.model');

//parent block of authentication tests
describe('Authentication Tests', () => {
    beforeEach((done) => {
        mockClearUsers()
        done()
    })
    afterEach((done) => {
        mockClearUsers()
        done()
    })

    describe('Account Creation Helper Functionality', () => {
        it("should verify user presence by email correctly", async () => {
            const userEmail = "testmail@st-andrews.ac.uk"
            const userID = await mockUnverifiedUser(userEmail)
            const emailIsInDB = await matchEmailInDB(userEmail)
            expect(emailIsInDB).to.equal(true)
            const emailIsNonInDB = await matchEmailInDB(userEmail + "dd")
            expect(emailIsNonInDB).to.equal(false)
        })

        it("should hash a password correctly", async () => {
            const password = "password"
            const password2 = "passwod2"
            const hashedPassword = await hashPassword(password)
            const hashedPassword2 = await hashPassword(password2)
            const passwordComparison = await comparePassword(password, hashedPassword)
            const passwordComparison2 = await comparePassword(password, hashedPassword2)
            expect(hashPassword).to.not.equal(password)
            expect(passwordComparison).to.equal(true)
            expect(passwordComparison2).to.equal(false)
        })
    })

    describe('Account in DB (User) Creation Tests', () => {
        it('should create a new user account', async () => {
            const newUserID = await addNewUser(
                                "testemail@st-andrews.ac.uk", 
                                "passwordHash", 
                                "Test", 
                                "User")
            const user = await getUserByID(newUserID)
            expect(user).to.not.equal(null)
        })

        it('should not create a new user account with an existing email', async () => {
            const newUserID = await addNewUser(
                                        "testemail@st-andrews.ac.uk", 
                                        "passwordHash", 
                                        "Test", 
                                        "User")
            await expect(addNewUser(
                "testemail@st-andrews.ac.uk", 
                "passwordHash", 
                "Test", 
                "User")).to.be.
                rejectedWith(Errors.UserWithThisEmailAlreadyExistsError)
        })

        it('should not create a new user account without all fields being valid and present', async () => {
            await expect(addNewUser(
                "@st-andrews.ac.uk",
                "passwordHash",
                "Test",
                "User")).to.be.rejectedWith(Errors.InvalidUserDetailsError)
            
            await expect(addNewUser(
                "sss@st-andrews.ac.uk",
                "",
                "Test",
                "User")).to.be.rejectedWith(Errors.InvalidUserDetailsError)
            
            await expect(addNewUser(
                "sss@st-andrews.ac.uk",
                "passwordHash",
                "",
                "User")).to.be.rejectedWith(Errors.InvalidUserDetailsError)
            
            await expect(addNewUser(
                "ddsds@gst-andrews.ac.uk",
                "passwordHash",
                "Test",
                "")).to.be.rejectedWith(Errors.InvalidUserDetailsError)
            
        })
    })

    describe("JWT Tokens Issuing", () => {
        it("Should generate a token for email verification", () => {
            const userID = "someUserID"
            const emailVerificationToken = generateEmailVerificationToken(userID)
            const decodedToken = decodeToken(emailVerificationToken)
            expect(decodedToken.userID).to.equal(userID)
            expect(decodedToken.access).to.equal("emailVerification")
        })
        it("Should generate a token for APN", () => {
            const userID = "someUserID"
            const APNToken = generateAPNToken(userID)
            const decodedToken = decodeToken(APNToken)
            expect(decodedToken.userID).to.equal(userID)
            expect(decodedToken.access).to.equal("apnToken")
        })
        it("Should generate a token for authorised access", () => {
            const userID = "someUserID"
            const authorisedToken = generateAuthorisedToken(userID)
            const decodedToken = decodeToken(authorisedToken)
            expect(decodedToken.userID).to.equal(userID)
            expect(decodedToken.access).to.equal("authorised")
        })
    })

    describe("APN Token Setting", () => {
        it("Should set APN token correctly", async () => {
            const userID = await mockVerifiedUserNoAPN()
            const token = "someAPNToken"
            await setAPNToken(userID, token)
            const user = await getUserByID(userID)
            expect(user.deviceToken).to.equal(token)
        })

        it("Should not set APN token if user is not verified", async () => {
            const userID = await mockUnverifiedUser()
            const token = "someAPNToken"
            await expect(setAPNToken(userID, token)).to.be.rejectedWith(Errors.UserNotVerifiedError)
        })
    })

    describe("Email Verification", () => {
        it("Should create a unique email verification token for each user", async () => {
            const userID = await mockUnverifiedUser()
            const userID2 = await mockUnverifiedUser()
            const emailVerificationHash1 = await generateEmailVerificationHash(userID)
            const emailVerificationHash2 = await generateEmailVerificationHash(userID2)
            expect(emailVerificationHash1).to.not.equal(emailVerificationHash2)
        })
        it("Should set email verification hash for a user", async () => {
            const userID = await mockUnverifiedUser()
            const hash = await setEmailVerificationHash(userID)
            const userByHash = await getUserByEmailVerificationHash(hash)
            expect(String(userByHash._id)).to.equal(String(userID))
        })
        it("Should set user as verified if email verification hash is correct", async () => {
            const userID = await mockUnverifiedUser()
            const hash = await setEmailVerificationHash(userID)
            await verifyEmail(hash)
            const user = await getUserByID(userID)
            expect(user.verified).to.equal(true)
        })
        it("Removes verified hash after verification", async () => {
            const userID = await mockUnverifiedUser()
            const hash = await setEmailVerificationHash(userID)
            await verifyEmail(hash)
            const userAfterVerification = await getUserByEmailVerificationHash(hash)
            expect(userAfterVerification).to.equal(null)
        })
    })

    describe("Session Endpoint Testing", function() {
        this.timeout(10000)

        it("Should log in successfully with correct credentials", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockUnverifiedUser(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(true)          
            expect(response.body).to.have.property("userID").to.equal(String(userID))
        })
        it("Should not log in with incorrect credentials", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockUnverifiedUser(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword + "wrong"
                        })
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(false)        
        })
        it("Returns email verification cookie upon login if user is not verified", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockUnverifiedUser(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            const cookie = setCookie.parse(response)[0]
            const decodedToken = decodeToken(cookie.value)
            expect(decodedToken.userID).to.equal(String(userID))
            expect(decodedToken.access).to.equal("emailVerification")
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(true)          
            expect(response.body).to.have.property("userID").to.equal(String(userID))
        })
        it("Returns apn cookie upon login if user needs to supply APN Token", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockVerifiedUserNoAPN(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            const cookie = setCookie.parse(response)[0]
            const decodedToken = decodeToken(cookie.value)
            expect(decodedToken.userID).to.equal(String(userID))
            expect(decodedToken.access).to.equal("apnToken")
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(true)          
            expect(response.body).to.have.property("userID").to.equal(String(userID))
        })
        it("Returns authorized cookie upon login if user is verified & apn supplied", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockFullyVerifiedUser(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            const cookie = setCookie.parse(response)[0]
            const decodedToken = decodeToken(cookie.value)
            expect(decodedToken.userID).to.equal(String(userID))
            expect(decodedToken.access).to.equal("authorised")
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(true)          
            expect(response.body).to.have.property("userID").to.equal(String(userID))
        })
        it("Should remove APN token when user logs out", async function() {
            const userEmail = "testEmail@email.com"
            const userPassword = "password"
            const userID = await mockFullyVerifiedUser(userEmail, userPassword)
            const response = 
                await request(app)
                        .post("/login")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            const cookieString = response.headers['set-cookie']
            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("authenticated").to.equal(true)

            await request(app)
                .get("/logout")
                .set("Content-Type", "application/json")
                .set('Cookie', [
                    cookieString
                ])
                .send({})
            const user = await getUserByID(userID)
            expect(user.deviceToken).to.equal("")
        })
    })

    describe("User Creation Endpoint Testing", function() {
        this.timeout(10000)

        it("Should create a user successfully", async function() {
            const userEmail = "ar303@st-andrews.ac.uk"
            const userPassword = "password"
            const firstName = "Artem"
            const lastName = "Rakhmanov"
            const response = 
                await request(app)
                        .post("/users")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword,
                            firstName: firstName,
                            lastName: lastName
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            expect(response.status).to.equal(200)
            //check that email verification jwt is received
            const cookie = setCookie.parse(response)[0]
            const decodedToken = decodeToken(cookie.value)
            expect(decodedToken.access).to.equal("emailVerification")
            expect(response.body).to.have.property("userWasCreated").to.equal(true)
        })
        it("Should not create a user if email is already in use", async function() {
            const userEmail = "ar303@st-andrews.ac.uk"
            const userPassword = "password"
            const firstName = "Artem"
            const lastName = "Rakhmanov"
            const existingUser = await mockUnverifiedUser(userEmail, userPassword, firstName, lastName)
            const response = 
                await request(app)
                        .post("/users")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword,
                            firstName: firstName,
                            lastName: lastName
                        })
            expect(response.status).to.equal(200)
            //check that email verification jwt is received
            expect(response.body).to.have.property("userWasCreated").to.equal(false)
        })

    })

    describe("Email Verification Endpoint Testing", function() {
        this.timeout(10000)

        it("Should verify a user successfully", async function() {
            //user
            const userEmail = "ar303@st-andrews.ac.uk"
            const userPassword = "password"
            const firstName = "Artem"
            const lastName = "Rakhmanov"
            const response = 
                await request(app)
                        .post("/users")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword,
                            firstName: firstName,
                            lastName: lastName
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            expect(response.status).to.equal(200)
            const cookieString = response.headers['set-cookie']
            
            //find email verification hash
            const emailVerificationHash = await VerificationHash.findOne({userID: response.body.userID})
            expect(emailVerificationHash).to.not.equal(null)
            const verificationResponse =
                await request(app)
                        .get("/verification/" + emailVerificationHash.hash)
                        .set("Content-Type", "application/json")
                        .send({})
            expect(response.status).to.equal(200)
            expect(verificationResponse.body).to.have.property("userIsVerified").to.equal(true)
            //check that apn token jwt is received

            //check that user is verified (endpoint)
            const userIsVerifiedResponse =
                await request(app)
                        .get("/verification")
                        .set("Content-Type", "application/json")
                        .set('Cookie', [
                            cookieString
                        ])
                        .send({})
            expect(userIsVerifiedResponse.status).to.equal(200)
            expect(userIsVerifiedResponse.body).to.have.property("userIsVerified").to.equal(true)
            const cookie = setCookie.parse(userIsVerifiedResponse)[0]
            const decodedToken = decodeToken(cookie.value)
            expect(decodedToken.access).to.equal("apnToken")
        })

        it("Should refresh a user's email verification hash", async function() {
            //user
            const userEmail = "ar303@st-andrews.ac.uk"
            const userPassword = "password"
            const firstName = "Artem"
            const lastName = "Rakhmanov"
            const response = 
                await request(app)
                        .post("/users")
                        .set("Content-Type", "application/json")
                        .send({
                            email: userEmail,
                            password: userPassword,
                            firstName: firstName,
                            lastName: lastName
                        })
                        .expect(Cookies.set({'name': "jwt", 'options':['httponly']}))
            expect(response.status).to.equal(200)
            const cookieString = response.headers['set-cookie']

            //get the current hash
            const currentHash = await VerificationHash.findOne({userID: response.body.userID})
            expect(currentHash).to.not.equal(null)

            //check that user is NOT verified (endpoint)
            const userIsNotVerifiedResponse =
                await request(app)
                        .get("/verification")
                        .set('Cookie', [
                            cookieString
                        ])
                        .send({})
            expect(userIsNotVerifiedResponse.status).to.equal(200)
            expect(userIsNotVerifiedResponse.body).to.have.property("userIsVerified").to.equal(false)

            //call to refresh
            const refreshResponse = 
                await request(app)
                        .post("/verification")
                        .set('Cookie', [
                            cookieString
                        ])
                        .send({})
            expect(refreshResponse.status).to.equal(200)
            expect(refreshResponse.body).to.have.property("hashWasRefreshed").to.equal(true)

            //get the new hash
            const newHash = await VerificationHash.findOne({userID: response.body.userID})
            expect(newHash).to.not.equal(null)
            expect(newHash.hash).to.not.equal(currentHash.hash)

            //check that user is STILL NOT verified (endpoint)
            const userIsStillNotVerifiedResponse =
                await request(app)
                        .get("/verification")
                        .set('Cookie', [
                            cookieString
                        ])
                        .send({})
            expect(userIsStillNotVerifiedResponse.status).to.equal(200)
            expect(userIsStillNotVerifiedResponse.body).to.have.property("userIsVerified").to.equal(false)
                        
            //check that the old hash does not work
            const oldVerificationResponse =
                await request(app)
                        .get("/verification/" + currentHash.hash)
                        .send({})
            expect(oldVerificationResponse.status).to.equal(403)

            //check that the new hash works
            const verificationResponse =
                await request(app)
                        .get("/verification/" + newHash.hash)
                        .send({})
            expect(response.status).to.equal(200)
            expect(verificationResponse.body).to.have.property("userIsVerified").to.equal(true)

            //check that user is verified (endpoint)
            const userIsVerifiedResponse =
                await request(app)
                        .get("/verification")
                        .set('Cookie', [
                            cookieString
                        ])
                        .send({})
            expect(userIsVerifiedResponse.status).to.equal(200)
            expect(userIsVerifiedResponse.body).to.have.property("userIsVerified").to.equal(true)
        })
        it("Should reject verification status query if no jwt is present", async function() {
            const response = 
                await request(app)
                        .get("/verification")
                        .set("Content-Type", "application/json")
                        .send({})
            expect(response.status).to.equal(403)
        })
    })                
})
