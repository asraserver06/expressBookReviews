const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

// ─── In-memory user store ─────────────────────────────────────────────────────
let users = [];

// ─── Part C: Check if username is valid (not already taken) ──────────────────
const isValid = (username) => {
  // Returns true if username does NOT already exist
  const userExists = users.some(user => user.username === username);
  return !userExists;
};

// ─── Part C: Authenticate username and password ───────────────────────────────
const authenticatedUser = (username, password) => {
  // Find the user with matching username AND password
  const validUser = users.find(user =>
    user.username === username && user.password === password
  );
  return validUser !== undefined;
};

// ─── Part C: POST /customer/login ─────────────────────────────────────────────
// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Check credentials
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  // Generate JWT token signed with secret "access"
  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });

  // Save token in session
  req.session.authorization = { accessToken };

  return res.status(200).json({
    message: `User '${username}' logged in successfully.`,
    token: accessToken
  });
});

// ─── Part D: PUT /customer/auth/review/:isbn ──────────────────────────────────
// Add or modify a book review (authenticated users only)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query; // review text passed as ?review=...
  const username = req.user.username; // set by JWT middleware in index.js

  // Check book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  if (!review) {
    return res.status(400).json({ message: "Review text is required as a query param: ?review=your+review" });
  }

  const isUpdate = !!books[isbn].reviews[username];
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: isUpdate
      ? `Review for ISBN ${isbn} updated successfully by '${username}'.`
      : `Review for ISBN ${isbn} added successfully by '${username}'.`,
    isbn,
    username,
    review
  });
});

// ─── Part D: DELETE /customer/auth/review/:isbn ───────────────────────────────
// Delete a user's own review (authenticated users only)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({
      message: `No review found from '${username}' for ISBN ${isbn}.`
    });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review by '${username}' for ISBN ${isbn} deleted successfully.`
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
