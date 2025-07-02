import express from "express";
import authenticate from "../middleware/authenticate.js";
import contactsController from "../controllers/contactsControllers.js";

const router = express.Router();

router.use(authenticate);

router.get("/", contactsController.getAllContacts);

router.get("/:id", contactsController.getOneContact);

router.delete("/:id", contactsController.deleteContact);

router.post("/", contactsController.createContact);

router.put("/:id", contactsController.updateContact);

router.patch("/:id/favorite", contactsController.updateStatusContact);

export default router;
