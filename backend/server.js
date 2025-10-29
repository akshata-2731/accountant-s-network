const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();

const client = new OAuth2Client('846999197799-pjlguh7e86r56lhdnlddvie7m4ao9fpq.apps.googleusercontent.com');
const fs = require('fs');
// Update with your actual MySQL credentials:
const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  user: '47J2prvPoFhpbTN.root', // your MySQL username
  password: 'dZl53tw8f22fO0Wx', // your MySQL password
  database: 'reffral_db',
  port: 4000,
  ssl: {
    ca: fs.readFileSync('C:/Users/hp/Downloads/isrgrootx1.pem')
  }
};

const PORT = process.env.PORT || 4000;

// CORS middleware with explicit origin
const corsOptions = {
  origin: 'https://accountant-s-network-1.onrender.com',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set Cross-Origin-Opener-Policy header to avoid postMessage block
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// POST /login/google for Google Sign-In
app.post('/login/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: '846999197799-pjlguh7e86r56lhdnlddvie7m4ao9fpq.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();

    // Allow any email to login for now, bypass DB checks
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: 'user',
    };

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

app.get('/admin/data', async (req, res) => {
  try {
    const conn = await getConnection();
    const [referrals] = await conn.execute('SELECT * FROM referrals ORDER BY dateSubmitted DESC');
    const totalReferrals = referrals.length;
    const paidCount = referrals.filter(r => r.status === 'Paid').length;
    const pendingCommission = referrals.filter(r => r.status !== 'Paid').reduce((sum, r) => sum + parseFloat(r.expectedCommission), 0);
    const conversionRate = totalReferrals ? Math.round((paidCount / totalReferrals) * 100) : 0;
    await conn.end();
    res.json({ referrals, stats: { totalReferrals, pendingCommission, conversionRate } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch admin data' });
  }
});


app.get('/user/data', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const conn = await getConnection();
    console.log('Fetching data for user:', userId);

    const [referrals] = await conn.execute('SELECT * FROM referrals ORDER BY dateSubmitted DESC');
    const [walletRows] = await conn.execute('SELECT * FROM commission_wallet WHERE userId = ?', [userId]);
    const [payouts] = await conn.execute('SELECT * FROM payouts WHERE userId = ?', [userId]);

    console.log({ referralsCount: referrals.length, walletRows, payoutsCount: payouts.length });

    await conn.end();
    res.json({ referrals, wallet: walletRows[0] || null, payouts });
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data', details: error.message });
  }
});


// POST /referral/submit to submit a new referral
app.post('/referral/submit', async (req, res) => {
  const { clientName, mobile, expectedCommission } = req.body;

  if (!clientName || !mobile || !expectedCommission) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const conn = await getConnection();

    await conn.execute(
      'INSERT INTO referrals (clientName, mobile, expectedCommission, status, dateSubmitted) VALUES (?, ?, ?, ?, NOW())',
      [clientName, mobile, expectedCommission, 'Pending']
    );

    await conn.end();
    res.status(200).json({ message: 'Referral submitted successfully' });
  } catch (error) {
    console.error('Failed to submit referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Existing admin/data, referral/status, referral/reminder routes...




app.post('/referral/status', async (req, res) => {
  const { referralId, status } = req.body;
  if (!referralId || !status) {
    return res.status(400).json({ error: 'referralId and status are required' });
  }
  try {
    const conn = await getConnection();
    const [result] = await conn.execute('UPDATE referrals SET status = ? WHERE id = ?', [status, referralId]);
    await conn.end();

    console.log('Referral update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    res.json({ message: 'Status updated' });
  } catch (error) {
    console.error('Failed to update referral:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/referral/reminder', async (req, res) => {
  const { referralId, reminderDate, reminderNote } = req.body;
  if (!referralId) {
    return res.status(400).json({ error: 'referralId is required' });
  }
  try {
    const conn = await getConnection();
    const [result] = await conn.execute('UPDATE referrals SET reminderDate = ?, reminderNote = ? WHERE id = ?', [reminderDate || null, reminderNote || null, referralId]);
    await conn.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    res.json({ message: 'Reminder updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set reminder' });
  }
});

app.post('/user/profile', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE users SET name = ? WHERE email = ?',
      [name, email]
    );
    await conn.end();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully', name, email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
