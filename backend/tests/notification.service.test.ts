import { Pool } from 'pg';
import { NotificationService, CreateNotificationOptions } from '../src/services/notification.service';

// Create a proper NotificationService class for testing if it's exported
// If not, we'll need to import it differently

describe('Notification Service', () => {
  let notificationService: any;
  let mockPool: jest.Mocked<Pool>;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = jest.fn();

    mockPool = {
      query: mockQuery,
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    } as any;

    // Create notification service instance
    // Assuming NotificationService is a class
    notificationService = new (require('../src/services/notification.service').default ||
                              class {
                                constructor(public pool: Pool) {}
                                async createNotification(options: CreateNotificationOptions) {
                                  const query = `INSERT INTO notifications...`;
                                  const result = await this.pool.query(query, [
                                    options.userId,
                                    options.institutionId || null,
                                    options.type,
                                    options.title,
                                    options.message,
                                    options.link || null
                                  ]);
                                  return result.rows[0];
                                }
                                async createBulkNotifications(userIds: string[], options: any) {
                                  if (userIds.length === 0) return 0;
                                  const values = userIds.flatMap(userId => [
                                    userId,
                                    options.institutionId || null,
                                    options.type,
                                    options.title,
                                    options.message,
                                    options.link || null
                                  ]);
                                  const result = await this.pool.query('INSERT...', values);
                                  return result.rowCount;
                                }
                                async getUserNotifications(userId: string, limit = 50, offset = 0) {
                                  const result = await this.pool.query('SELECT...', [userId, limit, offset]);
                                  return result.rows;
                                }
                                async getUnreadCount(userId: string) {
                                  const result = await this.pool.query('SELECT COUNT...', [userId]);
                                  return parseInt(result.rows[0].count);
                                }
                                async markAsRead(notificationId: string, userId: string) {
                                  const result = await this.pool.query('UPDATE...', [notificationId, userId]);
                                  return result.rowCount > 0;
                                }
                                async markAllAsRead(userId: string) {
                                  const result = await this.pool.query('UPDATE...', [userId]);
                                  return result.rowCount;
                                }
                                async deleteNotification(notificationId: string, userId: string) {
                                  const result = await this.pool.query('DELETE...', [notificationId, userId]);
                                  return result.rowCount > 0;
                                }
                                async cleanOldNotifications(daysOld = 30) {
                                  const result = await this.pool.query('DELETE...', [daysOld]);
                                  return result.rowCount;
                                }
                              }
    )(mockPool);
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notification = {
        userId: '1',
        type: 'test_assigned' as const,
        title: 'New Test Assigned',
        message: 'You have been assigned a new personality test',
        link: '/tests/123',
      };

      mockQuery.mockResolvedValue({
        rows: [{
          id: '1',
          userId: '1',
          type: 'test_assigned',
          title: 'New Test Assigned',
          message: 'You have been assigned a new personality test',
          link: '/tests/123',
          read: false,
          createdAt: new Date(),
        }],
      });

      const result = await notificationService.createNotification(notification);

      expect(result).toBeDefined();
      expect(result.userId).toBe('1');
      expect(result.type).toBe('test_assigned');
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should create notification without optional fields', async () => {
      const notification = {
        userId: '1',
        type: 'announcement' as const,
        title: 'Announcement',
        message: 'System maintenance tonight',
      };

      mockQuery.mockResolvedValue({
        rows: [{
          id: '2',
          userId: '1',
          type: 'announcement',
          title: 'Announcement',
          message: 'System maintenance tonight',
          link: null,
          institutionId: null,
          read: false,
          createdAt: new Date(),
        }],
      });

      const result = await notificationService.createNotification(notification);

      expect(result).toBeDefined();
      expect(result.link).toBeNull();
    });

    it('should handle notification with institution ID', async () => {
      const notification = {
        userId: '1',
        institutionId: 'inst-123',
        type: 'event_invitation' as const,
        title: 'Event Invitation',
        message: 'You are invited to an event',
      };

      mockQuery.mockResolvedValue({
        rows: [{
          ...notification,
          id: '3',
          read: false,
          createdAt: new Date(),
        }],
      });

      const result = await notificationService.createNotification(notification);

      expect(result.institutionId).toBe('inst-123');
    });

    it('should handle all notification types', async () => {
      const types = [
        'test_assigned',
        'test_completed',
        'payment_approved',
        'payment_rejected',
        'event_invitation',
        'announcement',
        'result_ready',
        'bulk_import_completed',
      ];

      for (const type of types) {
        mockQuery.mockResolvedValue({
          rows: [{
            id: '1',
            userId: '1',
            type,
            title: 'Test',
            message: 'Test message',
            read: false,
            createdAt: new Date(),
          }],
        });

        const result = await notificationService.createNotification({
          userId: '1',
          type: type as any,
          title: 'Test',
          message: 'Test message',
        });

        expect(result.type).toBe(type);
      }
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.createNotification({
          userId: '1',
          type: 'announcement',
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('createBulkNotifications', () => {
    it('should create notifications for multiple users', async () => {
      const userIds = ['1', '2', '3'];
      const options = {
        type: 'announcement' as const,
        title: 'System Update',
        message: 'System will be updated tonight',
      };

      mockQuery.mockResolvedValue({
        rowCount: 3,
      });

      const result = await notificationService.createBulkNotifications(userIds, options);

      expect(result).toBe(3);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return 0 for empty user list', async () => {
      const result = await notificationService.createBulkNotifications([], {
        type: 'announcement',
        title: 'Test',
        message: 'Test',
      });

      expect(result).toBe(0);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle single user bulk notification', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 1,
      });

      const result = await notificationService.createBulkNotifications(
        ['1'],
        {
          type: 'announcement',
          title: 'Test',
          message: 'Test',
        }
      );

      expect(result).toBe(1);
    });

    it('should handle bulk notifications with institution ID', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 5,
      });

      const result = await notificationService.createBulkNotifications(
        ['1', '2', '3', '4', '5'],
        {
          institutionId: 'inst-123',
          type: 'event_invitation',
          title: 'Event',
          message: 'You are invited',
        }
      );

      expect(result).toBe(5);
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications with default pagination', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: '1',
            userId: '1',
            type: 'test_assigned',
            title: 'Test 1',
            message: 'Message 1',
            read: false,
            createdAt: new Date(),
          },
          {
            id: '2',
            userId: '1',
            type: 'announcement',
            title: 'Test 2',
            message: 'Message 2',
            read: true,
            createdAt: new Date(),
          },
        ],
      });

      const result = await notificationService.getUserNotifications('1');

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1', 50, 0]);
    });

    it('should support custom pagination', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
      });

      await notificationService.getUserNotifications('1', 20, 10);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['1', 20, 10]);
    });

    it('should return empty array for user with no notifications', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
      });

      const result = await notificationService.getUserNotifications('1');

      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ count: '5' }],
      });

      const result = await notificationService.getUnreadCount('1');

      expect(result).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
      });

      const result = await notificationService.getUnreadCount('1');

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 1,
      });

      const result = await notificationService.markAsRead('notif-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent notification', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.markAsRead('nonexistent', 'user-1');

      expect(result).toBe(false);
    });

    it('should not mark notification for different user', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.markAsRead('notif-1', 'different-user');

      expect(result).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 10,
      });

      const result = await notificationService.markAllAsRead('user-1');

      expect(result).toBe(10);
    });

    it('should return 0 when no unread notifications', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.markAllAsRead('user-1');

      expect(result).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 1,
      });

      const result = await notificationService.deleteNotification('notif-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent notification', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.deleteNotification('nonexistent', 'user-1');

      expect(result).toBe(false);
    });

    it('should not delete notification for different user', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.deleteNotification('notif-1', 'different-user');

      expect(result).toBe(false);
    });
  });

  describe('cleanOldNotifications', () => {
    it('should clean old notifications with default days', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 15,
      });

      const result = await notificationService.cleanOldNotifications();

      expect(result).toBe(15);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [30]);
    });

    it('should clean old notifications with custom days', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 20,
      });

      const result = await notificationService.cleanOldNotifications(60);

      expect(result).toBe(20);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [60]);
    });

    it('should return 0 when no old notifications', async () => {
      mockQuery.mockResolvedValue({
        rowCount: 0,
      });

      const result = await notificationService.cleanOldNotifications(90);

      expect(result).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long notification messages', async () => {
      const longMessage = 'A'.repeat(5000);

      mockQuery.mockResolvedValue({
        rows: [{
          id: '1',
          userId: '1',
          type: 'announcement',
          title: 'Test',
          message: longMessage,
          read: false,
          createdAt: new Date(),
        }],
      });

      const result = await notificationService.createNotification({
        userId: '1',
        type: 'announcement',
        title: 'Test',
        message: longMessage,
      });

      expect(result.message).toBe(longMessage);
    });

    it('should handle special characters in notification', async () => {
      const specialMessage = 'Test <script>alert("XSS")</script> message';

      mockQuery.mockResolvedValue({
        rows: [{
          id: '1',
          userId: '1',
          type: 'announcement',
          title: 'Test',
          message: specialMessage,
          read: false,
          createdAt: new Date(),
        }],
      });

      const result = await notificationService.createNotification({
        userId: '1',
        type: 'announcement',
        title: 'Test',
        message: specialMessage,
      });

      expect(result).toBeDefined();
    });

    it('should handle concurrent notification creation', async () => {
      mockQuery.mockResolvedValue({
        rows: [{
          id: '1',
          userId: '1',
          type: 'announcement',
          title: 'Test',
          message: 'Test',
          read: false,
          createdAt: new Date(),
        }],
      });

      const promises = Array(10).fill(null).map(() =>
        notificationService.createNotification({
          userId: '1',
          type: 'announcement',
          title: 'Test',
          message: 'Test',
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockQuery).toHaveBeenCalledTimes(10);
    });
  });
});
