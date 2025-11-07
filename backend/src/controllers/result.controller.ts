import { Response } from 'express'
import pool from '../config/database'
import { AuthRequest } from '../middleware/auth.middleware'
import PDFDocument from 'pdfkit'
import logger from '../config/logger'

// Get all user results
export const getUserResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.created_at,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description,
        tr.strengths,
        tr.challenges,
        tr.career_recommendations,
        t.test_type
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC`,
      [userId]
    )

    res.status(200).json({
      status: 'success',
      data: {
        results: result.rows,
      },
    })
  } catch (error) {
    logger.error('Get results error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch results',
    })
  }
}

// Get specific result details
export const getResultById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.*,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description as character_description,
        ct.communication_style,
        t.test_type,
        t.completed_at,
        u.name as user_name,
        u.email as user_email
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      JOIN users u ON tr.user_id = u.id
      WHERE tr.id = $1 AND tr.user_id = $2`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Result not found',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        result: result.rows[0],
      },
    })
  } catch (error) {
    logger.error('Get result error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch result',
    })
  }
}

// Get latest result for dashboard
export const getLatestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.id,
        tr.created_at,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description,
        tr.strengths,
        tr.challenges,
        tr.career_recommendations,
        ct.communication_style,
        t.test_type
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.user_id = $1
      ORDER BY tr.created_at DESC
      LIMIT 1`,
      [userId]
    )

    if (result.rows.length === 0) {
      res.status(200).json({
        status: 'success',
        data: {
          result: null,
        },
      })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        result: result.rows[0],
      },
    })
  } catch (error) {
    logger.error('Get latest result error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch latest result',
    })
  }
}

// Download result as PDF certificate
export const downloadResultPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  try {
    const result = await pool.query(
      `SELECT
        tr.*,
        ct.name as character_type_name,
        ct.code as character_type_code,
        ct.description as character_description,
        u.name as user_name,
        u.email as user_email,
        t.completed_at
      FROM test_results tr
      JOIN character_types ct ON tr.character_type_id = ct.id
      JOIN tests t ON tr.test_id = t.id
      JOIN users u ON tr.user_id = u.id
      WHERE tr.id = $1 AND tr.user_id = $2`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Result not found',
      })
      return
    }

    const data = result.rows[0]

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=saintara-certificate-${id}.pdf`)

    // Pipe PDF to response
    doc.pipe(res)

    // Add content to PDF
    doc
      .fontSize(25)
      .fillColor('#FEC53D')
      .text('SAINTARA', { align: 'center' })
      .moveDown(0.5)

    doc
      .fontSize(20)
      .fillColor('#000000')
      .text('Personality Assessment Certificate', { align: 'center' })
      .moveDown(2)

    doc
      .fontSize(14)
      .text('This certifies that', { align: 'center' })
      .moveDown(0.5)

    doc
      .fontSize(20)
      .fillColor('#FEC53D')
      .text(data.user_name, { align: 'center' })
      .moveDown(0.5)

    doc
      .fontSize(14)
      .fillColor('#000000')
      .text('has completed the Saintara Personality Assessment', { align: 'center' })
      .moveDown(2)

    doc
      .fontSize(16)
      .fillColor('#FEC53D')
      .text('Character Type:', { continued: true })
      .fillColor('#000000')
      .text(` ${data.character_type_name}`, { align: 'left' })
      .moveDown(0.5)

    doc
      .fontSize(12)
      .text(data.character_description, { align: 'justify' })
      .moveDown(1.5)

    doc
      .fontSize(14)
      .fillColor('#FEC53D')
      .text('Key Strengths:')
      .moveDown(0.5)

    doc.fontSize(11).fillColor('#000000')
    if (data.strengths && data.strengths.length > 0) {
      data.strengths.forEach((strength: string) => {
        doc.text(`• ${strength}`, { indent: 20 })
      })
    }
    doc.moveDown(1.5)

    doc
      .fontSize(14)
      .fillColor('#FEC53D')
      .text('Development Areas:')
      .moveDown(0.5)

    doc.fontSize(11).fillColor('#000000')
    if (data.challenges && data.challenges.length > 0) {
      data.challenges.forEach((challenge: string) => {
        doc.text(`• ${challenge}`, { indent: 20 })
      })
    }
    doc.moveDown(1.5)

    doc
      .fontSize(14)
      .fillColor('#FEC53D')
      .text('Career Recommendations:')
      .moveDown(0.5)

    doc.fontSize(11).fillColor('#000000')
    if (data.career_recommendations && data.career_recommendations.length > 0) {
      data.career_recommendations.forEach((career: string) => {
        doc.text(`• ${career}`, { indent: 20 })
      })
    }

    doc.moveDown(3)

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        `Date Issued: ${new Date(data.completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        { align: 'center' }
      )
      .moveDown(0.5)
      .text(`Certificate ID: ${id}`, { align: 'center' })

    // Finalize PDF
    doc.end()
  } catch (error) {
    logger.error('Download PDF error:', error)
    // If PDF generation fails, send JSON error response
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate PDF',
      })
    }
  }
}
