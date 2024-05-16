const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize SQLite database
const dbPath = path.resolve(__dirname, 'books.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create books table
db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    img TEXT,
    summary TEXT
)`, (err) => {
    if (err) {
        console.error('Error creating table', err);
    } else {
        console.log('Books table ready');
        seedDatabase();  
    }
});

// Seed the database with initial data
function seedDatabase() {
    const books = [
        {
            name: "Harry Potter and the Order of the Phoenix",
            img: "https://bit.ly/2IcnSwz",
            summary: "Harry Potter and Dumbledore's warning about the return of Lord Voldemort is not heeded by the wizard authorities who, in turn, look to undermine Dumbledore's authority at Hogwarts and discredit Harry."
        },
        {
            name: "The Lord of the Rings: The Fellowship of the Ring",
            img: "https://bit.ly/2tC1Lcg",
            summary: "A young hobbit, Frodo, who has found the One Ring that belongs to the Dark Lord Sauron, begins his journey with eight companions to Mount Doom, the only place where it can be destroyed."
        },
        {
            name: "Avengers: Endgame",
            img: "https://bit.ly/2Pzczlb",
            summary: "Adrift in space with no food or water, Tony Stark sends a message to Pepper Potts as his oxygen supply starts to dwindle. Meanwhile, the remaining Avengers -- Thor, Black Widow, Captain America, and Bruce Banner -- must figure out a way to bring back their vanquished allies for an epic showdown with Thanos -- the evil demigod who decimated the planet and the universe."
        }
    ];

    db.serialize(() => {
        db.run('DELETE FROM books');
        const stmt = db.prepare('INSERT INTO books (name, img, summary) VALUES (?, ?, ?)');
        books.forEach((book) => {
            stmt.run(book.name, book.img, book.summary);
        });
        stmt.finalize();
        console.log("Database seeded!");
    });
}

// CRUD Routes

// Create a new book
app.post('/books', (req, res) => {
    const { name, img, summary } = req.body;
    const query = `INSERT INTO books (name, img, summary) VALUES (?, ?, ?)`;
    db.run(query, [name, img, summary], function(err) {
        if (err) {
            res.status(400).send(err.message);
        } else {
            res.status(201).send({ id: this.lastID });
        }
    });
});

// Read all books
app.get('/books', (req, res) => {
    const query = `SELECT * FROM books`;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.status(200).send(rows);
        }
    });
});

// Read a book by ID
app.get('/books/:id', (req, res) => {
    const { id } = req.params;
    const query = `SELECT * FROM books WHERE id = ?`;
    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).send(err.message);
        } else if (row) {
            res.status(200).send(row);
        } else {
            res.status(404).send('Book not found');
        }
    });
});

// Update a book by ID (replace the entire book record)
app.put('/books/:id', (req, res) => {
    const { id } = req.params;
    const { name, img, summary } = req.body;
    const query = `UPDATE books SET name = ?, img = ?, summary = ? WHERE id = ?`;
    db.run(query, [name, img, summary, id], function(err) {
        if (err) {
            res.status(400).send(err.message);
        } else if (this.changes === 0) {
            res.status(404).send('Book not found');
        } else {
            res.status(200).send(`Book with ID ${id} updated`);
        }
    });
});

// Delete a book by ID
app.delete('/books/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM books WHERE id = ?`;
    db.run(query, [id], function(err) {
        if (err) {
            res.status(500).send(err.message);
        } else if (this.changes === 0) {
            res.status(404).send('Book not found');
        } else {
            res.status(200).send(`Book with ID ${id} deleted`);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
