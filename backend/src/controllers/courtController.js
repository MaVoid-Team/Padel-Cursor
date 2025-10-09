const { Court, Booking } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all courts (with optional active filter)
 */
exports.getAllCourts = async (req, res) => {
  try {
    const { active_only } = req.query;
    
    const whereClause = {};
    if (active_only === 'true') {
      whereClause.is_active = true;
    }

    const courts = await Court.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    res.json({ success: true, courts });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
};

/**
 * Get single court by ID
 */
exports.getCourtById = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    res.json({ success: true, court });
  } catch (error) {
    console.error('Error fetching court:', error);
    res.status(500).json({ error: 'Failed to fetch court' });
  }
};

/**
 * Create new court (admin only)
 */
exports.createCourt = async (req, res) => {
  try {
    const {
      name,
      description,
      hourly_price_member,
      hourly_price_non_member,
      operating_hours,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !hourly_price_member || !hourly_price_non_member) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, hourly_price_member, hourly_price_non_member' 
      });
    }

    // Validate pricing
    if (parseFloat(hourly_price_member) < 0 || parseFloat(hourly_price_non_member) < 0) {
      return res.status(400).json({ error: 'Prices cannot be negative' });
    }

    // Check if court name already exists
    const existingCourt = await Court.findOne({ where: { name } });
    if (existingCourt) {
      return res.status(409).json({ error: 'Court with this name already exists' });
    }

    const court = await Court.create({
      name,
      description,
      hourly_price_member,
      hourly_price_non_member,
      operating_hours,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Court created successfully',
      court 
    });
  } catch (error) {
    console.error('Error creating court:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Court with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create court' });
  }
};

/**
 * Update court (admin only)
 */
exports.updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      hourly_price_member,
      hourly_price_non_member,
      operating_hours,
      is_active
    } = req.body;

    const court = await Court.findByPk(id);

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Check if new name conflicts with existing court
    if (name && name !== court.name) {
      const existingCourt = await Court.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        } 
      });
      if (existingCourt) {
        return res.status(409).json({ error: 'Court with this name already exists' });
      }
    }

    // Validate pricing if provided
    if (hourly_price_member !== undefined && parseFloat(hourly_price_member) < 0) {
      return res.status(400).json({ error: 'Member price cannot be negative' });
    }
    if (hourly_price_non_member !== undefined && parseFloat(hourly_price_non_member) < 0) {
      return res.status(400).json({ error: 'Non-member price cannot be negative' });
    }

    // Update fields
    if (name !== undefined) court.name = name;
    if (description !== undefined) court.description = description;
    if (hourly_price_member !== undefined) court.hourly_price_member = hourly_price_member;
    if (hourly_price_non_member !== undefined) court.hourly_price_non_member = hourly_price_non_member;
    if (operating_hours !== undefined) court.operating_hours = operating_hours;
    if (is_active !== undefined) court.is_active = is_active;

    await court.save();

    res.json({ 
      success: true, 
      message: 'Court updated successfully',
      court 
    });
  } catch (error) {
    console.error('Error updating court:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Failed to update court' });
  }
};

/**
 * Delete court (admin only)
 * Note: This will cascade delete all bookings for this court
 */
exports.deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    // Check if there are future bookings
    const today = new Date().toISOString().split('T')[0];
    const futureBookingsCount = await Booking.count({
      where: {
        court_id: id,
        date: { [Op.gte]: today },
        status: { [Op.in]: ['confirmed', 'pending'] }
      }
    });

    if (futureBookingsCount > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete court with future bookings',
        future_bookings: futureBookingsCount,
        suggestion: 'Consider deactivating the court instead'
      });
    }

    const courtInfo = {
      id: court.id,
      name: court.name
    };

    await court.destroy();

    res.json({ 
      success: true, 
      message: 'Court deleted successfully',
      deleted: courtInfo
    });
  } catch (error) {
    console.error('Error deleting court:', error);
    res.status(500).json({ error: 'Failed to delete court' });
  }
};

/**
 * Toggle court active status (admin only)
 */
exports.toggleCourtStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    court.is_active = !court.is_active;
    await court.save();

    res.json({ 
      success: true, 
      message: `Court ${court.is_active ? 'activated' : 'deactivated'} successfully`,
      court 
    });
  } catch (error) {
    console.error('Error toggling court status:', error);
    res.status(500).json({ error: 'Failed to toggle court status' });
  }
};

/**
 * Get court availability for a specific date
 */
exports.getCourtAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const court = await Court.findByPk(id);

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    if (!court.is_active) {
      return res.status(400).json({ error: 'Court is not active' });
    }

    // Get all bookings for this court on this date
    const bookings = await Booking.findAll({
      where: {
        court_id: id,
        date: date,
        status: { [Op.in]: ['confirmed', 'pending'] }
      },
      attributes: ['time', 'duration'],
      order: [['time', 'ASC']]
    });

    res.json({ 
      success: true, 
      court: {
        id: court.id,
        name: court.name
      },
      date,
      bookings,
      operating_hours: court.operating_hours
    });
  } catch (error) {
    console.error('Error fetching court availability:', error);
    res.status(500).json({ error: 'Failed to fetch court availability' });
  }
};
