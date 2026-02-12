/**
 * Controller pour la documentation de l'API
 * Retourne la liste complète de tous les endpoints avec exemples
 */

const getApiDocs = async (req, res) => {
    try {
        const baseUrl = process.env.BASE_LINK || 'http://localhost:9000'
        const apiBase = `${baseUrl}/api/v2`

        const docs = {
            success: true,
            message: 'Documentation complète de l\'API v2',
            version: '2.0.0',
            baseUrl: apiBase,
            timestamp: new Date().toISOString(),
            endpoints: {
                salons: {
                    description: 'Gestion des salons',
                    routes: [
                        {
                            method: 'GET',
                            path: '/salons',
                            description: 'Liste tous les salons',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/salons`,
                                    method: 'GET',
                                    headers: {}
                                },
                                response: {
                                    success: true,
                                    count: 3,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439011',
                                            nom: 'Salon de l\'emploi',
                                            slug: 'salon-de-l-emploi',
                                            description: 'Description du salon',
                                            isActive: true,
                                            statut: 1,
                                            createdAt: '2025-01-27T10:00:00.000Z',
                                            updatedAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/salons/active',
                            description: 'Récupère le salon actif',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/salons/active`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439011',
                                        nom: 'Salon de l\'emploi',
                                        isActive: true
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/salons/:id',
                            description: 'Récupère un salon par ID',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/salons/507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439011',
                                        nom: 'Salon de l\'emploi',
                                        isActive: true
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/salons',
                            description: 'Créer un salon (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/salons`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        nom: 'Nouveau Salon',
                                        description: 'Description du nouveau salon'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Salon créé avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439011',
                                        nom: 'Nouveau Salon',
                                        isActive: false
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/salons/set-active',
                            description: 'Définir le salon actif (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/salons/set-active`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        salonId: '507f1f77bcf86cd799439011'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Salon activé avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439011',
                                        nom: 'Salon de l\'emploi',
                                        isActive: true
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/salons/:id',
                            description: 'Mettre à jour un salon (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/salons/507f1f77bcf86cd799439011`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        nom: 'Salon mis à jour',
                                        description: 'Nouvelle description'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Salon mis à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439011',
                                        nom: 'Salon mis à jour',
                                        isActive: true
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/salons/:id',
                            description: 'Supprimer un salon (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/salons/507f1f77bcf86cd799439011`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Salon supprimé avec succès'
                                }
                            }
                        }
                    ]
                },
                app: {
                    description: 'Fonctionnalités de l\'application',
                    routes: [
                        {
                            method: 'GET',
                            path: '/app/version',
                            description: 'Version de l\'API',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/app/version`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        versionCode: 1,
                                        version: '2.0.0',
                                        api: 'v2'
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/app/categories?salon=:salonId',
                            description: 'Liste les catégories d\'un salon',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/app/categories?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 5,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439012',
                                            salon: '507f1f77bcf86cd799439011',
                                            color: '#FF5733',
                                            borderColor: '#C70039',
                                            label: 'Informatique',
                                            statut: 1
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/app/categories',
                            description: 'Créer une catégorie (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/app/categories`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        salon: '507f1f77bcf86cd799439011',
                                        color: '#FF5733',
                                        borderColor: '#C70039',
                                        label: 'Nouvelle Catégorie'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Catégorie créée avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439012',
                                        salon: '507f1f77bcf86cd799439011',
                                        color: '#FF5733',
                                        borderColor: '#C70039',
                                        label: 'Nouvelle Catégorie',
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/app/events?salon=:salonId',
                            description: 'Liste les événements d\'un salon',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/app/events?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 3,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439013',
                                            salon: '507f1f77bcf86cd799439011',
                                            eventDate: '2025-02-15',
                                            fullEventDate: '2025-02-15T10:00:00.000Z',
                                            titre: 'Conférence Tech',
                                            description: 'Description de l\'événement',
                                            statut: 1
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/app/events',
                            description: 'Créer un événement (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/app/events`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        salon: '507f1f77bcf86cd799439011',
                                        eventDate: '2025-02-15',
                                        titre: 'Nouvel Événement',
                                        description: 'Description de l\'événement'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Événement créé avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439013',
                                        salon: '507f1f77bcf86cd799439011',
                                        eventDate: '2025-02-15',
                                        titre: 'Nouvel Événement',
                                        statut: 1
                                    }
                                }
                            }
                        }
                    ]
                },
                auth: {
                    description: 'Authentification',
                    routes: [
                        {
                            method: 'POST',
                            path: '/auth/register',
                            description: 'Inscription d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/auth/register`,
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        salon: '507f1f77bcf86cd799439011',
                                        categorie: '507f1f77bcf86cd799439012',
                                        email: 'exposant@example.com',
                                        password: 'password123',
                                        confirmPassword: 'password123',
                                        nom: 'Nom Exposant',
                                        location: 'Paris, France',
                                        bio: 'Description de l\'exposant',
                                        phoneNumber: '+33123456789',
                                        linkedinLink: 'https://linkedin.com/in/exposant',
                                        facebookLink: 'https://facebook.com/exposant',
                                        instaLink: 'https://instagram.com/exposant',
                                        weblink: 'https://exposant.com'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Inscription réussie. Votre compte est en attente de validation.',
                                    data: {
                                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        exposant: {
                                            _id: '507f1f77bcf86cd799439014',
                                            salon: '507f1f77bcf86cd799439011',
                                            email: 'exposant@example.com',
                                            nom: 'Nom Exposant',
                                            isValid: 0,
                                            statut: 1
                                        }
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/auth/login',
                            description: 'Connexion d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/auth/login`,
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        email: 'exposant@example.com',
                                        password: 'password123',
                                        salon: '507f1f77bcf86cd799439011'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Connexion réussie',
                                    data: {
                                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        exposant: {
                                            _id: '507f1f77bcf86cd799439014',
                                            email: 'exposant@example.com',
                                            nom: 'Nom Exposant',
                                            isValid: 2,
                                            statut: 1
                                        }
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/auth/forgot-password',
                            description: 'Mot de passe oublié',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/auth/forgot-password`,
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        email: 'exposant@example.com'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Si cet email existe, un nouveau mot de passe vous sera envoyé'
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/auth/me',
                            description: 'Informations de l\'exposant connecté',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/auth/me`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        email: 'exposant@example.com',
                                        nom: 'Nom Exposant',
                                        profil: 'https://cloudinary.com/image.jpg',
                                        cover: 'https://cloudinary.com/cover.jpg',
                                        isValid: 2,
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/auth/check-password',
                            description: 'Vérifier le mot de passe actuel',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/auth/check-password`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        password: 'password123'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Mot de passe correct'
                                }
                            }
                        }
                    ]
                },
                exposants: {
                    description: 'Gestion des exposants',
                    routes: [
                        {
                            method: 'GET',
                            path: '/exposants?salon=:salonId',
                            description: 'Liste des exposants d\'un salon',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 50,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439014',
                                            salon: '507f1f77bcf86cd799439011',
                                            categorie: {
                                                _id: '507f1f77bcf86cd799439012',
                                                label: 'Informatique',
                                                color: '#FF5733',
                                                borderColor: '#C70039'
                                            },
                                            email: 'exposant@example.com',
                                            nom: 'Nom Exposant',
                                            profil: 'https://cloudinary.com/image.jpg',
                                            cover: 'https://cloudinary.com/cover.jpg',
                                            location: 'Paris, France',
                                            bio: 'Description',
                                            isValid: 2,
                                            statut: 1
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/exposants/:id',
                            description: 'Détails d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/507f1f77bcf86cd799439014`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        email: 'exposant@example.com',
                                        nom: 'Nom Exposant',
                                        profil: 'https://cloudinary.com/image.jpg',
                                        cover: 'https://cloudinary.com/cover.jpg',
                                        location: 'Paris, France',
                                        bio: 'Description',
                                        isValid: 2,
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/exposants/videos?exposantId=:id&salon=:salonId',
                            description: 'Liste des vidéos d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/videos?exposantId=507f1f77bcf86cd799439014&salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 10,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439015',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: '507f1f77bcf86cd799439014',
                                            name: 'video.mp4',
                                            videoUrl: 'https://cloudinary.com/video.mp4',
                                            description: 'Description de la vidéo',
                                            statut: 1,
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/exposants/videos',
                            description: 'Publier une vidéo',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/videos`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    body: {
                                        video: '<file>',
                                        description: 'Description de la vidéo'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Vidéo publiée avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439015',
                                        videoUrl: 'https://cloudinary.com/video.mp4',
                                        description: 'Description de la vidéo',
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/exposants/videos/:id',
                            description: 'Supprimer une vidéo',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/videos/507f1f77bcf86cd799439015`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Vidéo supprimée avec succès'
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/exposants/bondeals?exposantId=:id&salon=:salonId',
                            description: 'Liste des bondeals d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/bondeals?exposantId=507f1f77bcf86cd799439014&salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 5,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439016',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: '507f1f77bcf86cd799439014',
                                            image: 'https://cloudinary.com/image.jpg',
                                            title: 'Titre du bondeal',
                                            description: 'Description du bondeal',
                                            statut: 1,
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/exposants/bondeals',
                            description: 'Publier un bondeal',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/bondeals`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    body: {
                                        image: '<file>',
                                        title: 'Titre du bondeal',
                                        description: 'Description du bondeal'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Bondeal publié avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439016',
                                        image: 'https://cloudinary.com/image.jpg',
                                        title: 'Titre du bondeal',
                                        description: 'Description du bondeal',
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/exposants/bondeals/:id',
                            description: 'Supprimer un bondeal',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/bondeals/507f1f77bcf86cd799439016`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Bondeal supprimé avec succès'
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/exposants/profile-pic',
                            description: 'Mettre à jour la photo de profil',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/profile-pic`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    body: {
                                        profilePic: '<file>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Photo de profil mise à jour avec succès',
                                    data: {
                                        profil: 'https://cloudinary.com/new-profile.jpg'
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/exposants/cover-pic',
                            description: 'Mettre à jour la photo de couverture',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/cover-pic`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    body: {
                                        coverPic: '<file>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Photo de couverture mise à jour avec succès',
                                    data: {
                                        cover: 'https://cloudinary.com/new-cover.jpg'
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/exposants/infos',
                            description: 'Mettre à jour les informations',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/infos`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        nom: 'Nouveau Nom',
                                        bio: 'Nouvelle bio',
                                        location: 'Nouvelle localisation',
                                        phoneNumber: '+33123456789',
                                        linkedinLink: 'https://linkedin.com/in/new',
                                        facebookLink: 'https://facebook.com/new',
                                        instaLink: 'https://instagram.com/new',
                                        weblink: 'https://newsite.com'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Informations mises à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        nom: 'Nouveau Nom',
                                        bio: 'Nouvelle bio',
                                        location: 'Nouvelle localisation'
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/exposants/password',
                            description: 'Changer le mot de passe',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/password`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        oldPassword: 'oldpassword123',
                                        newPassword: 'newpassword123'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Mot de passe modifié avec succès'
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/exposants/account',
                            description: 'Supprimer le compte',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/exposants/account`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        password: 'password123'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Compte supprimé avec succès'
                                }
                            }
                        }
                    ]
                },
                likes: {
                    description: 'Gestion des likes',
                    routes: [
                        {
                            method: 'POST',
                            path: '/likes/toggle',
                            description: 'Toggle like (créer ou supprimer)',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/toggle`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        videoId: '507f1f77bcf86cd799439015'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Like ajouté',
                                    liked: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439017',
                                        exposantId: '507f1f77bcf86cd799439014',
                                        videoId: '507f1f77bcf86cd799439015'
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/likes/video/:videoId?salon=:salonId',
                            description: 'Liste des likes d\'une vidéo',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/video/507f1f77bcf86cd799439015?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 25,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439017',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: {
                                                _id: '507f1f77bcf86cd799439014',
                                                nom: 'Nom Exposant',
                                                profil: 'https://cloudinary.com/image.jpg'
                                            },
                                            videoId: '507f1f77bcf86cd799439015',
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/likes/exposant/:exposantId?salon=:salonId',
                            description: 'Liste des likes d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/exposant/507f1f77bcf86cd799439014?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 10,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439017',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: '507f1f77bcf86cd799439014',
                                            videoId: {
                                                _id: '507f1f77bcf86cd799439015',
                                                name: 'video.mp4',
                                                description: 'Description'
                                            },
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/likes/check?videoId=:id',
                            description: 'Vérifier si un exposant a liké une vidéo',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/check?videoId=507f1f77bcf86cd799439015`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    liked: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439017',
                                        exposantId: '507f1f77bcf86cd799439014',
                                        videoId: '507f1f77bcf86cd799439015'
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/likes/stats/video/:videoId?salon=:salonId',
                            description: 'Statistiques des likes d\'une vidéo',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/stats/video/507f1f77bcf86cd799439015?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        videoId: '507f1f77bcf86cd799439015',
                                        totalLikes: 25
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/likes/:id',
                            description: 'Supprimer un like',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/likes/507f1f77bcf86cd799439017`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Like supprimé avec succès'
                                }
                            }
                        }
                    ]
                },
                comments: {
                    description: 'Gestion des commentaires',
                    routes: [
                        {
                            method: 'POST',
                            path: '/comments',
                            description: 'Créer un commentaire',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/comments`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        videoId: '507f1f77bcf86cd799439015',
                                        content: 'Super vidéo !'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Commentaire créé avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439018',
                                        salon: '507f1f77bcf86cd799439011',
                                        exposantId: {
                                            _id: '507f1f77bcf86cd799439014',
                                            nom: 'Nom Exposant',
                                            profil: 'https://cloudinary.com/image.jpg'
                                        },
                                        videoId: '507f1f77bcf86cd799439015',
                                        content: 'Super vidéo !',
                                        statut: 1,
                                        createdAt: '2025-01-27T10:00:00.000Z'
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/comments/video/:videoId?salon=:salonId',
                            description: 'Liste des commentaires d\'une vidéo',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/comments/video/507f1f77bcf86cd799439015?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 15,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439018',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: {
                                                _id: '507f1f77bcf86cd799439014',
                                                nom: 'Nom Exposant',
                                                profil: 'https://cloudinary.com/image.jpg',
                                                email: 'exposant@example.com'
                                            },
                                            videoId: '507f1f77bcf86cd799439015',
                                            content: 'Super vidéo !',
                                            statut: 1,
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/comments/exposant/:exposantId?salon=:salonId',
                            description: 'Liste des commentaires d\'un exposant',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/comments/exposant/507f1f77bcf86cd799439014?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    count: 8,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439018',
                                            salon: '507f1f77bcf86cd799439011',
                                            exposantId: '507f1f77bcf86cd799439014',
                                            videoId: {
                                                _id: '507f1f77bcf86cd799439015',
                                                name: 'video.mp4',
                                                description: 'Description',
                                                videoUrl: 'https://cloudinary.com/video.mp4'
                                            },
                                            content: 'Super vidéo !',
                                            statut: 1,
                                            createdAt: '2025-01-27T10:00:00.000Z'
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/comments/stats/video/:videoId?salon=:salonId',
                            description: 'Statistiques des commentaires d\'une vidéo',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/comments/stats/video/507f1f77bcf86cd799439015?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        videoId: '507f1f77bcf86cd799439015',
                                        totalComments: 15
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/comments/:id',
                            description: 'Mettre à jour un commentaire',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/comments/507f1f77bcf86cd799439018`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        content: 'Commentaire modifié'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Commentaire mis à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439018',
                                        content: 'Commentaire modifié',
                                        updatedAt: '2025-01-27T11:00:00.000Z'
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/comments/:id',
                            description: 'Supprimer un commentaire',
                            auth: true,
                            example: {
                                request: {
                                    url: `${apiBase}/comments/507f1f77bcf86cd799439018`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Commentaire supprimé avec succès'
                                }
                            }
                        }
                    ]
                },
                notifications: {
                    description: 'Gestion des notifications push',
                    routes: [
                        {
                            method: 'POST',
                            path: '/notifications/register',
                            description: 'Enregistrer un utilisateur pour les notifications push',
                            auth: false,
                            example: {
                                request: {
                                    url: `${apiBase}/notifications/register`,
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        userId: 'user123',
                                        notificationToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
                                        deviceInfo: {
                                            platform: 'android',
                                            version: '13',
                                            model: 'Samsung Galaxy S21',
                                            brand: 'Samsung'
                                        },
                                        appVersion: '1.0.0',
                                        salon: '507f1f77bcf86cd799439011'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Utilisateur enregistré avec succès',
                                    data: {
                                        userId: 'user123',
                                        registeredAt: '2025-01-27T10:00:00.000Z',
                                        isActive: true
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/notifications/send-to-user',
                            description: 'Envoyer une notification à un utilisateur (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/notifications/send-to-user`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        userId: 'user123',
                                        title: 'Nouvelle notification',
                                        body: 'Vous avez un nouveau message',
                                        data: {
                                            type: 'message',
                                            id: '507f1f77bcf86cd799439019'
                                        }
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Notification envoyée avec succès',
                                    data: {
                                        status: 'ok',
                                        id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/notifications/send-to-all',
                            description: 'Envoyer une notification à tous les utilisateurs (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/notifications/send-to-all`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        title: 'Nouvelle mise à jour',
                                        body: 'Une nouvelle version de l\'app est disponible',
                                        data: {
                                            type: 'update',
                                            version: '2.0.0'
                                        },
                                        salon: '507f1f77bcf86cd799439011'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Notifications envoyées à 150 utilisateurs',
                                    data: {
                                        totalSent: 150,
                                        tickets: []
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/notifications/deactivate/:userId',
                            description: 'Désactiver un utilisateur (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/notifications/deactivate/user123`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Utilisateur désactivé avec succès'
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/notifications/stats?salon=:salonId',
                            description: 'Statistiques des utilisateurs (admin)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/notifications/stats?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    data: {
                                        totalUsers: 200,
                                        activeUsers: 150,
                                        inactiveUsers: 50,
                                        platformStats: [
                                            { _id: 'android', count: 100 },
                                            { _id: 'ios', count: 50 }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                },
                admin: {
                    description: 'Administration (admin uniquement)',
                    routes: [
                        {
                            method: 'GET',
                            path: '/admin/stats?salon=:salonId',
                            description: 'Statistiques globales',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/stats?salon=507f1f77bcf86cd799439011`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    data: {
                                        exposants: {
                                            total: 100,
                                            active: 85,
                                            byValidation: [
                                                { _id: 0, count: 10 },
                                                { _id: 1, count: 5 },
                                                { _id: 2, count: 70 },
                                                { _id: 3, count: 5 }
                                            ],
                                            byStatus: [
                                                { _id: 0, count: 15 },
                                                { _id: 1, count: 85 }
                                            ]
                                        },
                                        content: {
                                            videos: 500,
                                            bondeals: 200,
                                            comments: 1000,
                                            likes: 2000,
                                            events: 10
                                        },
                                        users: {
                                            total: 200,
                                            active: 150
                                        }
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/admin/exposants?salon=:salonId&page=1&limit=20&search=...',
                            description: 'Liste des exposants avec pagination et filtres',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants?salon=507f1f77bcf86cd799439011&page=1&limit=20&search=nom&isValid=2&statut=1`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    data: [
                                        {
                                            _id: '507f1f77bcf86cd799439014',
                                            salon: '507f1f77bcf86cd799439011',
                                            email: 'exposant@example.com',
                                            nom: 'Nom Exposant',
                                            isValid: 2,
                                            statut: 1
                                        }
                                    ],
                                    pagination: {
                                        page: 1,
                                        limit: 20,
                                        total: 100,
                                        pages: 5
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/admin/exposants/:id',
                            description: 'Détails d\'un exposant avec statistiques',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants/507f1f77bcf86cd799439014`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        email: 'exposant@example.com',
                                        nom: 'Nom Exposant',
                                        isValid: 2,
                                        statut: 1,
                                        stats: {
                                            videos: 10,
                                            bondeals: 5,
                                            comments: 20,
                                            likes: 50
                                        }
                                    }
                                }
                            }
                        },
                        {
                            method: 'POST',
                            path: '/admin/exposants',
                            description: 'Créer un exposant',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants`,
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        salon: '507f1f77bcf86cd799439011',
                                        categorie: '507f1f77bcf86cd799439012',
                                        email: 'nouveau@example.com',
                                        username: 'nouveau',
                                        password: 'password123',
                                        nom: 'Nouvel Exposant',
                                        location: 'Paris, France',
                                        bio: 'Description',
                                        isValid: 2,
                                        statut: 1
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Exposant créé avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439020',
                                        email: 'nouveau@example.com',
                                        nom: 'Nouvel Exposant',
                                        isValid: 2,
                                        statut: 1
                                    }
                                }
                            }
                        },
                        {
                            method: 'PUT',
                            path: '/admin/exposants/:id',
                            description: 'Mettre à jour un exposant',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants/507f1f77bcf86cd799439014`,
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        nom: 'Nom Modifié',
                                        bio: 'Nouvelle bio',
                                        isValid: 2
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Exposant mis à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        nom: 'Nom Modifié',
                                        bio: 'Nouvelle bio',
                                        isValid: 2
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/admin/exposants/:id',
                            description: 'Supprimer un exposant (soft delete)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants/507f1f77bcf86cd799439014`,
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Exposant supprimé avec succès'
                                }
                            }
                        },
                        {
                            method: 'PATCH',
                            path: '/admin/exposants/:id/permissions',
                            description: 'Mettre à jour les permissions (isValid)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants/507f1f77bcf86cd799439014/permissions`,
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        isValid: 2
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Permissions mises à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        isValid: 2
                                    }
                                }
                            }
                        },
                        {
                            method: 'PATCH',
                            path: '/admin/exposants/:id/status',
                            description: 'Mettre à jour le statut (actif/inactif)',
                            auth: true,
                            admin: true,
                            example: {
                                request: {
                                    url: `${apiBase}/admin/exposants/507f1f77bcf86cd799439014/status`,
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': 'Bearer <jwt_token>',
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        statut: 0
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Statut mis à jour avec succès',
                                    data: {
                                        _id: '507f1f77bcf86cd799439014',
                                        statut: 0
                                    }
                                }
                            }
                        }
                    ]
                },
                upload: {
                    description: 'Upload de fichiers vers Cloudinary',
                    routes: [
                        {
                            method: 'POST',
                            path: '/upload',
                            description: 'Upload un fichier (image ou vidéo)',
                            auth: false,
                            example: {
                                request: {
                                    url: `${baseUrl}/upload`,
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'multipart/form-data'
                                    },
                                    body: {
                                        file: '<file>'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'File uploaded successfully',
                                    data: {
                                        url: 'https://res.cloudinary.com/cloud/video/upload/v1234567890/video.mp4',
                                        publicId: 'video_1234567890',
                                        resourceType: 'video'
                                    }
                                }
                            }
                        },
                        {
                            method: 'GET',
                            path: '/cloud',
                            description: 'Récupérer toutes les ressources Cloudinary',
                            auth: false,
                            example: {
                                request: {
                                    url: `${baseUrl}/cloud`,
                                    method: 'GET'
                                },
                                response: {
                                    success: true,
                                    data: {
                                        images: [],
                                        videos: [],
                                        total: 0
                                    }
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/delete',
                            description: 'Supprimer une ressource Cloudinary par URL',
                            auth: false,
                            example: {
                                request: {
                                    url: `${baseUrl}/delete`,
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: {
                                        url: 'https://res.cloudinary.com/cloud/video/upload/v1234567890/video.mp4'
                                    }
                                },
                                response: {
                                    success: true,
                                    message: 'Ressource supprimée avec succès',
                                    publicId: 'video_1234567890'
                                }
                            }
                        },
                        {
                            method: 'DELETE',
                            path: '/delete-all-videos',
                            description: 'Supprimer toutes les vidéos Cloudinary',
                            auth: false,
                            example: {
                                request: {
                                    url: `${baseUrl}/delete-all-videos`,
                                    method: 'DELETE'
                                },
                                response: {
                                    success: true,
                                    message: 'Suppression terminée',
                                    deleted: 50,
                                    failed: 0
                                }
                            }
                        }
                    ]
                }
            },
            notes: {
                authentication: 'Les routes protégées nécessitent un token JWT dans le header: Authorization: Bearer <token>',
                salon: 'La plupart des routes nécessitent le paramètre salon dans la query (?salon=:id), body ou params',
                admin: 'Les routes admin nécessitent un exposant avec isValid = 3 (administrateur)',
                pagination: 'Les routes avec pagination acceptent les paramètres page et limit dans la query',
                filters: 'Les routes de liste acceptent des filtres dans la query (search, isValid, statut, categorie, etc.)',
                upload: 'Les routes d\'upload acceptent multipart/form-data avec le champ "file"',
                errors: 'Toutes les erreurs suivent le format: { success: false, message: "...", error: "..." }',
                success: 'Toutes les réponses de succès suivent le format: { success: true, message: "...", data: {...} }'
            }
        }

        res.json(docs)
    } catch (error) {
        console.error('Error getting API docs:', error)
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la documentation',
            error: error.message
        })
    }
}

module.exports = {
    getApiDocs
}

