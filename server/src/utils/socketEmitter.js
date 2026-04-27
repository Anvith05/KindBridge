// Emit socket events and optionally persist a Notification record.
// Usage in controllers: const { emitToUser, emitToRole } = require('../utils/socketEmitter');
const Notification = require('../models/Notification');

/**
 * Emit an event to a specific user (by their userId) and persist it.
 */
const emitToUser = async (req, userId, event, data, persist = true) => {
    const io = req.app.get('io');
    if (io) {
        io.to(userId.toString()).emit(event, data);
    }

    if (persist && data.message) {
        try {
            await Notification.create({
                userId,
                type: event,
                message: data.message,
                data: data,
            });
        } catch (e) {
            console.error('Failed to persist notification:', e.message);
        }
    }
};

/**
 * Emit an event to all users in a specific role room.
 */
const emitToRole = (req, role, event, data) => {
    const io = req.app.get('io');
    if (io) {
        io.to(`role:${role}`).emit(event, data);
    }
};

/**
 * Broadcast an event to all connected users.
 */
const emitToAll = (req, event, data) => {
    const io = req.app.get('io');
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { emitToUser, emitToRole, emitToAll };
