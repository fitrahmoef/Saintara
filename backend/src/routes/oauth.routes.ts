import { Router } from 'express';
import oauthController from '../controllers/oauth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * OAuth Routes
 */

// Google OAuth
router.get('/google', oauthController.googleAuth.bind(oauthController));
router.get('/google/callback', oauthController.googleCallback.bind(oauthController));

// GitHub OAuth
router.get('/github', oauthController.githubAuth.bind(oauthController));
router.get('/github/callback', oauthController.githubCallback.bind(oauthController));

// Get linked accounts (authenticated)
router.get('/linked', authenticateToken, oauthController.getLinkedAccounts.bind(oauthController));

// Link account to existing user (authenticated)
router.post('/link', authenticateToken, oauthController.linkAccount.bind(oauthController));

// Unlink account (authenticated)
router.delete('/:provider/unlink', authenticateToken, oauthController.unlinkAccount.bind(oauthController));

export default router;
