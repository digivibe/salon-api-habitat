const Login = require('../models/loginModel')
const Visitor = require('../models/visitorModel')

exports.checkExposantLogin = async (token) => {
    const existingVisitor = await Visitor.findOne({ cookie: token })
    if (!existingVisitor) {
        return false
    }
    const existingLogin = await Login.findOne({ visitorId: existingVisitor._id })
    if (!existingLogin) {
        return false
    }
    if ( existingLogin.session !== 1 ) {
        return false
    }
    return existingLogin.exposantId
}