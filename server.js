const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Environment Variables
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
if (!MONGODB_PASSWORD) {
  console.error('MONGODB_PASSWORD environment variable is not set');
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// MongoDB Connection
const MONGO_URI = `mongodb+srv://jporrase:${MONGODB_PASSWORD}@cluster0.kbggqin.mongodb.net/farmDatabase?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .ca
// Schemas
const DataSchema = new mongoose.Schema({
  finca: { type: String, required: true },
  owner: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
});
// Add this after DataSchema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  finca: String,
  owner: String,
  phone: String,
  schema: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Models
const Data = mongoose.model('Data', DataSchema);
const User = mongoose.model('User', UserSchema);
//const Form = mongoose.model('Form', FormSchema);


// Modify the FormSchema to handle dynamic values
const FormSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  formType: { type: String, required: true }, // e.g., 'fitosanitarios', 'comite', etc.
  values: { type: Map, of: mongoose.Schema.Types.Mixed }, // Stores dynamic form values
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add routes for managing forms
app.post('/api/users/:userId/forms', async (req, res) => {
  try {
    const { userId } = req.params;
    const { formType, values } = req.body;

    const form = new Form({
      userId,
      formType,
      values,
      updatedAt: new Date()
    });

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Error creating form' });
  }
});

// Update form values
app.put('/api/users/:userId/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { values } = req.body;

    const form = await Form.findByIdAndUpdate(
      formId,
      {
        $set: { values },
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Error updating form' });
  }
});

// Delete all users
app.delete('/api/users', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users.`);
    res.status(200).json({ message: `Successfully deleted ${result.deletedCount} users.` });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Failed to delete users. Please try again.' });
  }
});


// Save data
app.post('/api/data', async (req, res) => {
  try {
    const { finca, owner, phone, email } = req.body;

    if (!finca || !owner || !email) {
      return res.status(400).send('Finca, owner, and email are required.');
    }

    const newData = new Data({ finca, owner, phone, email });
    await newData.save();
    res.send({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data.');
  }
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const data = await Data.find();
    res.send(data);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Error retrieving data.');
  }
});

// User signup
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: 'User signed up successfully!' });
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Failed to sign up user. Please try again.' });
  }
});

// Get user schema
app.get('/api/users/:email/schema', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.schema || {});
  } catch (error) {
    res.status(500).json({ error: 'Error fetching schema' });
  }
});

// Update user schema
app.put('/api/users/:email/schema', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If schema doesn't exist, create it
    if (!user.schema) {
      user.schema = {};
    }

    // Update the schema with new values
    user.schema = { ...user.schema, ...req.body };
    await user.save();

    res.json({ message: 'Schema updated successfully', schema: user.schema });
  } catch (error) {
    res.status(500).json({ error: 'Error updating schema' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).send('Error retrieving users.');
  }
});

// At the bottom of your file, replace the existing listen code with:
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';  // Important for DigitalOcean App Platform

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});