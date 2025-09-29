const crypto = require('crypto')
const Visitor = require('../models/visitorModel')

exports.visitorIdByToken = async (token) => {
    const dataVisitor = await Visitor.findOne({ cookie: token })
    if ( !dataVisitor ) {
        return false
    }
    return dataVisitor._id
}