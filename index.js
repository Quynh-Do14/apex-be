// src/index.js hoặc app.js
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const fs = require('fs')
const errorHandler = require('./src/middlewares/errorHandler.middleware')

if (!fs.existsSync('./src/uploads')) {
  fs.mkdirSync('./src/uploads', { recursive: true })
}

const authRoutes = require('./src/routers/auth.routes')
const userRoutes = require('./src/routers/user.routes')
const blogRoutes = require('./src/routers/blog.routes')
const blogCategoryRoutes = require('./src/routers/blog-category.routes')
const bannerRoutes = require('./src/routers/banner.routes')
const brandRoutes = require('./src/routers/brand.routes')
const productRoutes = require('./src/routers/product.routes')
const productSeriesRoutes = require('./src/routers/product-series.routes')
const seriesRoutes = require('./src/routers/series.routes')
const agencyRoutes = require('./src/routers/agency.routes')
const categoryRoutes = require('./src/routers/category.routes')
const agencyCategoryRoutes = require('./src/routers/agency-category.routes')
const videoRoutes = require('./src/routers/video.routes')
const contactRoutes = require('./src/routers/contact.routes')
const sloganRoutes = require('./src/routers/slogan.routes')
const configPageRoutes = require('./src/routers/config-page.routes')
const contentPageRoutes = require('./src/routers/content-page.routes')

const uploadRoutes = require('./src/routers/upload.routes')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/agency', agencyRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/blog-category', blogCategoryRoutes)
app.use('/api/banner', bannerRoutes)
app.use('/api/brand', brandRoutes)
app.use('/api/product', productRoutes)
app.use('/api/product-series', productSeriesRoutes)
app.use('/api/series', seriesRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/agency-category', agencyCategoryRoutes)
app.use('/api/video', videoRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/slogan', sloganRoutes)
app.use('/api/config-page', configPageRoutes)
app.use('/api/content-page', contentPageRoutes)

app.use('/api/uploads', express.static('src/uploads'))
app.use('/api/upload', uploadRoutes)
// Health check
app.get('/', (req, res) => {
  res.send('API is running...')
})

// Global error handler (tùy chọn, đơn giản)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`)
})
