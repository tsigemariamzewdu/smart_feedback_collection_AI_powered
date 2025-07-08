const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');

async function updateChefs() {
  // TODO: Set your MongoDB connection string and chef's email
  const MONGO_URI = 'mongodb://localhost:27017/YOUR_DB_NAME';
  const CHEF_EMAIL = 'chef@example.com'; // Change this to your chef's email

  await mongoose.connect(MONGO_URI);

  // Find the chef user
  const chef = await User.findOne({ role: 'chef', email: CHEF_EMAIL });

  if (!chef) {
    console.log('Chef not found!');
    mongoose.disconnect();
    return;
  }

  // Update all menu items to set the chef
  const result = await MenuItem.updateMany({}, { chef: chef._id });

  console.log(`All menu items updated with chef: ${chef._id}`);
  console.log('MongoDB update result:', result);
  mongoose.disconnect();
}

updateChefs(); 