const Salon = require('../models/salonModel')

const getActiveSalon = async (req, res) => {
    try {
        const salonCount = await Salon.countDocuments()
        
        if (salonCount === 0) {
            const defaultSalons = [
                { nom: 'Salon de formation', isActive: true },
                { nom: 'Salon de l\'habitat', isActive: false }
            ]
            
            await Salon.insertMany(defaultSalons)

            const activeSalon = await Salon.findOne({ isActive: true })

            return res.status(200).json({ activeSalonId: activeSalon._id })
        }

        const salon = await Salon.findOne({ isActive: true })
        
        if (!salon) {
            return res.status(404).json({ message: 'No active salon found.' })
        }
        
        res.status(200).json({ activeSalonId: salon._id })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error while fetching active salon.' })
    }
}

const setActiveSalon = async (req, res) => {
    const { salonId, isActive } = req.body

    try {
        await Salon.updateMany({}, { $set: { isActive: false } })

        const salon = await Salon.findByIdAndUpdate(salonId, { isActive: isActive }, { new: true })

        if (!salon) {
            return res.status(404).json({ message: 'Salon not found.' })
        }

        res.status(200).json({ message: `Salon ${isActive ? 'activated' : 'deactivated'}` })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error while updating the salon.' })
    }
}

module.exports = {
    getActiveSalon,
    setActiveSalon,
}