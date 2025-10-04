import { Router } from "express";
import multer from "multer";
import { ContactListController } from "../controllers/contact-list.controller";

const controller = new ContactListController();
const upload = multer({ storage: multer.memoryStorage() });

export const contactListRouter = Router();

contactListRouter.get("/", (req, res, next) => controller.list(req, res).catch(next));
contactListRouter.get("/:id", (req, res, next) => controller.get(req, res).catch(next));
contactListRouter.post(
  "/upload",
  upload.single("file"),
  (req, res, next) => controller.upload(req, res).catch(next)
);
contactListRouter.post("/:id/publish", (req, res, next) => controller.publish(req, res).catch(next));
contactListRouter.delete(
  "/:id/contacts/:contactId",
  (req, res, next) => controller.removeContact(req, res).catch(next)
);
