require('dotenv').config()

module.exports = {
    url: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@fiot.h7sne.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
}
