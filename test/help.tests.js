const chai = require('chai')
    .use(require('chai-as-promised'))
const expect = chai.expect;
const request = require('supertest')
const {app} = require('../server')
const {socketserver} = require('../server')
var io = require('socket.io-client');

const { mockClearUsers, mockUnverifiedUser, mockVerifiedUserNoAPN, mockAndReturnFullyVerifiedUser, mockMyself } = require('./mockDBOperations');
const tokenService = require('../api/services/token.service');

describe("Help Request Tests", function () {
    beforeEach((done) => {
        mockClearUsers()
        done()
    })
    afterEach((done) => {
        mockClearUsers()
        done()
    })
    
    describe('socket tests', () => {
        it('should connect to socket', async () => {
            return new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself()
                const jwt = tokenService.generateAuthorisedToken(myself._id)

                var socket = io(
                    'http://localhost:8000/ws/helprequests/1234',
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                socket.on('connect', function () {
                    console.log('connected')
                    socket.disconnect()
                    resolve(true)
                })
                socket.on('connect_error', function (err) {
                    console.log('connect_error', err)
                    socket.disconnect()
                    reject(err)
                })
            })
        })

        it ('can connect to two different namespace sockets', async () => {
            return new Promise(async (resolve, reject) => {
                //mock myself
                const myself = await mockMyself()
                const jwt = tokenService.generateAuthorisedToken(myself._id)
                var socket1 = io(
                    'http://localhost:8000/ws/helprequests/1234',
                    {
                        auth: {
                            token: jwt
                        }
                    }
                );
                var socket2 = io(
                    'http://localhost:8000/ws/helprequests/5678',
                    {
                        auth: {
                            token: jwt
                        }
                })
                socket1.on('connect', function () {})
                socket1.on('connect_error', function (err) {
                    socket1.disconnect()
                    reject(err)
                })
                socket2.on('connect', function () {
                    socket1.disconnect()
                    socket2.disconnect()
                    resolve(true)
                })
                socket2.on('connect_error', function (err) {
                    console.log('connect_error', err)
                    socket1.disconnect()
                    socket2.disconnect()
                    reject(err)
                })
            })})
    })
})