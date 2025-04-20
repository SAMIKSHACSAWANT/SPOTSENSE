const mongoose = require('mongoose');

/**
 * Booking Schema
 * Represents parking reservations made by users for specific vehicles at parking locations
 */
const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  parking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true
  },
  parkingSpace: {
    spaceId: String,
    floor: Number,
    section: String,
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show', 'refunded'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'cash', 'wallet', 'subscription'],
      required: function() {
        return this.payment.status === 'paid';
      }
    },
    transactionId: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    breakdown: {
      baseRate: Number,
      discounts: Number,
      taxes: Number,
      serviceFee: Number
    },
    refundAmount: Number,
    refundReason: String,
    refundDate: Date,
    receipt: String
  },
  appliedDiscount: {
    code: String,
    amount: Number,
    percentage: Number,
    description: String
  },
  checkIn: {
    time: Date,
    method: {
      type: String,
      enum: ['qr_code', 'license_plate', 'manual', 'automatic'],
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  checkOut: {
    time: Date,
    method: {
      type: String,
      enum: ['qr_code', 'license_plate', 'manual', 'automatic'],
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    extendedTime: Number, // in minutes
    additionalCharges: Number
  },
  extensions: [{
    requestTime: {
      type: Date,
      default: Date.now
    },
    additionalTime: Number, // in minutes
    originalEndTime: Date,
    newEndTime: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    additionalAmount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paymentTransactionId: String
  }],
  cancellation: {
    time: Date,
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundEligible: Boolean,
    refundAmount: Number,
    refundProcessed: Boolean,
    refundTransactionId: String
  },
  pricing: {
    rateType: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'special'],
      default: 'hourly'
    },
    rate: Number,
    total: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  additionalServices: [{
    service: {
      type: String,
      enum: ['car_wash', 'valet', 'charging', 'maintenance', 'detailing']
    },
    price: Number,
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'completed', 'cancelled'],
      default: 'requested'
    },
    notes: String
  }],
  specialRequests: String,
  invoiceId: String,
  ratings: {
    parkingRating: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      date: Date
    }
  },
  notifications: [{
    type: {
      type: String,
      enum: ['confirmation', 'reminder', 'check_in', 'check_out', 'extension', 'cancellation', 'payment'],
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    content: String
  }],
  source: {
    type: String,
    enum: ['app', 'web', 'kiosk', 'phone', 'walk_in', 'third_party'],
    default: 'app'
  },
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  qrCode: String,
  accessCode: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    daysOfWeek: [Number], // 0-6 for Sunday-Saturday
    endDate: Date,
    instances: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
bookingSchema.index({ bookingNumber: 1 }, { unique: true });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ parking: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ vehicle: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate duration if not set
  if (!this.duration && this.startTime && this.endTime) {
    const durationMs = this.endTime.getTime() - this.startTime.getTime();
    this.duration = Math.ceil(durationMs / (60 * 1000)); // duration in minutes
  }
  
  // Generate booking number if new
  if (this.isNew && !this.bookingNumber) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingNumber = `BK${timestamp}${random}`;
  }
  
  next();
});

// Post-save middleware
bookingSchema.post('save', async function() {
  try {
    // Update parking capacity and statistics
    if (this.status === 'confirmed' || this.status === 'active') {
      const Parking = mongoose.model('Parking');
      const parking = await Parking.findById(this.parking);
      if (parking) {
        await parking.updateCapacity();
      }
    }
    
    // Update vehicle statistics
    if (this.status === 'completed') {
      const Vehicle = mongoose.model('Vehicle');
      const vehicle = await Vehicle.findById(this.vehicle);
      if (vehicle) {
        await vehicle.updateStatistics(this);
      }
      
      // Update parking statistics
      const Parking = mongoose.model('Parking');
      const parking = await Parking.findById(this.parking);
      if (parking) {
        await parking.updateStatistics(this);
      }
    }
  } catch (error) {
    console.error('Error in post-save middleware:', error);
  }
});

// Methods

// Cancel booking
bookingSchema.methods.cancel = async function(userId, reason) {
  // Check if booking can be cancelled
  if (['completed', 'cancelled', 'no_show', 'refunded'].includes(this.status)) {
    throw new Error(`Booking cannot be cancelled as it is ${this.status}`);
  }
  
  this.status = 'cancelled';
  this.cancellation = {
    time: new Date(),
    reason: reason,
    cancelledBy: userId
  };
  
  // Determine refund eligibility
  const currentTime = new Date();
  const hoursUntilStart = (this.startTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
  
  // Example refund policy: Full refund if cancelled 24+ hours in advance
  if (hoursUntilStart >= 24) {
    this.cancellation.refundEligible = true;
    this.cancellation.refundAmount = this.payment.amount;
  } 
  // Partial refund if cancelled between 12-24 hours
  else if (hoursUntilStart >= 12) {
    this.cancellation.refundEligible = true;
    this.cancellation.refundAmount = this.payment.amount * 0.75;
  }
  // Partial refund if cancelled between 6-12 hours
  else if (hoursUntilStart >= 6) {
    this.cancellation.refundEligible = true;
    this.cancellation.refundAmount = this.payment.amount * 0.50;
  }
  // No refund if cancelled less than 6 hours before
  else {
    this.cancellation.refundEligible = false;
    this.cancellation.refundAmount = 0;
  }
  
  // Update payment status
  if (this.cancellation.refundEligible && this.cancellation.refundAmount > 0) {
    this.payment.status = 'refunded';
    this.payment.refundAmount = this.cancellation.refundAmount;
    this.payment.refundReason = reason;
    this.payment.refundDate = new Date();
  }
  
  // Update parking capacity after cancellation
  const saved = await this.save();
  
  // Update parking capacity
  try {
    const Parking = mongoose.model('Parking');
    const parking = await Parking.findById(this.parking);
    if (parking) {
      await parking.updateCapacity();
    }
  } catch (error) {
    console.error('Error updating parking capacity after cancellation:', error);
  }
  
  return saved;
};

// Check in
bookingSchema.methods.checkInUser = function(method, notes = '', verifiedBy = null) {
  if (this.status !== 'confirmed') {
    throw new Error(`Cannot check in booking with status: ${this.status}`);
  }
  
  this.status = 'active';
  this.checkIn = {
    time: new Date(),
    method,
    notes,
    verifiedBy
  };
  
  return this.save();
};

// Check out
bookingSchema.methods.checkOutUser = function(method, notes = '', verifiedBy = null, additionalCharges = 0) {
  if (this.status !== 'active') {
    throw new Error(`Cannot check out booking with status: ${this.status}`);
  }
  
  const currentTime = new Date();
  let extendedTime = 0;
  
  // Check if user is checking out late
  if (currentTime > this.endTime) {
    extendedTime = Math.ceil((currentTime.getTime() - this.endTime.getTime()) / (60 * 1000)); // in minutes
  }
  
  this.status = 'completed';
  this.checkOut = {
    time: currentTime,
    method,
    notes,
    verifiedBy,
    extendedTime,
    additionalCharges
  };
  
  // Update payment if there are additional charges
  if (additionalCharges > 0) {
    this.payment.amount += additionalCharges;
  }
  
  return this.save();
};

// Request extension
bookingSchema.methods.requestExtension = async function(additionalTime, paymentMethod = null, paymentTransactionId = null) {
  if (!['confirmed', 'active'].includes(this.status)) {
    throw new Error(`Cannot extend booking with status: ${this.status}`);
  }
  
  // Calculate price for extension
  const hourlyRate = this.pricing.rate;
  const additionalHours = additionalTime / 60; // Convert minutes to hours
  const additionalAmount = hourlyRate * additionalHours;
  
  const originalEndTime = new Date(this.endTime);
  const newEndTime = new Date(originalEndTime.getTime() + (additionalTime * 60 * 1000));
  
  const extension = {
    requestTime: new Date(),
    additionalTime,
    originalEndTime,
    newEndTime,
    status: 'pending',
    additionalAmount,
    paymentStatus: paymentMethod ? 'paid' : 'pending',
    paymentTransactionId
  };
  
  // Check availability for the extended time
  const Parking = mongoose.model('Parking');
  const Booking = mongoose.model('Booking');
  
  // Find overlapping bookings for the same space
  const overlappingBookings = await Booking.countDocuments({
    _id: { $ne: this._id },
    parking: this.parking,
    status: { $in: ['confirmed', 'active'] },
    parkingSpace: { spaceId: this.parkingSpace.spaceId },
    $or: [
      { startTime: { $lt: newEndTime }, endTime: { $gt: originalEndTime } }
    ]
  });
  
  if (overlappingBookings > 0) {
    extension.status = 'rejected';
    this.extensions.push(extension);
    await this.save();
    throw new Error('Extension not available due to overlapping bookings');
  }
  
  // If payment is provided, approve immediately
  if (paymentMethod) {
    extension.status = 'approved';
    this.endTime = newEndTime;
    this.duration += additionalTime;
    
    // Update payment info
    this.payment.amount += additionalAmount;
  }
  
  this.extensions.push(extension);
  return this.save();
};

// Approve extension
bookingSchema.methods.approveExtension = function(extensionIndex, paymentTransactionId = null) {
  if (!this.extensions[extensionIndex]) {
    throw new Error('Extension not found');
  }
  
  const extension = this.extensions[extensionIndex];
  
  if (extension.status !== 'pending') {
    throw new Error(`Cannot approve extension with status: ${extension.status}`);
  }
  
  extension.status = 'approved';
  
  if (paymentTransactionId) {
    extension.paymentStatus = 'paid';
    extension.paymentTransactionId = paymentTransactionId;
  }
  
  // Update booking end time and duration
  this.endTime = extension.newEndTime;
  this.duration += extension.additionalTime;
  
  // Update payment amount
  this.payment.amount += extension.additionalAmount;
  
  return this.save();
};

// Add rating
bookingSchema.methods.addRating = async function(score, comment) {
  if (this.status !== 'completed') {
    throw new Error('Can only rate completed bookings');
  }
  
  this.ratings.parkingRating = {
    score,
    comment,
    date: new Date()
  };
  
  const saved = await this.save();
  
  // Update parking rating
  try {
    const Parking = mongoose.model('Parking');
    const parking = await Parking.findById(this.parking);
    if (parking) {
      await parking.addReview(this.user, score, comment);
    }
  } catch (error) {
    console.error('Error updating parking rating:', error);
  }
  
  return saved;
};

// Send notification
bookingSchema.methods.sendNotification = function(type, channel, content) {
  this.notifications.push({
    type,
    sent: true,
    sentAt: new Date(),
    channel,
    content
  });
  
  return this.save();
};

// Generate QR code
bookingSchema.methods.generateQRCode = function() {
  // This would typically call a QR code generation service
  // For simplicity, just setting a placeholder
  this.qrCode = `https://parking-app.com/bookings/${this.bookingNumber}/qr`;
  return this.save();
};

// Generate access code
bookingSchema.methods.generateAccessCode = function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let accessCode = '';
  
  for (let i = 0; i < 6; i++) {
    accessCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  this.accessCode = accessCode;
  return this.save();
};

// Create recurring bookings
bookingSchema.methods.createRecurringInstances = async function() {
  if (!this.isRecurring || !this.recurringDetails) {
    throw new Error('Booking is not marked as recurring');
  }
  
  const { frequency, daysOfWeek, endDate } = this.recurringDetails;
  const startDate = new Date(this.startTime);
  const bookingDuration = this.endTime - this.startTime; // Duration in milliseconds
  
  const instances = [];
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from next day
  
  const Booking = mongoose.model('Booking');
  
  while (currentDate <= endDate) {
    let shouldCreateBooking = false;
    
    // Check if the current date matches the frequency pattern
    if (frequency === 'daily') {
      shouldCreateBooking = true;
    } else if (frequency === 'weekly' && daysOfWeek.includes(currentDate.getDay())) {
      shouldCreateBooking = true;
    } else if (frequency === 'monthly' && currentDate.getDate() === startDate.getDate()) {
      shouldCreateBooking = true;
    }
    
    if (shouldCreateBooking) {
      // Create the new booking instance
      const newStartTime = new Date(currentDate);
      newStartTime.setHours(startDate.getHours(), startDate.getMinutes());
      
      const newEndTime = new Date(newStartTime.getTime() + bookingDuration);
      
      const newBookingData = {
        user: this.user,
        vehicle: this.vehicle,
        parking: this.parking,
        parkingSpace: this.parkingSpace,
        startTime: newStartTime,
        endTime: newEndTime,
        duration: this.duration,
        status: 'confirmed',
        payment: {
          ...this.payment,
          status: 'pending' // Each instance needs to be paid separately
        },
        pricing: this.pricing,
        source: this.source,
        specialRequests: this.specialRequests
      };
      
      try {
        const newBooking = new Booking(newBookingData);
        await newBooking.save();
        instances.push(newBooking._id);
      } catch (error) {
        console.error('Error creating recurring booking instance:', error);
      }
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Update recurringDetails with the created instances
  this.recurringDetails.instances = instances;
  return this.save();
};

// Static methods

// Find active bookings for a vehicle
bookingSchema.statics.findActiveForVehicle = function(vehicleId) {
  return this.find({
    vehicle: vehicleId,
    status: { $in: ['confirmed', 'active'] },
    endTime: { $gte: new Date() }
  }).sort({ startTime: 1 });
};

// Find active bookings for a parking space
bookingSchema.statics.findActiveForParkingSpace = function(parkingId, spaceId) {
  return this.find({
    parking: parkingId,
    'parkingSpace.spaceId': spaceId,
    status: { $in: ['confirmed', 'active'] },
    endTime: { $gte: new Date() }
  }).sort({ startTime: 1 });
};

// Find upcoming bookings for a user
bookingSchema.statics.findUpcomingForUser = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: { $in: ['confirmed', 'active'] },
    startTime: { $gte: new Date() }
  }).sort({ startTime: 1 }).limit(limit);
};

// Find current active booking for a user
bookingSchema.statics.findCurrentForUser = function(userId) {
  const now = new Date();
  return this.findOne({
    user: userId,
    status: 'active',
    startTime: { $lte: now },
    endTime: { $gte: now }
  });
};

// Check availability for a parking space
bookingSchema.statics.checkAvailability = async function(parkingId, startTime, endTime, excludeBookingId = null) {
  const query = {
    parking: parkingId,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const bookingsCount = await this.countDocuments(query);
  
  const Parking = mongoose.model('Parking');
  const parking = await Parking.findById(parkingId);
  
  if (!parking) {
    throw new Error('Parking not found');
  }
  
  return {
    isAvailable: bookingsCount < parking.capacity.total,
    availableSpaces: Math.max(0, parking.capacity.total - bookingsCount),
    totalSpaces: parking.capacity.total
  };
};

// Export model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 