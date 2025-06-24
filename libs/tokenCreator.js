const crypto = require('crypto')
const Visitor = require('../models/visitorModel')

exports.tokenCreator = async (token = null) => {
    if (token && await Visitor.findOne({ cookie: token })) {
        return token
    }
    
    const randomBytes = crypto.randomBytes(32)
    const timestamp = new Date().getTime()
    const uniqueData = "Visitor"
    const rawToken = randomBytes.toString('hex') + timestamp.toString() + uniqueData
    const newToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    const ip = '::1'

    const newVisitor = new Visitor({
        cookie: newToken,
        addressIp: ip,
        countryCode: 'NN',
        countVisite: 1
    })

    await newVisitor.save()
    return newToken
}