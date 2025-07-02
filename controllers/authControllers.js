import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../db/Users.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import HttpError from "../helpers/HttpError.js";
import controllerWrapper from "../helpers/controllerWrapper.js";

const { JWT_SECRET } = process.env;

const register = async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }

  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }

  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user.id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await user.update({ token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

export default {
  register: controllerWrapper(register),
  login: controllerWrapper(login),
};
