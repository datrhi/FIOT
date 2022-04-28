const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SharingSchema = new Schema({
  me: String,
  listFriend: [String],
})

module.exports = mongoose.model('sharing', SharingSchema)
