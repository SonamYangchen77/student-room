const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const loginUser = async (email, password) => {
  const user = await userModel.findUserByEmail(email);
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid password');

  return user; // You may return a token here if using JWT
};

const registerUser = async (email, password) => {
  const existing = await userModel.findUserByEmail(email);
  if (existing) throw new Error('Email already in use');

  const hash = await bcrypt.hash(password, 10);
  const newUser = await userModel.createUser(email, hash);
  return newUser;
};

module.exports = {
  loginUser,
  registerUser,
};
