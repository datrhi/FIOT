const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const _CONST = require('./app/config/constant')
const DB_MONGO = require('./app/config/db.config')
const authRouter = require('./app/routes/auth')
const app = express()
app.use(express.json())

var corsOptions = {
    origin: 'http://localhost:8081',
}
app.use(morgan('combined')) // theo dõi log GET, POST

app.use(cors(corsOptions)) // cross origin domain

// parse requests of content-type - application/json
app.use(bodyParser.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

const connect = async () => {
    try {
        await mongoose.connect(DB_MONGO.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('Connected DB!')
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}

connect() //Connect to Mongodb

app.use('/api/auth', authRouter)
// require('./app/routes/')(app)

const PORT = process.env.PORT || _CONST.PORT
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})
