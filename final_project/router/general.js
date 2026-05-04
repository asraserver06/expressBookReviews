const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// ─── Part D: POST /register ───────────────────────────────────────────────────
// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (!isValid(username)) {
    return res.status(409).json({
      message: `Username '${username}' already exists. Please choose another.`
    });
  }

  // Add new user to the users array
  users.push({ username, password });

  return res.status(201).json({
    message: `User '${username}' registered successfully. You can now login.`
  });
});

// ─── Part D & E: GET / ─ Get all books (using async/await) ───────────────────
public_users.get('/', async function (req, res) {
  try {
    // Simulate async data retrieval using a Promise
    const allBooks = await new Promise((resolve, reject) => {
      if (books) {
        resolve(books);
      } else {
        reject(new Error("Books data not available."));
      }
    });

    return res.status(200).json({
      message: "All books retrieved successfully.",
      total: Object.keys(allBooks).length,
      books: allBooks
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ─── Part D & E: GET /isbn/:isbn ─ Get book by ISBN (using Promise) ──────────
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;

  // Using Promise chain
  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject(new Error(`Book with ISBN ${isbn} not found.`));
    }
  })
    .then(book => {
      return res.status(200).json({ isbn, book });
    })
    .catch(err => {
      return res.status(404).json({ message: err.message });
    });
});

// ─── Part D & E: GET /author/:author ─ Get books by author (using Promise) ───
public_users.get('/author/:author', function (req, res) {
  const searchAuthor = req.params.author.toLowerCase();

  // Using Promise chain
  new Promise((resolve, reject) => {
    const matchedBooks = {};
    for (const [isbn, book] of Object.entries(books)) {
      if (book.author.toLowerCase().includes(searchAuthor)) {
        matchedBooks[isbn] = book;
      }
    }
    if (Object.keys(matchedBooks).length > 0) {
      resolve(matchedBooks);
    } else {
      reject(new Error(`No books found for author: ${req.params.author}`));
    }
  })
    .then(matchedBooks => {
      return res.status(200).json({
        message: `Books by '${req.params.author}' retrieved successfully.`,
        books: matchedBooks
      });
    })
    .catch(err => {
      return res.status(404).json({ message: err.message });
    });
});

// ─── Part D & E: GET /title/:title ─ Get books by title (using Promise) ──────
public_users.get('/title/:title', function (req, res) {
  const searchTitle = req.params.title.toLowerCase();

  // Using Promise chain
  new Promise((resolve, reject) => {
    const matchedBooks = {};
    for (const [isbn, book] of Object.entries(books)) {
      if (book.title.toLowerCase().includes(searchTitle)) {
        matchedBooks[isbn] = book;
      }
    }
    if (Object.keys(matchedBooks).length > 0) {
      resolve(matchedBooks);
    } else {
      reject(new Error(`No books found with title: ${req.params.title}`));
    }
  })
    .then(matchedBooks => {
      return res.status(200).json({
        message: `Books with title '${req.params.title}' retrieved successfully.`,
        books: matchedBooks
      });
    })
    .catch(err => {
      return res.status(404).json({ message: err.message });
    });
});

// ─── Part D: GET /review/:isbn ─ Get book reviews ────────────────────────────
public_users.get('/review/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  const reviewCount = Object.keys(book.reviews).length;

  if (reviewCount === 0) {
    return res.status(200).json({ message: "No reviews found for this book." });
  }

  return res.status(200).json({
    isbn,
    title: book.title,
    author: book.author,
    reviewCount,
    reviews: book.reviews
  });
});

module.exports.general = public_users;
