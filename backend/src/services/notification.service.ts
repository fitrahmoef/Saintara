import { Pool } from 'pg';
import logger from '../config/logger'

export type NotificationType =
  | 'test_assigned'
  | 'test_completed'
  | 'payment_approved'
  | 'payment_rejected'
  | 'event_invitation'
  | 'announcement'
  | 'result_ready'
  | 'bulk_import_completed';

export interface Notification {
  id: string;
  userId: string;
  institutionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface CreateNotificationOptions {
  userId: string;
  institutionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

class NotificationService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a notification
   */
  async createNotification(options: CreateNotificationOptions): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, institution_id, type, title, message, link)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id as "userId", institution_id as "institutionId",
                type, title, message, link, read, created_at as "createdAt",
                read_at as "readAt"
    `;

    const values = [
      options.userId,
      options.institutionId || null,
      options.type,
      options.title,
      options.message,
      options.link || null
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<number> {
    if (userIds.length === 0) {
      return 0;
    }

    // Build values array for bulk insert
    const values: unknown[] = [];
    const placeholders = userIds.map((userId, index) => {
      const baseIndex = index * 6;
      values.push(
        userId,
        options.institutionId || null,
        options.type,
        options.title,
        options.message,
        options.link || null
      );
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
    }).join(', ');

    const query = `
      INSERT INTO notifications (user_id, institution_id, type, title, message, link)
      VALUES ${placeholders}
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows.length;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { unreadOnly = false, limit = 20, offset = 0 } = options;

    const whereClause = unreadOnly
      ? 'WHERE user_id = $1 AND read = false'
      : 'WHERE user_id = $1';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `;

    const dataQuery = `
      SELECT id, user_id as "userId", institution_id as "institutionId",
             type, title, message, link, read, created_at as "createdAt",
             read_at as "readAt"
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [userId]),
        this.pool.query(dataQuery, [userId, limit, offset])
      ]);

      return {
        notifications: dataResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2 AND read = false
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [notificationId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows.length;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [notificationId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete old read notifications
   */
  async cleanOldNotifications(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE read = true
        AND read_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows.length;
    } catch (error) {
      logger.error('Error cleaning old notifications:', error);
      return 0;
    }
  }

  /**
   * Helper: Notify test assigned
   */
  async notifyTestAssigned(
    userId: string,
    testTitle: string,
    testId: string,
    institutionId?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      institutionId,
      type: 'test_assigned',
      title: 'Tes Baru Ditugaskan',
      message: `Anda telah ditugaskan untuk mengerjakan tes: ${testTitle}`,
      link: `/dashboard/tests/${testId}`
    });
  }

  /**
   * Helper: Notify test completed
   */
  async notifyTestCompleted(
    userId: string,
    testTitle: string,
    resultId: string,
    institutionId?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      institutionId,
      type: 'test_completed',
      title: 'Hasil Tes Tersedia',
      message: `Hasil tes "${testTitle}" Anda sudah tersedia`,
      link: `/dashboard/results/${resultId}`
    });
  }

  /**
   * Helper: Notify payment approved
   */
  async notifyPaymentApproved(
    userId: string,
    amount: number,
    institutionId?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      institutionId,
      type: 'payment_approved',
      title: 'Pembayaran Disetujui',
      message: `Pembayaran Anda sebesar Rp ${amount.toLocaleString('id-ID')} telah disetujui`,
      link: '/dashboard/payments'
    });
  }

  /**
   * Helper: Notify payment rejected
   */
  async notifyPaymentRejected(
    userId: string,
    amount: number,
    reason: string,
    institutionId?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      institutionId,
      type: 'payment_rejected',
      title: 'Pembayaran Ditolak',
      message: `Pembayaran Anda sebesar Rp ${amount.toLocaleString('id-ID')} ditolak. Alasan: ${reason}`,
      link: '/dashboard/payments'
    });
  }

  /**
   * Helper: Notify event invitation
   */
  async notifyEventInvitation(
    userId: string,
    eventTitle: string,
    eventId: string,
    institutionId?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      institutionId,
      type: 'event_invitation',
      title: 'Undangan Event',
      message: `Anda diundang ke event: ${eventTitle}`,
      link: `/events/${eventId}`
    });
  }

  /**
   * Helper: Create announcement for institution
   */
  async createAnnouncement(
    userIds: string[],
    title: string,
    message: string,
    link?: string,
    institutionId?: string
  ): Promise<number> {
    return await this.createBulkNotifications(userIds, {
      institutionId,
      type: 'announcement',
      title,
      message,
      link
    });
  }
}

export default NotificationService;
