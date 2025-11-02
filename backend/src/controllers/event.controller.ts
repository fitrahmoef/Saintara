import { Request, Response } from 'express';
import pool from '../config/database';

// Get all events
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { status, event_type, limit = 20, offset = 0 } = req.query;

    let query = `SELECT * FROM events WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (event_type) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(event_type);
    }

    query += ` ORDER BY event_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get registered users count and list
    const registrationsResult = await pool.query(
      `SELECT er.*, u.name, u.email
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.created_at DESC`,
      [id]
    );

    res.json({
      event: eventResult.rows[0],
      registrations: registrationsResult.rows,
      registered_count: registrationsResult.rows.length
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create event (admin)
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, event_type, event_date, location, capacity } = req.body;

    const result = await pool.query(
      `INSERT INTO events (title, description, event_type, event_date, location, capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
       RETURNING *`,
      [title, description, event_type, event_date, location, capacity]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update event (admin)
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, event_type, event_date, location, capacity, status } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (title) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }
    if (description) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (event_type) {
      paramCount++;
      updates.push(`event_type = $${paramCount}`);
      values.push(event_type);
    }
    if (event_date) {
      paramCount++;
      updates.push(`event_date = $${paramCount}`);
      values.push(event_date);
    }
    if (location) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      values.push(location);
    }
    if (capacity) {
      paramCount++;
      updates.push(`capacity = $${paramCount}`);
      values.push(capacity);
    }
    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const result = await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event (admin)
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register for event
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Check if event exists and is available
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventResult.rows[0];

    if (event.status !== 'upcoming') {
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    // Check capacity
    if (event.capacity && event.registered_count >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Check if already registered
    const existingReg = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingReg.rows.length > 0) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Register user
    const result = await pool.query(
      `INSERT INTO event_registrations (event_id, user_id, status)
       VALUES ($1, $2, 'registered')
       RETURNING *`,
      [id, userId]
    );

    // Update event registered count
    await pool.query(
      'UPDATE events SET registered_count = registered_count + 1 WHERE id = $1',
      [id]
    );

    res.status(201).json({
      message: 'Successfully registered for event',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel event registration
export const cancelEventRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE event_registrations
       SET status = 'cancelled'
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Update event registered count
    await pool.query(
      'UPDATE events SET registered_count = registered_count - 1 WHERE id = $1',
      [id]
    );

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's event registrations
export const getUserEventRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const result = await pool.query(
      `SELECT er.*, e.title, e.event_type, e.event_date, e.location, e.status as event_status
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = $1
       ORDER BY e.event_date DESC`,
      [userId]
    );

    res.json({ registrations: result.rows });
  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark attendance (admin)
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { event_id, user_id } = req.body;

    const result = await pool.query(
      `UPDATE event_registrations
       SET status = 'attended'
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [event_id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({
      message: 'Attendance marked successfully',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
