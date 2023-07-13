const express = require("express");
const jwt = require("jsonwebtoken");
const Model = require("../model/user");
const mongoose = require('mongoose');

require("dotenv").config();
const app = express();
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// Secret key for signing and verifying tokens
const secretKey = process.env.secretKey;

// Middleware function to log requests
const authMiddleware = (req, res, next) => {
  // Get the token from the Authorization header
  try {
    const token = req.headers.authorization.split(" ")[2]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed!");
    }
    jwt.verify(token, `${secretKey}`, function (err, decoded) {
      if (err) {
        return res.json({error:err});
      } else {
        req.decoded = decoded;
        req.authenticated = true;
        next();
      }
    });
  } catch (err) {
    res.status(400).send("Invalid token !");
  }
};

// Middleware function to parse request body
app.use(express.json());

//Login User API

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Model.findOne({ email });
  if (!email || !password) {
    return res.status(404).json({ message: "Credentials not be found" });
  }
  if (!user) {
    return res.status(404).json({ message: "email is invalid" });
  }
  try {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    // Generate a token and send it back to the client
    const token = jwt.sign({ name: user.name, id: user._id }, `${secretKey}`, {
      expiresIn: "1h",
    });
    app.set("secret", secretKey);
    if (user.email && isPasswordMatch) {
      return res.json({id:user._id,email : user.email, name:user.name, token: token});
    } else {
      return res.status(404).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//ADD USER
router.post("/register", async (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, salt);
  const data = new Model({
    name: req.body.name,
    address: req.body.address,
    password: hash,
    email: req.body.email,
    contact: req.body.contact,
  });

  try {
    if (
      req.body.name &&
      req.body.address &&
      req.body.password &&
      req.body.email &&
      req.body.contact
    ) {
      const dataToSave = await data.save();
      res.json([{ message: "User register successfully", success: true }]);
    } else {
      res.status(404).json({ message: "Please provide all data" })
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Get all Users
router.get("/getAllUsers", authMiddleware, async (req, res) => {
  try {
    const data = await Model.find();
    res.status(200).json({results:data, success:true});
  } catch (error) {
    res.status(400).json({ message: error });
  }
});

// Update User
router.put("/updateUser/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const options = { new: true };
    const result = await Model.findByIdAndUpdate(id, updatedData, options);
    res.status(200).send(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete specific user method
router.delete("/deleteUser/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // Invalid user ID format
      return res.status(404).send({ message: 'Invalid user ID' });
    }

    const user = await Model.findById(userId);
    if (user) {
      // User found, perform deletion
      const deletedUser = await Model.findByIdAndDelete(userId);
      return res.status(200).send({ message: `User with name ${deletedUser.name} has been deleted.` });
    } else {
      // User not found
      return res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Reset User Password
router.post("/resetPassword", async (req, res) => {
  try {
    const email = req.body.email;
    const verifyUser = await Model.findOne({ email });
    if (verifyUser?.password === req.body.password) {
      res.status(404).send({ message: "Try another password" });
    }
    if (verifyUser) {
      const updatedData = req.body;
      const userId = req?.body._id;
      const options = { new: true };
       await Model.findByIdAndUpdate(
        userId,
        updatedData,
        options
      );
      res.status(200).send({ message: "Your password successful updated", success:true });
    } else {
      res.status(404).send({ message: "User not Exist" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = { router };
