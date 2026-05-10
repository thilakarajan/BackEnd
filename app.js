const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const HttpError = require('./models/http-error')
const placeRouter = require('./routes/place-routes')
const UserRouter = require('./routes/user-routes')

const app = express()

app.use(bodyParser.json())

app.use('/uploads/images', express.static(path.join('uploads', 'images')))
// app.use(express.static(path.join('public')))

// This must be above all routes
app.use(
  cors({
    origin: '*', // or use '*' for dev, not with credentials
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin','*')
//   res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH')
//   next()
// })

app.use('/api/places', placeRouter)
app.use('/api/users', UserRouter)

// app.use((req, res, next) => {
//   res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
// })

app.use((req, res, next) => {
  return next(new HttpError('Could not find the path', 404))
})

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => console.log(err))
  }
  if (res.headerSent) {
    return next(error)
  }
  res.status(error.code || 500).json({ message: error.message })
})

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clusters.hlhkfxn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000)
  })
  .catch((err) => {
    console.log(err)
  })
