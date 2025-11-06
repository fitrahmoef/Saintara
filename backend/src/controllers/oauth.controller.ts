import { Request, Response } from 'express';
import oauthService from '../services/oauth.service';
import { logger } from '../utils/logger';

/**
 * OAuth Controller
 * Handles Google and GitHub OAuth flows
 */

export class OAuthController {
  /**
   * Google OAuth - Redirect to Google
   * GET /api/oauth/google
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const url = oauthService.getGoogleAuthUrl();
      res.redirect(url);
    } catch (error) {
      logger.error('Google OAuth Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
  }

  /**
   * Google OAuth - Callback
   * GET /api/oauth/google/callback
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=missing_code`);
        return;
      }

      // Exchange code for tokens
      const { access_token } = await oauthService.getGoogleTokens(code);

      // Get user info
      const googleUser = await oauthService.getGoogleUser(access_token);

      // Find or create user
      const { user, isNew } = await oauthService.findOrCreateUser(
        'google',
        googleUser.id,
        googleUser.email,
        googleUser.name,
        googleUser.picture
      );

      // Generate JWT
      const token = oauthService.generateToken(user);

      logger.info(`Google OAuth success for user ${user.id} (${isNew ? 'new' : 'existing'})`);

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/oauth-callback?token=${token}&isNew=${isNew}`
      );
    } catch (error: any) {
      logger.error('Google OAuth Callback Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
  }

  /**
   * GitHub OAuth - Redirect to GitHub
   * GET /api/oauth/github
   */
  async githubAuth(req: Request, res: Response): Promise<void> {
    try {
      const url = oauthService.getGitHubAuthUrl();
      res.redirect(url);
    } catch (error) {
      logger.error('GitHub OAuth Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
  }

  /**
   * GitHub OAuth - Callback
   * GET /api/oauth/github/callback
   */
  async githubCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=missing_code`);
        return;
      }

      // Exchange code for access token
      const { access_token } = await oauthService.getGitHubTokens(code);

      // Get user info
      const githubUser = await oauthService.getGitHubUser(access_token);

      if (!githubUser.email) {
        res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=email_required`);
        return;
      }

      // Find or create user
      const { user, isNew } = await oauthService.findOrCreateUser(
        'github',
        githubUser.id.toString(),
        githubUser.email,
        githubUser.name || githubUser.login,
        githubUser.avatar_url
      );

      // Generate JWT
      const token = oauthService.generateToken(user);

      logger.info(`GitHub OAuth success for user ${user.id} (${isNew ? 'new' : 'existing'})`);

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/oauth-callback?token=${token}&isNew=${isNew}`
      );
    } catch (error: any) {
      logger.error('GitHub OAuth Callback Error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
  }

  /**
   * Get linked OAuth accounts
   * GET /api/oauth/linked
   */
  async getLinkedAccounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const accounts = await oauthService.getLinkedAccounts(userId);

      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      logger.error('Get Linked Accounts Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan linked accounts',
      });
    }
  }

  /**
   * Unlink OAuth account
   * DELETE /api/oauth/:provider/unlink
   */
  async unlinkAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { provider } = req.params;

      if (provider !== 'google' && provider !== 'github') {
        res.status(400).json({
          success: false,
          message: 'Invalid provider',
        });
        return;
      }

      await oauthService.unlinkOAuthAccount(userId, provider);

      logger.info(`OAuth account unlinked: ${provider} for user ${userId}`);

      res.json({
        success: true,
        message: `${provider} account berhasil di-unlink`,
      });
    } catch (error: any) {
      logger.error('Unlink OAuth Account Error:', error);

      if (error.message.includes('only login method')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Gagal unlink account',
      });
    }
  }

  /**
   * Link OAuth account to existing user
   * This is called when a logged-in user wants to add OAuth provider
   */
  async linkAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { provider, code } = req.body;

      if (!provider || !code) {
        res.status(400).json({
          success: false,
          message: 'Provider and code required',
        });
        return;
      }

      let profileId: string;
      let email: string;
      let name: string;
      let avatarUrl: string | undefined;

      if (provider === 'google') {
        const { access_token } = await oauthService.getGoogleTokens(code);
        const googleUser = await oauthService.getGoogleUser(access_token);
        profileId = googleUser.id;
        email = googleUser.email;
        name = googleUser.name;
        avatarUrl = googleUser.picture;
      } else if (provider === 'github') {
        const { access_token } = await oauthService.getGitHubTokens(code);
        const githubUser = await oauthService.getGitHubUser(access_token);
        profileId = githubUser.id.toString();
        email = githubUser.email;
        name = githubUser.name || githubUser.login;
        avatarUrl = githubUser.avatar_url;
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid provider',
        });
        return;
      }

      // Link account
      const { pool } = require('../config/database');
      await pool.query(
        `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, name, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [userId, provider, profileId, email, name, avatarUrl]
      );

      logger.info(`OAuth account linked: ${provider} for user ${userId}`);

      res.json({
        success: true,
        message: `${provider} account berhasil di-link`,
      });
    } catch (error) {
      logger.error('Link OAuth Account Error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal link account',
      });
    }
  }
}

export default new OAuthController();
