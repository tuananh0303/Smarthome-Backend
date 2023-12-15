const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authUserMiddleWare } = require("../middleware/authMiddleware");

router.post("/sign-up", userController.createUser); /*done*/
router.post("/log-in", userController.loginUser); /*done*/
router.put("/update-user/:id", authUserMiddleWare, userController.updateUser);
router.get(
  "/get-details/:id",
  authUserMiddleWare,
  userController.getDetailsUser
);
router.post("/refresh-token", userController.refreshToken);
router.post("/log-out", userController.logoutUser);

module.exports = router;
