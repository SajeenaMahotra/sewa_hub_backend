import { Router } from "express";
import { ServiceCategoryController } from "../controllers/servicecategory.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

const router = Router();
const controller = new ServiceCategoryController();

// PUBLIC — provider setup form needs this
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// ADMIN ONLY
router.post("/", authorizedMiddleware, uploads.single("image"), controller.create);
router.put("/:id", authorizedMiddleware, uploads.single("image"), controller.update);
router.delete("/:id", authorizedMiddleware, controller.delete);

export default router;