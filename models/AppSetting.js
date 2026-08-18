const mongoose = require('mongoose')

const appSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    value: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'appsettings'
})

appSettingSchema.index({ key: 1 })

const AppSetting = mongoose.model('AppSetting', appSettingSchema)

module.exports = AppSetting
