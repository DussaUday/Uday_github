import express from "express";
import { createPost, getPosts, likePost, commentPost, deletePost, getCurrentUserPosts } from "../controllers/post.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/create", protectRoute, upload.single("media"), createPost);
router.get("/getPosts", protectRoute, getPosts);
router.post("/like/:postId", protectRoute, likePost);
router.post("/comment/:postId", protectRoute, commentPost);
router.delete("/delete/:postId", protectRoute, deletePost);
router.get("/current-user", protectRoute, getCurrentUserPosts);

export default router;