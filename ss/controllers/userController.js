const { tokenCreator } = require('../libs/tokenCreator')
const { checkExposantLogin } = require('../libs/checkExposantLogin')
const Exposant = require('../models/exposantModel')

exports.createNewVisitor = async (req, res) => {
    try {
        let tokenget = req.query.token || 'TOKEN'
        const token = await tokenCreator(tokenget)
        res.json({ token })
    } catch (error) {
        res.status(500).send({ message: 'Erreur lors de la création du visiteur', error })
    }
}

exports.checkLogin = async (req, res) => {
    let tokens = req.query.token || 'TOKEN';
    try {
        const response = await checkExposantLogin(tokens);
        if (!response) {
            const token = await tokenCreator(tokens);
            return res.status(200).json({ message: "no", token });
        }
        const exposant_infos = await Exposant.findById(response);
        return res.status(200).json({ message: "ok", exposant_infos });
    } catch (error) {
        const token = await tokenCreator(tokens);
        return res.status(200).json({ message: "no", token });
    }
};
