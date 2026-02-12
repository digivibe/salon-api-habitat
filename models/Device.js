const mongoose = require('mongoose')

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expoPushToken: {
      type: String,
      required: false,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    appVersion: {
      type: String,
      required: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    notificationSettings: {
      newSalon: {
        type: Boolean,
        default: true,
      },
      newVersion: {
        type: Boolean,
        default: true,
      },
      newEvent: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Index pour améliorer les performances
deviceSchema.index({ deviceId: 1 })
deviceSchema.index({ expoPushToken: 1 })

module.exports = mongoose.model('Device', deviceSchema)
