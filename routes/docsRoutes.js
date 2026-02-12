const express = require('express')
const router = express.Router()
const { getApiDocs } = require('../controllers/docsController')

// Route publique pour la documentation
router.get('/', getApiDocs)

module.exports = router

