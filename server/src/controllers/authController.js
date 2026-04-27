const User = require('../models/User');
const OTP = require('../models/OTP');
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const { sendOTPEmail } = require('../utils/sendEmail');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// @desc    Send OTP to email for verification
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            purpose: Joi.string().valid('register', 'login', 'reset').default('register'),
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { email, purpose } = value;

        // If registering, make sure email isn't already taken
        if (purpose === 'register') {
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ error: 'An account with this email already exists' });
            }
        }

        // Rate-limit: max 5 OTPs per email in the last 15 minutes
        const recentOTPs = await OTP.countDocuments({
            email,
            createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
        });
        if (recentOTPs >= 5) {
            return res.status(429).json({ error: 'Too many OTP requests. Please try again in 15 minutes.' });
        }

        // Delete any existing un-verified OTPs for this email + purpose
        await OTP.deleteMany({ email, purpose, verified: false });

        // Generate and store new OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await OTP.create({ email, otp: otpCode, purpose, expiresAt });

        // Send the email
        const result = await sendOTPEmail(email, otpCode, purpose);

        res.json({
            message: 'OTP sent to your email',
            // Include preview URL in dev mode so you can see the email
            ...(result.previewUrl && { previewUrl: result.previewUrl }),
        });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            otp: Joi.string().length(6).required(),
            purpose: Joi.string().valid('register', 'login', 'reset').default('register'),
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { email, otp, purpose } = value;

        // Find the most recent valid OTP for this email + purpose
        const record = await OTP.findOne({
            email,
            purpose,
            verified: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!record) {
            return res.status(400).json({ error: 'OTP has expired or is invalid. Please request a new one.' });
        }

        // Brute-force protection: max 5 attempts
        if (record.attempts >= 5) {
            await OTP.deleteOne({ _id: record._id });
            return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
        }

        // Check OTP match
        if (record.otp !== otp) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        // Mark as verified
        record.verified = true;
        await record.save();

        res.json({ message: 'Email verified successfully', verified: true });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};

// @desc    Register new user (requires verified OTP)
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('donor', 'volunteer', 'ngo', 'admin').required(),
            city: Joi.string().required(),
            // Extra fields based on role
            orgName: Joi.string().when('role', { is: 'ngo', then: Joi.required() }),
            address: Joi.string().when('role', { is: 'ngo', then: Joi.required() }),
            idType: Joi.string().when('role', { is: 'volunteer', then: Joi.required() }),
        }).options({ stripUnknown: true });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { name, email, phone, password, role, city } = value;

        // Check email was verified via OTP
        const verifiedOtp = await OTP.findOne({
            email,
            purpose: 'register',
            verified: true,
        });
        if (!verifiedOtp) {
            return res.status(400).json({ error: 'Email not verified. Please verify your email with an OTP first.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name, email, phone, passwordHash, role, city
        });

        // Role-specific creations
        if (role === 'volunteer') {
            await Volunteer.create({ userId: user._id, idType: value.idType });
        } else if (role === 'ngo') {
            await NGO.create({ userId: user._id, orgName: value.orgName, address: value.address });
        }

        // Clean up used OTP records
        await OTP.deleteMany({ email, purpose: 'register' });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login, getMe, sendOtp, verifyOtp };
