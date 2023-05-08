const express = require("express");
const jwt = require("jsonwebtoken");
const Model = require("../model/user");
require("dotenv").config();
const app = express();
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// Secret key for signing and verifying tokens
const secretKey = process.env.secretKey;

// Middleware function to log requests
const logRequests = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

// Middleware function to parse request body
app.use(express.json());

//Login User API

router.post("/login", logRequests, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Model.findOne({ email });
    const isPasswordMatch = await bcrypt.compare(password, user.password);
      // Generate a token and send it back to the client
      const token = jwt.sign({ name: user.name, id: user._id }, `${secretKey}`, {expiresIn: "1h"});
    if (user && isPasswordMatch) {
      res.send({ token: token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
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
    if(req.body.name && req.body.address && req.body.password && req.body.email && req.body.contact){
      const dataToSave = await data.save();
      res.json([{message:"User register successfully", success:true}])
    }else{
      res.send({message: "Please provide all data"})
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Get all Users
router.get("/getAllUsers", async (req, res) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const decoded = jwt.verify(token, `${secretKey}`);
    const username = decoded.name;
    if (username) {
      const data = await Model.find();
      res.json(data);
    }
  } catch (error) {
    res.json({ message: error });
  }
});

//Update User
router.put("/updateUser/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const decoded = jwt.verify(token, `${secretKey}`);
    const username = decoded.name;
    const id = req.params.id;
    const updatedData = req.body;
    const options = { new: true };
    if (username) {
      const result = await Model.findByIdAndUpdate(id, updatedData, options);
      res.send(result);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Delete specific user Method
router.delete("/deleteUser/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Model.findByIdAndDelete(id);
    res.send(`User with name ${data.name} has been deleted..`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Reset User Password
router.post("/resetPassword", async (req, res) => {
  try {
    const email = req.body.email;
    const verifyUser = await Model.findOne({ email });
    if (verifyUser.password === req.body.password) {
      res.send({ message: "Try another password" });
    }
    if (verifyUser.password !== req.body.password && verifyUser) {
      const updatedData = req.body;
      const userId = req.body._id;
      const options = { new: true };
      const result = await Model.findByIdAndUpdate(
        userId,
        updatedData,
        options
      );
      res.send({ message: "Your password successfull updated" });
    } else {
      res.send({ message: "User not Exist" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = { router };
