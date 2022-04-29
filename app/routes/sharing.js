const express = require('express')
const verifyToken = require('../middleware/auth')
const router = express.Router()
const Sharing = require('../models/Sharing')
const User = require('../models/User')
const Record = require('../models/Record')

/**
 * @route POST api/sharing/add-sharing
 * @description Add sharing
 * @access Public
 */
router.post('/add-sharing', verifyToken, async (req, res) => {
  const { userId } = req

  const { email } = req.body
  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }

  if (!email) {
    return res.status(200).json({
      success: false,
      message: 'Can not found email!',
    })
  }
  try {
    const emailExist = await User.findOne({
      username: email,
    })
    if (!emailExist) {
      return res.status(200).json({
        success: false,
        message: 'Email is not existed!',
      })
    }
    // All good
    const friendId = emailExist._id.toString()
    const sharingExist = await Sharing.findOne({
      me: userId,
    })
    console.log(sharingExist)
    if (!sharingExist) {
      const newSharing = await Sharing({ me: userId, listFriend: [friendId] })
      await newSharing.save()
    } else {
      const oldListFriend = sharingExist.listFriend
      if (oldListFriend.includes(friendId)) {
        return res.status(200).json({
          success: false,
          message: 'You already shared data with this email',
        })
      } else {
        console.log([...oldListFriend, friendId])
        await Sharing.updateOne(
          { me: userId },
          { listFriend: [...oldListFriend, friendId] }
        )
      }
    }
    return res.status(200).json({
      success: true,
      message: 'Add sharing successfully!',
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

/**
 * @route GET api/sharing/get-list-friend-data
 * @description Get list friend
 * @access Public
 */
router.get('/get-list-friend-data', verifyToken, async (req, res) => {
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
    const sharing = await Sharing.find({ listFriend: userId })
    if (sharing.length > 0) {
      const friendData = sharing.map(async (item) => {
        const user = await User.findOne({ _id: item.me })
        const dataArray = initialArray.map(async (id) => {
          const data = await Record.find({
            userId: user._id,
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
        return {
          username: user.username,
          userId: user._id,
          data: listRecord,
        }
      })
      const listFriend = await Promise.all(friendData)

      return res.status(200).json({
        success: true,
        message: null,
        data: listFriend,
      })
    }
    return res.status(200).json({
      success: true,
      message: null,
      data: [],
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})
/**
 * @route GET api/sharing/get-list-friend
 * @description Get list friend
 * @access Public
 */
router.get('/get-list-friend', verifyToken, async (req, res) => {
  const { userId } = req
  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }
  try {
    const sharing = await Sharing.find({ listFriend: userId })
    if (sharing.length > 0) {
      const data = sharing.map(async (item) => {
        const user = await User.findOne({ _id: item.me })
        return {
          username: user.username,
          userId: user._id,
        }
      })
      const listFriend = await Promise.all(data)
      return res.status(200).json({
        success: true,
        message: null,
        data: listFriend,
      })
    }
    return res.status(200).json({
      success: true,
      message: null,
      data: [],
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})
module.exports = router
