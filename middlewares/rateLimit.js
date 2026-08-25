/**
 * Limiteur de débit minimaliste, en mémoire.
 *
 * Volontairement sans dépendance ni store externe : l'API tourne sur une
 * instance unique, et l'objectif est d'empêcher le spam d'un client, pas de
 * tenir un compteur distribué. Si l'API passe un jour en multi-instances, il
 * faudra basculer sur `express-rate-limit` avec un store Redis.
 */

/**
 * @param {Object} options
 * @param {number} options.windowMs - Largeur de la fenêtre glissante
 * @param {number} options.max - Nombre de requêtes autorisées dans la fenêtre
 * @param {string} [options.message] - Message renvoyé en cas de dépassement
 */
const rateLimit = ({ windowMs, max, message = 'Trop de requêtes, réessayez dans quelques instants' }) => {
    /** @type {Map<string, number[]>} clé -> horodatages des requêtes retenues */
    const hits = new Map()
    let lastSweep = Date.now()

    // Purge des clés inactives, amortie sur les appels plutôt que sur un
    // setInterval : pas de timer qui empêche le process de s'arrêter.
    const sweep = (now) => {
        if (now - lastSweep < windowMs) return
        lastSweep = now
        for (const [key, timestamps] of hits) {
            if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > windowMs) {
                hits.delete(key)
            }
        }
    }

    return (req, res, next) => {
        const now = Date.now()
        sweep(now)

        // L'utilisateur authentifié prime sur l'IP : derrière le wifi d'un
        // salon, tous les visiteurs partagent la même adresse.
        const key = req.exposantId || req.inviteId || req.userId || req.ip

        const timestamps = (hits.get(String(key)) || []).filter(ts => now - ts < windowMs)

        if (timestamps.length >= max) {
            const retryAfter = Math.ceil((windowMs - (now - timestamps[0])) / 1000)
            res.set('Retry-After', String(retryAfter))
            return res.status(429).json({
                success: false,
                message,
                retryAfter
            })
        }

        timestamps.push(now)
        hits.set(String(key), timestamps)
        next()
    }
}

module.exports = rateLimit
