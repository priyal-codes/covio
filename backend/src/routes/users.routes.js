import { Router } from "express";
import { login, register, addToHistory, getActivity, getUserInfo } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getActivity)
router.route("/get_user_info").get(getUserInfo)

export default router; 