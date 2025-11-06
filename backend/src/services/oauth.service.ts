import axios from 'axios';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * OAuth Service
 * Handles Google and GitHub OAuth authentication
 */

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export class OAuthService {
  /**
   * Google OAuth - Get authorization URL
   */
  getGoogleAuthUrl(): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * Google OAuth - Exchange code for tokens
   */
  async getGoogleTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token: string;
  }> {
    const url = 'https://oauth2.googleapis.com/token';

    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    };

    const res = await axios.post(url, new URLSearchParams(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return res.data;
  }

  /**
   * Google OAuth - Get user info
   */
  async getGoogleUser(access_token: string): Promise<GoogleUserInfo> {
    const res = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return res.data;
  }

  /**
   * GitHub OAuth - Get authorization URL
   */
  getGitHubAuthUrl(): string {
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = {
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
      scope: 'user:email',
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  /**
   * GitHub OAuth - Exchange code for access token
   */
  async getGitHubTokens(code: string): Promise<{ access_token: string }> {
    const url = 'https://github.com/login/oauth/access_token';

    const values = {
      code,
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    };

    const res = await axios.post(url, values, {
      headers: {
        Accept: 'application/json',
      },
    });

    return res.data;
  }

  /**
   * GitHub OAuth - Get user info
   */
  async getGitHubUser(access_token: string): Promise<GitHubUserInfo> {
    const res = await axios.get<GitHubUserInfo>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // If email is private, fetch from emails endpoint
    if (!res.data.email) {
      const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const primaryEmail = emailRes.data.find(
        (email: any) => email.primary && email.verified
      );
      if (primaryEmail) {
        res.data.email = primaryEmail.email;
      }
    }

    return res.data;
  }

  /**
   * Find or create user from OAuth data
   */
  async findOrCreateUser(
    provider: 'google' | 'github',
    profileId: string,
    email: string,
    name: string,
    avatarUrl?: string
  ): Promise<{ user: any; isNew: boolean }> {
    // Check if OAuth account exists
    const oauthResult = await pool.query(
      'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
      [provider, profileId]
    );

    if (oauthResult.rows.length > 0) {
      // OAuth account exists, get user
      const userId = oauthResult.rows[0].user_id;
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

      return {
        user: userResult.rows[0],
        isNew: false,
      };
    }

    // Check if user with same email exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    let user;
    let isNew = false;

    if (userResult.rows.length > 0) {
      // User exists, link OAuth account
      user = userResult.rows[0];
    } else {
      // Create new user
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      const newUserResult = await pool.query(
        `INSERT INTO users (email, password, full_name, avatar_url, email_verified, role)
         VALUES ($1, $2, $3, $4, true, 'user')
         RETURNING *`,
        [email, randomPassword, name, avatarUrl]
      );

      user = newUserResult.rows[0];
      isNew = true;
    }

    // Link OAuth account
    await pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (provider, provider_user_id) DO UPDATE
       SET email = $4, name = $5, avatar_url = $6, updated_at = NOW()`,
      [user.id, provider, profileId, email, name, avatarUrl]
    );

    return { user, isNew };
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(userId: string, provider: 'google' | 'github'): Promise<boolean> {
    // Check if user has password (not OAuth-only account)
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Check if this is the only login method
    const oauthCount = await pool.query(
      'SELECT COUNT(*) FROM oauth_accounts WHERE user_id = $1',
      [userId]
    );

    if (oauthCount.rows[0].count === '1' && !userResult.rows[0].password) {
      throw new Error('Cannot unlink the only login method. Set a password first.');
    }

    // Unlink OAuth account
    const result = await pool.query(
      'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    return result.rowCount! > 0;
  }

  /**
   * Get linked OAuth accounts for user
   */
  async getLinkedAccounts(userId: string): Promise<Array<{
    provider: string;
    email: string;
    name: string;
    linked_at: Date;
  }>> {
    const result = await pool.query(
      `SELECT provider, email, name, created_at as linked_at
       FROM oauth_accounts
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }
}

export default new OAuthService();
