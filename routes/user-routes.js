const express = require('express')
const UserControllers = require('../controllers/user-controllers')
const { check } = require('express-validator')
const fileUpload = require('../middleware/file-upload')

const router = express.Router()

router.get('/', UserControllers.getAllUsers)

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').notEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min:8}),
  ],
  UserControllers.signUp
)

router.post('/login', UserControllers.logIn)

module.exports = router
