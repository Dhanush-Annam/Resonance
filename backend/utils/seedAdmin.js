require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    await User.create({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin'
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
