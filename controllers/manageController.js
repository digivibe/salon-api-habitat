const Exposant = require('../models/exposantModel');
const Categorie = require('../models/categorieModel');
const ExposantVideo = require('../models/exposantVideoModel');
const ExposantBondeal = require('../models/exposantBondealModel');
const Comment = require('../models/commentModel');
const Like = require('../models/likeModel');
const Login = require('../models/loginModel');

// GET all exposants with pagination and filters
exports.getAllExposants = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            isValid,
            statut,
            categorie
        } = req.query;

        // Build filter object
        const filter = {};

        if (search) {
            filter.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        if (isValid !== undefined) {
            filter.isValid = parseInt(isValid);
        }

        if (statut !== undefined) {
            filter.statut = parseInt(statut);
        }

        if (categorie) {
            filter.categorie = categorie;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch exposants
        const exposants = await Exposant.find(filter)
            .populate('categorie')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const total = await Exposant.countDocuments(filter);

        res.status(200).json({
            status: 200,
            data: exposants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la récupération des exposants",
            error: error.message
        });
    }
};

// GET single exposant by ID
exports.getExposantById = async (req, res) => {
    try {
        const { id } = req.params;

        const exposant = await Exposant.findById(id).populate('categorie').lean();

        if (!exposant) {
            return res.status(404).json({
                status: 404,
                message: "Exposant non trouvé"
            });
        }

        // Get statistics
        const stats = {
            videos: await ExposantVideo.countDocuments({ exposantId: id }),
            bondeals: await ExposantBondeal.countDocuments({ exposantId: id }),
            comments: await Comment.countDocuments({ exposantId: id }),
            likes: await Like.countDocuments({ exposantId: id }),
            logins: await Login.countDocuments({ exposantId: id })
        };

        res.status(200).json({
            status: 200,
            data: {
                ...exposant,
                stats
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la récupération de l'exposant",
            error: error.message
        });
    }
};

// CREATE new exposant
exports.createExposant = async (req, res) => {
    try {
        const {
            categorie,
            email,
            username,
            password,
            nom,
            location,
            bio,
            phoneNumber,
            linkedinLink,
            facebookLink,
            instaLink,
            weblink,
            isValid = 2,
            statut = 1,
            profil = "https://salon-api-habitat.onrender.com/uploads/exposants_profile_pic/logo.png",
            cover = "https://salonapp-api-y25d.onrender.com/uploads/exposants_cover_pic/default.png"
        } = req.body;

        // Validate required fields
        if (!categorie || !email || !username || !password || !nom || !location || !bio) {
            return res.status(400).json({
                status: 400,
                message: "Champs obligatoires manquants (categorie, email, username, password, nom, location, bio)"
            });
        }

        // Check if email already exists
        const existingEmail = await Exposant.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                status: 400,
                message: "Cet email est déjà utilisé"
            });
        }

        // Check if username already exists
        const existingUsername = await Exposant.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                status: 400,
                message: "Ce nom d'utilisateur est déjà utilisé"
            });
        }

        // Check if category exists
        const categorieExists = await Categorie.findById(categorie);
        if (!categorieExists) {
            return res.status(400).json({
                status: 400,
                message: "La catégorie spécifiée n'existe pas"
            });
        }

        // Create new exposant
        const newExposant = new Exposant({
            categorie,
            email,
            username,
            password,
            nom,
            profil,
            cover,
            location,
            bio,
            isValid,
            phoneNumber: phoneNumber || '',
            linkedinLink: linkedinLink || '',
            facebookLink: facebookLink || '',
            instaLink: instaLink || '',
            weblink: weblink || '',
            statut
        });

        await newExposant.save();

        const savedExposant = await Exposant.findById(newExposant._id).populate('categorie');

        res.status(201).json({
            status: 201,
            message: "Exposant créé avec succès",
            data: savedExposant
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la création de l'exposant",
            error: error.message
        });
    }
};

// UPDATE exposant
exports.updateExposant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if exposant exists
        const exposant = await Exposant.findById(id);
        if (!exposant) {
            return res.status(404).json({
                status: 404,
                message: "Exposant non trouvé"
            });
        }

        // If updating email, check uniqueness
        if (updateData.email && updateData.email !== exposant.email) {
            const existingEmail = await Exposant.findOne({ email: updateData.email });
            if (existingEmail) {
                return res.status(400).json({
                    status: 400,
                    message: "Cet email est déjà utilisé par un autre exposant"
                });
            }
        }

        // If updating username, check uniqueness
        if (updateData.username && updateData.username !== exposant.username) {
            const existingUsername = await Exposant.findOne({ username: updateData.username });
            if (existingUsername) {
                return res.status(400).json({
                    status: 400,
                    message: "Ce nom d'utilisateur est déjà utilisé"
                });
            }
        }

        // If updating categorie, check it exists
        if (updateData.categorie) {
            const categorieExists = await Categorie.findById(updateData.categorie);
            if (!categorieExists) {
                return res.status(400).json({
                    status: 400,
                    message: "La catégorie spécifiée n'existe pas"
                });
            }
        }

        // Update exposant (password will be hashed automatically by pre-save hook if changed)
        const updatedExposant = await Exposant.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('categorie');

        res.status(200).json({
            status: 200,
            message: "Exposant mis à jour avec succès",
            data: updatedExposant
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la mise à jour de l'exposant",
            error: error.message
        });
    }
};

// UPDATE exposant permissions (isValid)
exports.updateExposantPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { isValid } = req.body;

        if (isValid === undefined || ![0, 1, 2, 3].includes(parseInt(isValid))) {
            return res.status(400).json({
                status: 400,
                message: "isValid doit être 0, 1, 2 ou 3"
            });
        }

        const exposant = await Exposant.findById(id);
        if (!exposant) {
            return res.status(404).json({
                status: 404,
                message: "Exposant non trouvé"
            });
        }

        exposant.isValid = parseInt(isValid);
        await exposant.save();

        const updatedExposant = await Exposant.findById(id).populate('categorie');

        res.status(200).json({
            status: 200,
            message: "Permissions mises à jour avec succès",
            data: updatedExposant
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la mise à jour des permissions",
            error: error.message
        });
    }
};

// UPDATE exposant status (statut)
exports.updateExposantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (statut === undefined || ![0, 1].includes(parseInt(statut))) {
            return res.status(400).json({
                status: 400,
                message: "statut doit être 0 ou 1"
            });
        }

        const exposant = await Exposant.findById(id);
        if (!exposant) {
            return res.status(404).json({
                status: 404,
                message: "Exposant non trouvé"
            });
        }

        exposant.statut = parseInt(statut);
        await exposant.save();

        const updatedExposant = await Exposant.findById(id).populate('categorie');

        res.status(200).json({
            status: 200,
            message: "Statut mis à jour avec succès",
            data: updatedExposant
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la mise à jour du statut",
            error: error.message
        });
    }
};

// DELETE exposant (with cascade)
exports.deleteExposant = async (req, res) => {
    try {
        const { id } = req.params;

        const exposant = await Exposant.findById(id);
        if (!exposant) {
            return res.status(404).json({
                status: 404,
                message: "Exposant non trouvé"
            });
        }

        // Cascade delete related data
        await Promise.all([
            Comment.deleteMany({ exposantId: id }),
            ExposantBondeal.deleteMany({ exposantId: id }),
            ExposantVideo.deleteMany({ exposantId: id }),
            Like.deleteMany({ exposantId: id }),
            Login.deleteMany({ exposantId: id })
        ]);

        // Delete exposant
        await Exposant.findByIdAndDelete(id);

        res.status(200).json({
            status: 200,
            message: "Exposant supprimé avec succès (ainsi que toutes ses données associées)"
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la suppression de l'exposant",
            error: error.message
        });
    }
};

// GET statistics
exports.getStatistics = async (req, res) => {
    try {
        const totalExposants = await Exposant.countDocuments();
        const activeExposants = await Exposant.countDocuments({ statut: 1 });
        const inactiveExposants = await Exposant.countDocuments({ statut: 0 });

        const byValidation = {
            simpleExposant: await Exposant.countDocuments({ isValid: 0 }),
            valideNoPublication: await Exposant.countDocuments({ isValid: 1 }),
            valideWithPublication: await Exposant.countDocuments({ isValid: 2 }),
            administrator: await Exposant.countDocuments({ isValid: 3 })
        };

        const categories = await Categorie.find({ statut: 1 }).lean();
        const byCategory = await Promise.all(
            categories.map(async (cat) => ({
                _id: cat._id,
                label: cat.label,
                count: await Exposant.countDocuments({ categorie: cat._id })
            }))
        );

        const totalVideos = await ExposantVideo.countDocuments();
        const totalBondeals = await ExposantBondeal.countDocuments();
        const totalComments = await Comment.countDocuments();
        const totalLikes = await Like.countDocuments();

        res.status(200).json({
            status: 200,
            data: {
                exposants: {
                    total: totalExposants,
                    active: activeExposants,
                    inactive: inactiveExposants
                },
                byValidation,
                byCategory,
                content: {
                    videos: totalVideos,
                    bondeals: totalBondeals,
                    comments: totalComments,
                    likes: totalLikes
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Erreur lors de la récupération des statistiques",
            error: error.message
        });
    }
};
