const express = require('express')
const verifyToken = require('../middleware/auth')
const router = express.Router()
const Record = require('../models/Record')

/**
 * @route GET api/metric/get-all-metric
 * @description Get all metric
 * @access Public
 */
router.get('/get-all-metric', verifyToken, async (req, res) => {
  const { userId } = req
  const { date } = req.body

  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  if (!date) {
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
    const listRecord = await Record.find({
      userId: userId,
      createdAt: {
        $gte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0]),
        $lte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0] + 1),
      },
    }).select('-userId')
    if (!listRecord) {
      return res.status(200).json({
        success: true,
        message: null,
        data: [],
      })
    }
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
  const { date } = req.body
  const mapDate = date.split('/').map((item) => Number(item))

  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  if (!date) {
    return res.status(200).json({
      success: false,
      message: 'Can not found date!',
    })
  }
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
        $gte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0]),
        $lte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0] + 1),
      },
    })
      .sort({ createdAt: -1 })
      .limit(1)
    if (!lastestRecord) {
      return res.status(200).json({
        success: true,
        message: null,
        data: [],
      })
    }
    return res.json({ success: true, message: null, data: lastestRecord })
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
