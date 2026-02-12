/**
 * Middleware global pour la gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err }
    error.message = err.message

    // Log de l'erreur pour le débogage
    console.error('Error:', err)

    // Erreur Mongoose - ObjectId invalide
    if (err.name === 'CastError') {
        const message = 'Resource not found'
        error = { message, statusCode: 404 }
    }

    // Erreur Mongoose - Duplication
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]
        const message = `${field} already exists`
        error = { message, statusCode: 400 }
    }

    // Erreur Mongoose - Validation
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ')
        error = { message, statusCode: 400 }
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token'
        error = { message, statusCode: 401 }
    }

    // Erreur JWT - Token expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired'
        error = { message, statusCode: 401 }
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}

module.exports = errorHandler

