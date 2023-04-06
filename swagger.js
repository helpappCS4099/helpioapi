const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./api/routes/auth.routes.js', './api/routes/helprequest.routes.js', './api/routes/user.routes.js']

swaggerAutogen(outputFile, endpointsFiles)