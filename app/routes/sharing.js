const express = require('express')
const verifyToken = require('../middleware/auth')
const router = express.Router()
const Sharing = require('../models/Sharing')
const User = require('../models/User')

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
        await Sharing.updateOne(
          { me: userId },
          { listFiend: [...oldListFriend, friendId] }
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
