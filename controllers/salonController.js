const Salon = require('../models/salonModel')

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

        const title = 'Changement de Salon'
        const body = `Le ${updatedSalon.nom} est maintenant actif.`
        const data = {
            action: 'switch_salon',
            deepLink: 'myapp://switch-salon'
        }

        await notifyAllUsers(title, body, data)

        res.json({ message: 'Salon activated', salon: updatedSalon })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    getAllSalons,
    getActiveSalon,
    setActiveSalon
}