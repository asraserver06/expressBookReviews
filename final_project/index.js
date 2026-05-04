const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer", session({
  secret: "fingerprint_customer",
  resave: true,
  saveUninitialized: true
}));

// ─── Part C: JWT Authentication Middleware ────────────────────────────────────
// Protects all routes under /customer/auth/*
app.use("/customer/auth/*", function auth(req, res, next) {
  // Check if session has an authorization token
  if (req.session && req.session.authorization) {
    const token = req.session.authorization.accessToken;
    // Verify the JWT token
    jwt.verify(token, "access", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "User not authenticated. Token invalid or expired." });
      }
      // Attach decoded user info to the request object
      req.user = decoded;
      next(); // proceed to the route handler
    });
  } else {
    return res.status(401).json({ message: "User not logged in. Please login first." });
  }
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running on port " + PORT));
