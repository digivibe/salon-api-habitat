const Exposant = require('../models/exposantModel')

const generateShortUsername = (name, existingUsernames) => {
    let shortName = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
    let username = shortName
    let counter = 1
    
    while (existingUsernames.has(username)) {
        username = `${shortName}${counter}`
        counter++
    }
    
    existingUsernames.add(username)
    return username
}

exports.updateExposantsWithUsernames = async (req, res) => {
    if ( req.body.pass && req.body.pass === process.env.TT_PWD ) {
        try {
            const exposants = await Exposant.find()
            
            const existingUsernames = new Set()
            
            for (let exposant of exposants) {
                const username = generateShortUsername(exposant.nom, existingUsernames)

                exposant.username = username
                await exposant.save()
            }
            
            const updatedExposants = await Exposant.find()

            res.status(200).json(updatedExposants)
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour des exposants',
                error: error.message,
            })
        }
    }
}

exports.allExpo = async (req, res) => {
    try {
        const exposants = await Exposant.find()

        res.status(200).json(exposants)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des exposants',
            error: error.message
        })
    }
}

exports.deleteFakeExpo = async (req, res) => {
    try {
        const validUsernames = [
            'foodt', 'ccpcc', 'capuc', 'ateli', 'cmj', 'axa', 'halld', 
            'veris', 'lagac', 'latel', 'marzi', 'iad', 'i3m', '3g', 
            'dorma', 'damie', 'flave', 'isolo', 'cerie', 'jgcha', 
            'glavi', 'poles', 'chage', 'activ', 'proje', 'sasch', 
            'fonte', 'maiso', 'donet', 'romup'
        ]
        
        const result = await Exposant.deleteMany({ username: { $nin: validUsernames } })

        res.status(200).json({
            message: 'Exposants successfully deleted',
            deletedCount: result.deletedCount
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting exposants',
            error: error.message
        })
    }
}