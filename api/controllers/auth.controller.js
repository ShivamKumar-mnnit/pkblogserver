import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";

const signToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, "ramisgood");
  // return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET);
};

export const signup = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    username === "" ||
    email === "" ||
    password === ""
  ) {
    next(errorHandler(400, "All fields are required"));
  }

  const newUser = new User({
    username,
    email,
    password: password,
  });

  await newUser.save();
  res.json("Signup successful");
});

export const signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    next(errorHandler(400, "All fields are required"));
  }

  const validUser = await User.findOne({ email });
  if (
    !validUser ||
    !(await validUser.correctPassword(password, validUser.password))
  ) {
    return next(errorHandler(400, "Invalid credentials"));
  }
  // const validPassword = bcryptjs.compareSync(password, validUser.password);
  // if (!validPassword) {
  //   return next(errorHandler(400, "Invalid credentials"));
  // }
  const token = signToken(validUser._id, validUser.isAdmin);
  console.log(token);

  const { password: pass, ...userData } = validUser._doc;

  res
    .status(200)
    .cookie("access_token", token, {
      httpOnly: true,
    })
    .json(userData);
});

export const google = catchAsync(async (req, res, next) => {
  const { email, name, googlePhotoUrl } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    const token = signToken(user._id, user.isAdmin);

    const { password, ...rest } = user._doc;
    res
      .status(200)
      .cookie("access_token", token, { httpOnly: true })
      .json(rest);
  } else {
    const generatePassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8);

    const newUser = new User({
      username:
        name.toLowerCase().split(" ").join("") +
        Math.random().toString(9).slice(-4),
      email,
      password: generatePassword,
      profilePicture: googlePhotoUrl,
    });
    await newUser.save();
    const token = signToken(newUser._id, newUser.isAdmin);
    const { password, ...rest } = newUser._doc;
    res
      .status(200)
      .cookie("access_token", token, { httpOnly: true })
      .json(rest);
  }
});
