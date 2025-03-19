import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { sendGameRequest, acceptGameRequest, rejectGameRequest, markCell , getPendingGameRequests} from "../controllers/game.controller.js";
import { io, userSocketMap } from "../socket/socket.js";

const router = express.Router();

router.post("/send-request", protectRoute, (req, res) => sendGameRequest(req, res, io, userSocketMap));
router.post("/accept-request", protectRoute, (req, res) => acceptGameRequest(req, res, io, userSocketMap));
router.post("/reject-request", protectRoute, (req, res) => rejectGameRequest(req, res, io, userSocketMap));
router.post("/mark-cell", protectRoute, (req, res) => markCell(req, res, io, userSocketMap));
router.get("/pending-requests", protectRoute, (req, res) => getPendingGameRequests(req, res));

export default router;