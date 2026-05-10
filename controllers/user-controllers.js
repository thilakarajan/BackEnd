const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const HttpError = require('../models/http-error')
const User = require('../models/user')

const getAllUsers = async (req, res, next) => {
  let users
  try {
    users = await User.find({}, '-password')
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }
  res
    .status(200)
    .json({ users: users.map((p) => p.toObject({ getters: true })) })
}

const signUp = async (req, res, next) => {
  const error = validationResult(req)
  if (!error.isEmpty()) {
    console.log(error)
    return next(
      new HttpError(
        'Every property should be filled, password should be 8 characters long.',
        401
      )
    )
  }
  const { name, email, password } = req.body

  let hasUser
  try {
    hasUser = await User.findOne({ email: email })
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }
  if (hasUser) {
    return next(
      new HttpError('Could not create user, email already exists', 422)
    )
  }

  let hashedPass
  try {
    hashedPass = await bcrypt.hash(password, 12)
  } catch (err) {
    return next(new HttpError('Could not create user, please try again', 500))
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPass,
    image: req.file.path,
    places: [],
  })

  try {
    await createdUser.save()
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  let token
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT,
      { expiresIn: '1h' }
    )
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token })
}

const logIn = async (req, res, next) => {
  const { email, password } = req.body

  let identifiedUser
  try {
    identifiedUser = await User.findOne({ email: email })
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }
  if (!identifiedUser) {
    return next(
      new HttpError(
        'Could not find the user, credentials seems to be wrong',
        401
      )
    )
  }

  let isValidPass
  try {
    isValidPass = await bcrypt.compare(password, identifiedUser.password)
  } catch (err) {
    return next(
      new HttpError('Could not log you in, please check your credentials', 500)
    )
  }

  if (!isValidPass) {
    return next(
      new HttpError(
        'Could not find the user, credentials seems to be wrong',
        401
      )
    )
  }

  let token
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      process.env.JWT,
      { expiresIn: '1h' }
    )
  } catch (err) {
    return next(new HttpError('Something went wrong, please try again', 500))
  }

  res
    .status(201)
    .json({
      userId: identifiedUser.id,
      email: identifiedUser.email,
      token: token,
    })
}

exports.getAllUsers = getAllUsers
exports.signUp = signUp
exports.logIn = logIn
