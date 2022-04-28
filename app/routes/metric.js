const express = require('express')
const verifyToken = require('../middleware/auth')
const router = express.Router()
const Record = require('../models/Record')

/**
 * @route GET api/metric/get-all-metric
 * @description Get all metric in day
 * @access Public
 */
router.get('/get-all-metric', verifyToken, async (req, res) => {
  const { userId } = req
  const { date } = req.query

  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  if (!date || typeof date !== 'string') {
    return res.status(200).json({
      success: false,
      message: 'Can not found date!',
    })
  }
  const mapDate = date.split('/').map((item) => Number(item))

  if (mapDate.length !== 3) {
    return res.status(200).json({
      success: false,
      message: 'Wrong date format!',
    })
  }
  try {
    const initialArray = Array(24)
      .fill()
      .map((_, index) => index)
    const dataArray = initialArray.map(async (id) => {
      const data = await Record.find({
        userId: userId,
        createdAt: {
          $gte: new Date(mapDate[2], mapDate[1], mapDate[0], id - 7),
          $lte: new Date(mapDate[2], mapDate[1], mapDate[0], id + 1 - 7),
        },
      })
      let total = data.reduce(
        (prev, curr) => ({
          temperature: prev.temperature + curr.data.temperature,
          spo2: prev.spo2 + curr.data.spo2,
          heartBeat: prev.heartBeat + curr.data.heartBeat,
        }),
        {
          temperature: 0,
          spo2: 0,
          heartBeat: 0,
        }
      )
      if (data.length > 0) {
        total = {
          temperature: Number((total.temperature / data.length).toFixed(2)),
          spo2: Number((total.spo2 / data.length).toFixed(2)),
          heartBeat: Number((total.heartBeat / data.length).toFixed(2)),
        }
      }
      return total
    })
    const listRecord = await Promise.all(dataArray)
    return res.json({ success: true, message: null, data: listRecord })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

/**
 * @route POST api/metric/create-metric
 * @description Create one metric
 * @access Public
 */
router.post('/create-metric', verifyToken, async (req, res) => {
  const { userId } = req
  const { data } = req.body
  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  if (
    !data ||
    Object.keys(data).length !== 3 ||
    isNaN(data.temperature) ||
    isNaN(data.spo2) ||
    isNaN(data.heartBeat)
  ) {
    return res.status(200).json({
      success: false,
      message: 'Can not found data or wrong format data!',
    })
  }
  try {
    // All good

    const newRecord = new Record({
      data: data,
      userId: userId,
    })
    await newRecord.save()

    return res.json({
      success: true,
      message: null,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

/**
 * @route GET api/metric/get-lastest
 * @description Get lastest metric in range time
 * @access Public
 */
router.get('/get-lastest', verifyToken, async (req, res) => {
  const { userId } = req
  const { date } = req.query
  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  if (!date || typeof date !== 'string') {
    return res.status(200).json({
      success: false,
      message: 'Can not found date or wrong date format!',
    })
  }
  const mapDate = date.split('/').map((item) => Number(item))

  if (mapDate.length !== 3) {
    return res.status(200).json({
      success: false,
      message: 'Wrong date format!',
    })
  }
  try {
    const lastestRecord = await Record.find({
      userId: userId,
      createdAt: {
        $gte: new Date(mapDate[2], mapDate[1], mapDate[0], -7),
        $lte: new Date(mapDate[2], mapDate[1], mapDate[0] + 1, -7),
      },
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .select('-userId')
    if (lastestRecord.length === 0) {
      return res.status(200).json({
        success: true,
        message: null,
        data: {
          temperature: -1,
          spo2: -1,
          heartBeat: -1,
        },
      })
    }
    return res.json({
      success: true,
      message: null,
      data: lastestRecord[0].data,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})
/**
 * @route POST api/metric/save-all
 * @description Save all metric cache from hardware
 * @access Public
 */
// Incoming
module.exports = router
