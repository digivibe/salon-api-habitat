const Salon = require('../models/salonModel')
const App = require('../models/appModel')

const { notifyAllUsers } = require('../services/notificationService')

const getAllSalons = async (req, res) => {
    try {
        let salons = await Salon.find()
        if (salons.length === 0) {
            salons = await Salon.insertMany([
                { nom: 'Salon de l\'emploi', isActive: false },
                { nom: 'Salon de l\'habitat', isActive: true },
                { nom: 'Marché de Noël', isActive: false }
            ])
        }
        res.json(salons)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

const getActiveSalon = async (req, res) => {
    try {
        const salon = await Salon.findOne({ isActive: true })
        if (!salon) return res.status(404).json({ message: 'No active salon found.' })
        res.json(salon)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

const setActiveSalon = async (req, res) => {
    const { salonId } = req.body
    try {
        await Salon.updateMany({}, { $set: { isActive: false } })
        const updatedSalon = await Salon.findByIdAndUpdate(salonId, { isActive: true }, { new: true })
        if (!updatedSalon) return res.status(404).json({ message: 'Salon not found.' })

        // Récupérer ou créer l'enregistrement newversionapp
        let appRecord = await App.findOne({ key: 'newversionapp' })
        
        if (!appRecord) {
            // Créer avec la valeur 1 si n'existe pas
            appRecord = await App.create({
                key: 'newversionapp',
                value: '1',
                statut: 1
            })
        } else {
            // Incrémenter la valeur existante
            const currentValue = parseInt(appRecord.value) || 0
            const newValue = (currentValue + 1).toString()
            
            appRecord = await App.findOneAndUpdate(
                { key: 'newversionapp' },
                { value: newValue },
                { new: true }
            )
        }

        const title = 'Changement de Salon'
        const body = `Le ${updatedSalon.nom} est maintenant actif.`
        const data = {
            action: 'switch_salon',
            deepLink: 'myapp://switch-salon'
        }

        // await notifyAllUsers(title, body, data)

        res.json({ message: 'Salon activated', salon: updatedSalon })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

const notifyNewAppVersion = async (req, res) => {
    try {
        const title = 'Nouvelle mise à  jour disponible'
        const body = 'Une nouvelle version a été mise en ligne. Téléchargez la dernière version de l\'app sur le Play Store pour profiter des nouveautés.'
        const data = {
            action: 'update_app',
            deepLink: 'https://play.google.com/store/apps/details?id=fr.digivibe.dormans'
        }

        await notifyAllUsers(title, body, data)

        res.json({ message: 'Notification envoyÃ©e Ã  tous les utilisateurs.' })
    } catch (err) {
        console.error('Erreur lors de l\'envoi de la notification :', err)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = {
    getAllSalons,
    getActiveSalon,
    setActiveSalon,
    notifyNewAppVersion
}