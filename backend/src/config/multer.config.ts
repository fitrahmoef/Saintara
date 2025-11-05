/**
 * Multer Configuration for File Uploads
 * Handles file upload middleware for various file types
 */

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Create uploads directories if they don't exist
const baseUploadDir = path.join(__dirname, '../../uploads');
const avatarDir = path.join(baseUploadDir, 'avatars');
const paymentProofDir = path.join(baseUploadDir, 'payment-proofs');
const documentsDir = path.join(baseUploadDir, 'documents');

[baseUploadDir, avatarDir, paymentProofDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generic storage configuration
 */
const createStorage = (destinationPath: string) => {
  return multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      cb(null, destinationPath);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      // Generate unique filename: timestamp-randomstring-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '-') // Sanitize filename
        .substring(0, 50); // Limit length
      cb(null, `${basename}-${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * File filter for Excel and CSV files (bulk imports)
 */
const excelCsvFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
  ];

  const allowedExtensions = ['.xls', '.xlsx', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xls, .xlsx) and CSV files are allowed.'));
  }
};

/**
 * File filter for image files (avatars)
 */
const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.'));
  }
};

/**
 * File filter for payment proofs (images and PDFs)
 */
const paymentProofFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG) and PDF files are allowed.'));
  }
};

/**
 * Multer configuration for bulk customer imports (Excel/CSV)
 */
export const upload = multer({
  storage: createStorage(documentsDir),
  fileFilter: excelCsvFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Multer configuration for avatar uploads
 */
export const uploadAvatar = multer({
  storage: createStorage(avatarDir),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max file size
  },
});

/**
 * Multer configuration for payment proof uploads
 */
export const uploadPaymentProof = multer({
  storage: createStorage(paymentProofDir),
  fileFilter: paymentProofFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Export upload directory paths
export const UPLOAD_DIRS = {
  base: baseUploadDir,
  avatars: avatarDir,
  paymentProofs: paymentProofDir,
  documents: documentsDir,
};
