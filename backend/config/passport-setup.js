import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db/db.js';

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE google_id = $1 OR email = $2',
          [profile.id, profile.emails[0].value]
        );

        if (existingUser.rows.length > 0) {
          const user = existingUser.rows[0];

          if (!user.google_id) {
            const linkedUser = await pool.query(
              'UPDATE users SET google_id = $1, is_verified = TRUE WHERE user_id = $2 RETURNING *',
              [profile.id, user.user_id]
            );
            return done(null, linkedUser.rows[0]);
          }

          return done(null, user);
        }

        const newUser = await pool.query(
          "INSERT INTO users (google_id, name, email, role, is_verified) VALUES ($1, $2, $3, 'Citizen', TRUE) RETURNING *",
          [profile.id, profile.displayName, profile.emails[0].value]
        );

        done(null, newUser.rows[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
