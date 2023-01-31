var express = require('express') // Call express

app = express()
port = process.env.PORT || 3000
app.listen(port)
console.log('RESTful API demo server started on: ' + port)
