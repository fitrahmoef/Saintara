import express from 'express';
import { body } from 'express-validator';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getUserEventRegistrations,
  markAttendance
} from '../controllers/event.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

// Public/User routes
router.get('/', getAllEvents);
router.get('/my-registrations', authenticate, getUserEventRegistrations);
router.get('/:id', getEventById);

router.post('/:id/register', authenticate, registerForEvent);
router.put('/:id/cancel', authenticate, cancelEventRegistration);

// Admin routes
router.post(
  '/create',
  authenticate,
  requireRole(['admin']),
  [
    body('title').notEmpty(),
    body('event_type').isIn(['webinar', 'talkshow', 'workshop', 'seminar']),
    body('event_date').isISO8601(),
    body('capacity').optional().isInt()
  ],
  createEvent
);

router.put('/:id', authenticate, requireRole(['admin']), updateEvent);
router.delete('/:id', authenticate, requireRole(['admin']), deleteEvent);

router.post(
  '/attendance',
  authenticate,
  requireRole(['admin']),
  [
    body('event_id').isInt(),
    body('user_id').isInt()
  ],
  markAttendance
);

export default router;
