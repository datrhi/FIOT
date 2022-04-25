const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RecordSchema = new Schema({
  data: {
    temperature: Number,
    spo2: Number,
    heartBeat: Number,
  },
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('records', RecordSchema)
