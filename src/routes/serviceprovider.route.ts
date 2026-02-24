import { Router } from "express";
import { ProviderController } from "../controllers/serviceprovider.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

const router = Router();
const providerController = new ProviderController();

router.get("/", providerController.getAllProviders);

router.use(authorizedMiddleware);
router.post(
    "/setup-profile",
    uploads.single("image"),
    providerController.setupProfile
);
router.get("/profile", providerController.getMyProfile);
router.put(
    "/profile",
    uploads.single("image"),
    providerController.updateProfile
);

export default router;