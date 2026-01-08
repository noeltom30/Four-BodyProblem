const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');

class AuthController {
  // Register new user
  async register(req, res) {
    const client = await db.getClient();
    
    try {
      const { email, password, fullName, phone, dateOfBirth, address, city, state, postalCode } = req.body;

      await client.query('BEGIN');

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role) 
         VALUES ($1, $2, $3, $4, 'user') 
         RETURNING id, email, full_name, phone, role, created_at`,
        [email, passwordHash, fullName, phone || null]
      );

      const user = userResult.rows[0];

      // Create KYC profile
      await client.query(
        `INSERT INTO kyc_profiles (user_id, date_of_birth, address, city, state, postal_code, country) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, dateOfBirth || null, address || null, city || null, state || null, postalCode || null, 'India']
      );

      await client.query('COMMIT');

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await db.query(
        'SELECT id, email, password_hash, full_name, phone, role, is_active FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            phone: user.phone,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const result = await db.query(
        `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at,
                k.kyc_status, k.date_of_birth, k.address, k.city, k.state, 
                k.postal_code, k.country, k.credit_score, k.rejection_reason,
                k.submitted_at, k.reviewed_at
         FROM users u
         LEFT JOIN kyc_profiles k ON u.id = k.user_id
         WHERE u.id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const profile = result.rows[0];

      res.json({
        success: true,
        data: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          phone: profile.phone,
          role: profile.role,
          createdAt: profile.created_at,
          kyc: {
            status: profile.kyc_status,
            dateOfBirth: profile.date_of_birth,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            postalCode: profile.postal_code,
            country: profile.country,
            creditScore: profile.credit_score,
            rejectionReason: profile.rejection_reason,
            submittedAt: profile.submitted_at,
            reviewedAt: profile.reviewed_at
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { fullName, phone, dateOfBirth, address, city, state, postalCode } = req.body;

      // Update user basic info
      if (fullName || phone) {
        await db.query(
          `UPDATE users 
           SET full_name = COALESCE($1, full_name),
               phone = COALESCE($2, phone)
           WHERE id = $3`,
          [fullName || null, phone || null, req.user.id]
        );
      }

      // Update KYC profile
      await db.query(
        `UPDATE kyc_profiles 
         SET date_of_birth = COALESCE($1, date_of_birth),
             address = COALESCE($2, address),
             city = COALESCE($3, city),
             state = COALESCE($4, state),
             postal_code = COALESCE($5, postal_code)
         WHERE user_id = $6`,
        [dateOfBirth || null, address || null, city || null, state || null, postalCode || null, req.user.id]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
