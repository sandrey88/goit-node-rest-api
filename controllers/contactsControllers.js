import Contact from "../db/Contacts.js";
import User from "../db/Users.js";
import {
  createContactSchema,
  updateContactSchema,
  updateFavoriteSchema,
} from "../schemas/contactsSchemas.js";
import HttpError from "../helpers/HttpError.js";
import controllerWrapper from "../helpers/controllerWrapper.js";

const getAllContacts = async (req, res) => {
  const { id: owner } = req.user;
  const result = await Contact.findAll({ where: { owner } });
  res.json(result);
};

const getOneContact = async (req, res) => {
  const { id } = req.params;
  const { id: owner } = req.user;
  const result = await Contact.findOne({ where: { id, owner } });
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

const deleteContact = async (req, res) => {
  const { id } = req.params;
  const { id: owner } = req.user;
  const contact = await Contact.findOne({ where: { id, owner } });
  if (!contact) {
    throw HttpError(404, "Not found");
  }
  await contact.destroy();
  res.status(200).json(contact);
};

const createContact = async (req, res) => {
  const { error } = createContactSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const { name, email, phone } = req.body;
  const { id: owner } = req.user;
  const newContact = await Contact.create({ name, email, phone, owner });
  res.status(201).json(newContact);
};

const updateContact = async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw HttpError(400, "Body must have at least one field");
  }
  const { error } = updateContactSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const { id } = req.params;
  const { id: owner } = req.user;
  const contact = await Contact.findOne({ where: { id, owner } });
  if (!contact) {
    throw HttpError(404, "Not found");
  }
  const updatedContact = await contact.update(req.body);
  res.status(200).json(updatedContact);
};

const updateStatusContact = async (req, res) => {
  const { error } = updateFavoriteSchema.validate(req.body);
  if (error) {
    throw HttpError(400, error.message);
  }
  const { id } = req.params;
  const { favorite } = req.body;
  const { id: owner } = req.user;

  const contact = await Contact.findOne({ where: { id, owner } });

  if (!contact) {
    throw HttpError(404, "Not found");
  }

  const updatedContact = await contact.update({ favorite });

  res.status(200).json(updatedContact);
};

export default {
  getAllContacts: controllerWrapper(getAllContacts),
  getOneContact: controllerWrapper(getOneContact),
  deleteContact: controllerWrapper(deleteContact),
  createContact: controllerWrapper(createContact),
  updateContact: controllerWrapper(updateContact),
  updateStatusContact: controllerWrapper(updateStatusContact),
};
