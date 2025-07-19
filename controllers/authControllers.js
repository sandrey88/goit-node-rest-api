import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import { v4 as uuidv4 } from "uuid";
import User from "../db/Users.js";
import sendMail from "../helpers/sendMail.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import HttpError from "../helpers/HttpError.js";
import controllerWrapper from "../helpers/controllerWrapper.js";
import path from "path";
import fs from "fs/promises";

const avatarsDir = path.resolve("public", "avatars");

const { JWT_SECRET } = process.env;

const { APP_DOMAIN } = process.env;

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

  const avatarURL = gravatar.url(email);
  const verificationToken = uuidv4();

  const newUser = await User.create({
    email,
    password: hashedPassword,
    avatarURL,
    verificationToken,
  });

  const verificationEmail = {
    to: email,
    subject: "Verify your email address",
    html: `To verify your email, please click on this <a href="${APP_DOMAIN}/api/auth/verify/${verificationToken}">link</a>`,
  };

  await sendMail(verificationEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
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
    throw HttpError(401, "Email or password invalid");
  }

  if (!user.verify) {
    throw HttpError(401, "Email not verified");
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

const logout = async (req, res) => {
  const { id } = req.user;
  await User.update({ token: null }, { where: { id } });
  res.status(204).send();
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

const updateAvatar = async (req, res) => {
  const { id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  // Створюємо унікальне ім'я файлу на основі ID користувача та оригінальної назви
  const filename = `${id}-${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  // Перевіряємо, чи існує папка, і створюємо її, якщо ні
  try {
    await fs.access(avatarsDir);
  } catch {
    await fs.mkdir(avatarsDir, { recursive: true });
  }

  await fs.rename(tempUpload, resultUpload);

  const avatarURL = path.join("avatars", filename);
  await User.update({ avatarURL }, { where: { id } });

  res.json({ avatarURL });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ where: { verificationToken } });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.update(
    { verify: true, verificationToken: null },
    { where: { id: user.id } }
  );

  res.status(200).json({
    message: "Verification successful",
  });
};

export default {
  register: controllerWrapper(register),
  login: controllerWrapper(login),
  logout: controllerWrapper(logout),
  getCurrent: controllerWrapper(getCurrent),
  updateAvatar: controllerWrapper(updateAvatar),
  verifyEmail: controllerWrapper(verifyEmail),
};
