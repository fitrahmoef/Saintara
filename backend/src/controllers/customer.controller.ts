/**
 * Customer Management Controller
 * Handles customer management for institution admins including bulk upload
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import fs from 'fs';
import {
  BulkImportCustomerDto,
  BulkImportResult,
  BulkImportError,
  CustomerListQuery,
} from '../types/institution.types';
import { emailService } from '../services/email.service';

/**
 * Get customers for institution admin
 */
export const getCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      institution_id,
      tag_id,
      status,
      search,
      page = '1',
      limit = '20',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query as unknown as CustomerListQuery;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Determine which institution to query
    let targetInstitutionId = institution_id;
    if (req.user!.role !== 'superadmin') {
      // Non-superadmins can only see their own institution
      targetInstitutionId = req.user!.institution_id;
    }

    if (!targetInstitutionId) {
      res.status(400).json({
        status: 'error',
        message: 'Institution ID required',
      });
      return;
    }

    let countQuery = `
      SELECT COUNT(DISTINCT u.id)
      FROM users u
      WHERE u.institution_id = $1 AND u.role = 'user'
    `;

    let dataQuery = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.nickname,
        u.phone,
        u.gender,
        u.blood_type,
        u.country,
        u.city,
        u.is_active,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        u.managed_by_admin_id,
        admin.name as managed_by_admin_name,
        COUNT(DISTINCT t.id) as total_tests,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tests,
        MAX(t.completed_at) as last_test_date,
        ARRAY_AGG(DISTINCT ct.id) FILTER (WHERE ct.id IS NOT NULL) as tag_ids,
        ARRAY_AGG(DISTINCT ct.name) FILTER (WHERE ct.name IS NOT NULL) as tag_names
      FROM users u
      LEFT JOIN users admin ON admin.id = u.managed_by_admin_id
      LEFT JOIN tests t ON t.user_id = u.id
      LEFT JOIN customer_tag_assignments cta ON cta.customer_id = u.id
      LEFT JOIN customer_tags ct ON ct.id = cta.tag_id
      WHERE u.institution_id = $1 AND u.role = 'user'
    `;

    const queryParams: (string | boolean | number)[] = [targetInstitutionId];
    let paramIndex = 2;

    // Add tag filter
    if (tag_id) {
      const tagCondition = ` AND EXISTS (
        SELECT 1 FROM customer_tag_assignments cta2
        WHERE cta2.customer_id = u.id AND cta2.tag_id = $${paramIndex}
      )`;
      countQuery += tagCondition;
      dataQuery += tagCondition;
      queryParams.push(tag_id);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      const isActive = status === 'active';
      countQuery += ` AND u.is_active = $${paramIndex}`;
      dataQuery += ` AND u.is_active = $${paramIndex}`;
      queryParams.push(isActive);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      const searchCondition = ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      countQuery += searchCondition;
      dataQuery += searchCondition;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(countQuery, queryParams);
    const totalCustomers = parseInt(countResult.rows[0].count);

    // Add GROUP BY and ORDER BY
    dataQuery += ` GROUP BY u.id, admin.name`;

    // Add sorting
    const validSortFields = ['name', 'email', 'created_at', 'last_test_date'];
    const sortField = validSortFields.includes(sort_by as string)
      ? sort_by
      : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    dataQuery += ` ORDER BY u.${sortField} ${sortDirection} NULLS LAST`;

    // Add pagination
    dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limitNum,
      offset,
    ]);

    res.json({
      status: 'success',
      data: {
        customers: dataResult.rows,
        pagination: {
          total: totalCustomers,
          page: pageNum,
          limit: limitNum,
          total_pages: Math.ceil(totalCustomers / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get customers';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Get single customer details
 */
export const getCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;

    const result = await pool.query(
      `SELECT
        u.*,
        admin.name as managed_by_admin_name,
        admin.email as managed_by_admin_email,
        i.name as institution_name,
        COUNT(DISTINCT t.id) as total_tests,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tests,
        ARRAY_AGG(DISTINCT ct.name) FILTER (WHERE ct.name IS NOT NULL) as tags
      FROM users u
      LEFT JOIN users admin ON admin.id = u.managed_by_admin_id
      LEFT JOIN institutions i ON i.id = u.institution_id
      LEFT JOIN tests t ON t.user_id = u.id
      LEFT JOIN customer_tag_assignments cta ON cta.customer_id = u.id
      LEFT JOIN customer_tags ct ON ct.id = cta.tag_id
      WHERE u.id = $1 AND u.role = 'user'
      GROUP BY u.id, admin.name, admin.email, i.name`,
      [customerId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
      return;
    }

    const customer = result.rows[0];

    // Check if user has access to this customer's institution
    if (
      req.user!.role !== 'superadmin' &&
      customer.institution_id !== req.user!.institution_id
    ) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied to this customer',
      });
      return;
    }

    // Remove password from response
    delete customer.password;

    res.json({
      status: 'success',
      data: {
        customer,
      },
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get customer';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Create single customer
 */
export const createCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
      return;
    }

    const {
      email,
      name,
      password,
      phone,
      gender,
      blood_type,
      country,
      city,
      nickname,
    } = req.body;

    // Get institution ID
    const institutionId =
      req.user!.role === 'superadmin'
        ? req.body.institution_id
        : req.user!.institution_id;

    if (!institutionId) {
      res.status(400).json({
        status: 'error',
        message: 'Institution ID required',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        status: 'error',
        message: 'Email already exists',
      });
      return;
    }

    // Check institution user limit
    const institutionResult = await pool.query(
      'SELECT max_users FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (institutionResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    const maxUsers = institutionResult.rows[0].max_users;

    const currentUsersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = $2',
      [institutionId, 'user']
    );

    const currentUsers = parseInt(currentUsersResult.rows[0].count);

    if (currentUsers >= maxUsers) {
      res.status(400).json({
        status: 'error',
        message: `Institution has reached maximum user limit (${maxUsers} users)`,
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const result = await pool.query(
      `INSERT INTO users
      (email, password, name, phone, gender, blood_type, country, city, nickname, role, institution_id, managed_by_admin_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user', $10, $11, true)
      RETURNING id, email, name, phone, gender, blood_type, country, city, nickname, role, institution_id, created_at`,
      [
        email,
        hashedPassword,
        name,
        phone,
        gender,
        blood_type,
        country,
        city,
        nickname,
        institutionId,
        req.user!.id,
      ]
    );

    const customer = result.rows[0];

    // Send welcome email (optional - can be toggled)
    try {
      await emailService.sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      status: 'success',
      data: {
        customer,
      },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create customer';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Update customer
 */
export const updateCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.password;
    delete updateData.role;
    delete updateData.institution_id;

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: (string | boolean | number)[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name',
      'nickname',
      'phone',
      'gender',
      'blood_type',
      'country',
      'city',
      'is_active',
    ];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'No valid fields to update',
      });
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(customerId);

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND role = 'user'
      RETURNING id, email, name, nickname, phone, gender, blood_type, country, city, is_active, updated_at
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: {
        customer: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update customer';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { customerId } = req.params;

    // Soft delete - deactivate the customer
    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND role = $2 RETURNING id',
      [customerId, 'user']
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Customer deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete customer';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Download customer import template
 */
export const downloadTemplate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Create workbook and worksheet with ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Define columns with headers and widths
    worksheet.columns = [
      { header: 'email', key: 'email', width: 25 },
      { header: 'name', key: 'name', width: 20 },
      { header: 'password', key: 'password', width: 15 },
      { header: 'phone', key: 'phone', width: 15 },
      { header: 'gender', key: 'gender', width: 10 },
      { header: 'blood_type', key: 'blood_type', width: 12 },
      { header: 'country', key: 'country', width: 15 },
      { header: 'city', key: 'city', width: 15 },
      { header: 'nickname', key: 'nickname', width: 15 },
    ];

    // Add example row
    worksheet.addRow({
      email: 'example@email.com',
      name: 'John Doe',
      password: 'password123',
      phone: '08123456789',
      gender: 'male',
      blood_type: 'O',
      country: 'Indonesia',
      city: 'Jakarta',
      nickname: 'Johnny',
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=customer_import_template.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate template';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Bulk import customers from Excel/CSV file
 */
export const bulkImportCustomers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
      return;
    }

    // Get institution ID
    const institutionId =
      req.user!.role === 'superadmin'
        ? req.body.institution_id
        : req.user!.institution_id;

    if (!institutionId) {
      res.status(400).json({
        status: 'error',
        message: 'Institution ID required',
      });
      return;
    }

    // Check institution user limit
    const institutionResult = await pool.query(
      'SELECT max_users FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (institutionResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Institution not found',
      });
      return;
    }

    const maxUsers = institutionResult.rows[0].max_users;

    const currentUsersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE institution_id = $1 AND role = $2',
      [institutionId, 'user']
    );

    const currentUsers = parseInt(currentUsersResult.rows[0].count);

    // Read the uploaded file with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    // Convert worksheet to JSON (skip header row)
    const data: BulkImportCustomerDto[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Store headers
        row.eachCell((cell) => {
          headers.push(cell.value?.toString() || '');
        });
      } else {
        // Convert row to object
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        data.push(rowData);
      }
    });

    if (data.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(400).json({
        status: 'error',
        message: 'File contains no data',
      });
      return;
    }

    // Check if import would exceed limit
    if (currentUsers + data.length > maxUsers) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(400).json({
        status: 'error',
        message: `Import would exceed institution user limit. Current: ${currentUsers}, Limit: ${maxUsers}, Attempting to import: ${data.length}`,
      });
      return;
    }

    // Create import log
    const logResult = await pool.query(
      `INSERT INTO bulk_import_logs
      (institution_id, imported_by, file_name, total_rows, status)
      VALUES ($1, $2, $3, $4, 'processing')
      RETURNING id`,
      [institutionId, req.user!.id, req.file.originalname, data.length]
    );

    const logId = logResult.rows[0].id;

    // Process each row
    const errors: BulkImportError[] = [];
    let successCount = 0;

    // OPTIMIZATION: Batch check for existing emails (prevents N+1 query problem)
    const emailsToCheck = data
      .filter(row => row.email)
      .map(row => row.email.toLowerCase());

    const existingEmailsResult = await pool.query(
      'SELECT email FROM users WHERE LOWER(email) = ANY($1)',
      [emailsToCheck]
    );

    const existingEmails = new Set(
      existingEmailsResult.rows.map((r: any) => r.email.toLowerCase())
    );

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and row 1 is header

      try {
        // Validate required fields
        if (!row.email || !row.name || !row.password) {
          errors.push({
            row: rowNumber,
            email: row.email,
            error: 'Missing required fields (email, name, or password)',
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            row: rowNumber,
            email: row.email,
            error: 'Invalid email format',
          });
          continue;
        }

        // Check if email already exists (using pre-fetched set)
        if (existingEmails.has(row.email.toLowerCase())) {
          errors.push({
            row: rowNumber,
            email: row.email,
            error: 'Email already exists',
          });
          continue;
        }

        // Validate password length
        if (row.password.length < 6) {
          errors.push({
            row: rowNumber,
            email: row.email,
            error: 'Password must be at least 6 characters',
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(row.password, 10);

        // Insert customer
        await pool.query(
          `INSERT INTO users
          (email, password, name, phone, gender, blood_type, country, city, nickname, role, institution_id, managed_by_admin_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'user', $10, $11, true)`,
          [
            row.email,
            hashedPassword,
            row.name,
            row.phone || null,
            row.gender || null,
            row.blood_type || null,
            row.country || null,
            row.city || null,
            row.nickname || null,
            institutionId,
            req.user!.id,
          ]
        );

        successCount++;

        // Optionally send welcome email (commented out to avoid spam during bulk import)
        // You can uncomment this if needed
        /*
        try {
          await sendEmail({
            to: row.email,
            subject: 'Welcome to Saintara',
            text: `Hello ${row.name},\n\nWelcome to Saintara! Your account has been created.\n\nBest regards,\nSaintara Team`,
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        */
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          row: rowNumber,
          email: row.email,
          error: errorMessage,
        });
      }
    }

    // Update import log
    await pool.query(
      `UPDATE bulk_import_logs
      SET successful_rows = $1, failed_rows = $2, errors = $3, status = 'completed'
      WHERE id = $4`,
      [successCount, errors.length, JSON.stringify(errors), logId]
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const result: BulkImportResult = {
      total_rows: data.length,
      successful_rows: successCount,
      failed_rows: errors.length,
      errors,
      log_id: logId,
    };

    res.json({
      status: 'success',
      data: result,
      message: `Import completed: ${successCount} successful, ${errors.length} failed`,
    });
  } catch (error) {
    console.error('Error bulk importing customers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to import customers';

    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};

/**
 * Get bulk import history
 */
export const getImportHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get institution ID
    const institutionId =
      req.user!.role === 'superadmin'
        ? req.query.institution_id
        : req.user!.institution_id;

    if (!institutionId) {
      res.status(400).json({
        status: 'error',
        message: 'Institution ID required',
      });
      return;
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM bulk_import_logs WHERE institution_id = $1',
      [institutionId]
    );

    const totalLogs = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT
        bil.*,
        u.name as imported_by_name,
        u.email as imported_by_email
      FROM bulk_import_logs bil
      LEFT JOIN users u ON u.id = bil.imported_by
      WHERE bil.institution_id = $1
      ORDER BY bil.imported_at DESC
      LIMIT $2 OFFSET $3`,
      [institutionId, limit, offset]
    );

    res.json({
      status: 'success',
      data: {
        imports: result.rows,
        pagination: {
          total: totalLogs,
          page,
          limit,
          total_pages: Math.ceil(totalLogs / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error getting import history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get import history';
    res.status(500).json({
      status: 'error',
      message: errorMessage,
    });
  }
};
