const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const app = express();
const PORT = 3000;
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '**************',
    database: '*****'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Session middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle form submission for user registration
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error('Error inserting data into MySQL database:', err);
            return res.status(500).send('Registration failed');
        }
        console.log('Data inserted successfully');
        return res.status(200).send('Registration successful');
    });
});

// Route to handle form submission for user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error('Error authenticating sign-in:', err);
            return res.status(500).send('Internal server error');
        }
        if (result.length === 0) {
            // User not found or invalid credentials
            return res.status(401).send('Invalid username or password');
        }
        // User authenticated successfully
        // Store username in session
        req.session.username = username;
        return res.redirect('/home.html'); // Redirect to home.html
    });
});

// Route to handle form submission for creating appointments
app.post('/create-appointment', (req, res) => {
    // Check if user is logged in
    if (!req.session.username) {
        return res.status(401).send('Unauthorized');
    }

    // Extract data from the request body
    const { date, time, name, description } = req.body;

    // Retrieve username from session
    const username = req.session.username;

    // Insert appointment into the database
    const sql = 'INSERT INTO appointments (user_id, appointment_date, appointment_time, appointment_name, description) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [username, date, time, name, description], (err, result) => {
        if (err) {
            console.error('Error inserting data into MySQL database:', err);
            return res.status(500).send('Appointment creation failed');
        }
        console.log('Appointment created successfully');
        return res.status(200).send('Appointment created successfully');
    });
});

// Route to serve the homepage
app.get('/home.html', (req, res) => {
    // Check if user is logged in
    if (!req.session.username) {
        // Redirect to login page if not logged in
        return res.redirect('/');
    }
    // Render the homepage
    res.sendFile(__dirname + '/home.html');
});

// Route to handle viewing appointments
app.get('/view', (req, res) => {
    // Check if user is logged in
    if (!req.session.username) {
        // Redirect to login page if not logged in
        return res.redirect('/');
    }

    // Retrieve appointments from the database
    const sql = 'SELECT * FROM appointments WHERE user_id = ?';
    connection.query(sql, [req.session.username], (err, results) => {
        if (err) {
            console.error('Error fetching appointments from the database:', err);
            return res.status(500).send('Error fetching appointments');
        }
        
        // Render the appointments view using EJS
        res.render('view', { appointments: results });
    });
});

// Route to fetch appointments
app.get('/appointments', (req, res) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const sql = 'SELECT * FROM appointments WHERE appointment_date = ?';
    connection.query(sql, [currentDate], (err, results) => {
        if (err) {
            console.error('Error fetching appointments from the database:', err);
            return res.status(500).send('Error fetching appointments');
        }
        res.json(results); // Send fetched appointments as JSON response
    });
});

// Route to handle appointment deletion
app.delete('/appointments/:userId/:date/:time', (req, res) => {
    const userId = req.params.userId;
    const date = req.params.date;
    const time = req.params.time;
    
    const sql = 'DELETE FROM appointments WHERE user_id = ? AND appointment_date = ? AND appointment_time = ?';
    connection.query(sql, [userId, date, time], (err, result) => {
        if (err) {
            console.error('Error deleting appointment:', err);
            return res.status(500).send('Failed to delete appointment');
        }
        console.log('Appointment deleted successfully');
        res.status(200).send('Appointment deleted successfully');
    });
});


app.use(express.static('public'));


// Serve the HTML file for login/register
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
