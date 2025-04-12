// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); // Baru: Tambahkan ini di bagian atas

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trackerdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const linkSchema = new mongoose.Schema({
    originalUrl: String,
    trackingId: String,
    clicks: [{ ip: String, timestamp: Date, location: Object }]
});
const Link = mongoose.model('Link', linkSchema);

// Route untuk buat tracking link
app.post('/create-link', async (req, res) => {
    const { originalUrl } = req.body;
    const trackingId = Date.now().toString(36);

    const newLink = new Link({ originalUrl, trackingId });
    await newLink.save();

    res.json({ trackingUrl: `http://localhost:${PORT}/track/${trackingId}` });
});

// Route untuk track klik
app.get('/track/:id', async (req, res) => {
    const link = await Link.findOne({ trackingId: req.params.id });
    if (link) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Mengambil data lokasi dari IP API
        const locationRes = await axios.get(`http://ip-api.com/json/${ip}`);
        const location = locationRes.data;

        link.clicks.push({ 
            ip, 
            timestamp: new Date(), 
            location 
        });
        await link.save();

        return res.redirect(link.originalUrl);
    }
    res.status(404).send('Link not found');
});
// Tambahkan route baru di bagian bawah sebelum app.listen()
app.get('/dashboard', async (req, res) => {
    const links = await Link.find();
    res.json(links);
});
app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});
