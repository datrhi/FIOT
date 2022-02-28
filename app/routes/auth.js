const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const argon2 = require('argon2')
const verifyToken = require('../middleware/auth')
const User = require('../models/User')

/**
 * @route GET api/auth/me
 * @description Verify user save login
 * @access Public
 */
router.get('/me', verifyToken, async (req, res) => {
  const { userId } = req

  // Simple validation
  if (!userId) {
    return res.status(200).json({
      success: false,
      message: 'Can not found userId!',
    })
  }

  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found',
      })
    }
    return res.json({ success: true, user: user })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})
/**
 * @route POST api/auth/register
 * @description Register user
 * @access Public
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body
  // Simple validation
  if (!username || !password) {
    return res.status(200).json({
      success: false,
      message: 'Missing username and/or password',
    })
  }
  try {
    // Check for existing user
    const user = await User.findOne({
      username,
    })

    if (user) {
      return res.status(200).json({
        success: false,
        message: 'Username has already existed!',
      })
    }

    // All good
    const hashedPassword = await argon2.hash(password)
    const newUser = new User({
      username,
      password: hashedPassword,
    })
    await newUser.save()

    // Return token if register is successful
    const accessToken = jwt.sign(
      {
        userId: newUser._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '24h',
      }
    )

    return res.json({
      success: true,
      message: 'User created successfully!',
      accessToken,
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
 * @route POST api/auth/login
 * @description Login user
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  // Simple validation
  if (!username || !password) {
    return res.status(200).json({
      success: false,
      message: 'Missing username and/or password',
    })
  }

  try {
    // Check for existing user
    const user = await User.findOne({
      username,
    })
    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'Incorrect username or password',
      })
    }

    // if username exist check password
    const passwordValid = await argon2.verify(user.password, password)
    if (!passwordValid) {
      return res.status(200).json({
        success: false,
        message: 'Incorrect username or password',
      })
    }

    //All good
    const accessToken = jwt.sign(
      {
        userId: user._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '24h',
      }
    )
    return res.json({
      success: true,
      message: 'Login successfully!',
      accessToken,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
