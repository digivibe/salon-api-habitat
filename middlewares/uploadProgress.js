// Stocker les progressions d'upload par session
const uploadProgress = new Map()

/**
 * Middleware pour suivre la progression de l'upload
 * Doit être appelé AVANT multer pour pouvoir intercepter les données
 */
const trackUploadProgress = (req, res, next) => {
  const uploadId = req.headers['x-upload-id'] || Date.now().toString()
  req.uploadId = uploadId
  
  const totalBytes = parseInt(req.headers['content-length']) || 0
  
  // Initialiser la progression
  uploadProgress.set(uploadId, {
    progress: 0,
    status: 'uploading',
    uploaded: 0,
    total: totalBytes
  })

  // Écouter les données reçues
  let uploadedBytes = 0
  
  // Intercepter le stream pour suivre la progression
  const originalOn = req.on.bind(req)
  
  // Wrapper pour intercepter les événements 'data'
  req.on = function(event, listener) {
    if (event === 'data') {
      return originalOn(event, (chunk) => {
        uploadedBytes += chunk.length
        const progress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0
        
        uploadProgress.set(uploadId, {
          progress: Math.min(progress, 95), // Max 95% jusqu'à ce que Cloudinary soit terminé
          status: 'uploading',
          uploaded: uploadedBytes,
          total: totalBytes
        })
        
        // Appeler le listener original
        if (listener) listener(chunk)
      })
    }
    return originalOn(event, listener)
  }

  // Intercepter l'événement 'end'
  originalOn('end', () => {
    uploadProgress.set(uploadId, {
      progress: 95,
      status: 'processing',
      uploaded: uploadedBytes,
      total: totalBytes
    })
  })

  next()
}

/**
 * Route pour récupérer la progression d'upload
 */
const getUploadProgress = (req, res) => {
  const uploadId = req.params.uploadId

  const progress = uploadProgress.get(uploadId) || {
    progress: 0,
    status: 'waiting',
    uploaded: 0,
    total: 0
  }

  res.json({
    success: true,
    data: progress
  })
}

/**
 * Marquer l'upload comme terminé
 */
const markUploadComplete = (uploadId) => {
  const progress = uploadProgress.get(uploadId)
  if (progress) {
    uploadProgress.set(uploadId, {
      ...progress,
      progress: 100,
      status: 'completed'
    })
    
    // Nettoyer après 5 secondes
    setTimeout(() => {
      uploadProgress.delete(uploadId)
    }, 5000)
  }
}

/**
 * Marquer l'upload comme en cours de traitement Cloudinary
 */
const markUploadProcessing = (uploadId) => {
  const progress = uploadProgress.get(uploadId)
  if (progress) {
    uploadProgress.set(uploadId, {
      ...progress,
      progress: 95, // 95% pendant le traitement Cloudinary
      status: 'processing'
    })
  }
}

module.exports = {
  trackUploadProgress,
  getUploadProgress,
  markUploadComplete,
  markUploadProcessing
}

