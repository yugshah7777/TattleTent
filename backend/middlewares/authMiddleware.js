import jwt from 'jsonwebtoken';
import pool from '../db/db.js';

const protect = async (req, res, next) => {
  let token;

  // Token check
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userResult = await pool.query(
        'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = userResult.rows[0];

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Restrict access to admin users only
 */
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Ringmaster' || req.user.role === 'Groundmaster' )) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

const staffOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'Staff' ||
      req.user.role === 'Admin' ||
      req.user.role === 'Ringmaster' ||
      req.user.role === 'Groundmaster')
  ) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Staff or admins only.' });
  }
};

export { protect, adminOnly, staffOrAdmin };
