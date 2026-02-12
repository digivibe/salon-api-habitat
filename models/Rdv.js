const mongoose = require('mongoose')

const rdvSchema = new mongoose.Schema(
  {
    exposant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exposant',
      required: true,
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    appointmentDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

// Index pour améliorer les performances de recherche
rdvSchema.index({ exposant: 1, createdAt: -1 })
rdvSchema.index({ status: 1 })
rdvSchema.index({ salon: 1 })

module.exports = mongoose.model('Rdv', rdvSchema)
