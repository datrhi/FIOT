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
    let data = []
    let i = 0
    while (i < 24) {
      let newData = await Record.find({
        userId: userId,
        createdAt: {
          $gte: new Date(mapDate[2], mapDate[1], mapDate[0], i),
          $lte: new Date(mapDate[2], mapDate[1], mapDate[0], i + 1),
        },
      })
      let total = newData.reduce(
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
      let avg = total
      if (newData.length > 0) {
        avg = {
          temperature: Number((total.temperature / newData.length).toFixed(2)),
          spo2: Number((total.spo2 / newData.length).toFixed(2)),
          heartBeat: Number((total.heartBeat / newData.length).toFixed(2)),
        }
      }
      data.push(avg)
      i = i + 1
    }
    // const dataArray = initialArray.map(async (id) => {
    //   const data = await Record.find({
    //     userId: userId,
    //     createdAt: {
    //       $gte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0], id),
    //       $lte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0], id + 1),
    //     },
    //   })
    // let total = data.reduce(
    //   (prev, curr) => ({
    //     temperature: prev.temperature + curr.data.temperature,
    //     spo2: prev.spo2 + curr.data.spo2,
    //     heartBeat: prev.heartBeat + curr.data.heartBeat,
    //   }),
    //   {
    //     temperature: 0,
    //     spo2: 0,
    //     heartBeat: 0,
    //   }
    // )
    // if (data.length > 0) {
    //   total = {
    //     temperature: total.temperature / data.length,
    //     spo2: total.spo2 / data.length,
    //     heartBeat: total.heartBeat / data.length,
    //   }
    // }
    //   return data
    // })
    // const  = await Record.find({
    //   userId: userId,
    //   createdAt: {
    //     $gte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0],0),
    //     $lte: new Date(mapDate[2], mapDate[1] - 1, mapDate[0],1),
    //   },
    // })
    // if (!listRecord) {
    //   return res.status(200).json({
    //     success: true,
    //     message: null,
    //     data: [],
    //   })
    // }
    return res.json({ success: true, message: null, data: data })
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
        $gte: new Date(mapDate[2], mapDate[1], mapDate[0]),
        $lte: new Date(mapDate[2], mapDate[1], mapDate[0] + 1),
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
