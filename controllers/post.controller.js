import Post from "../models/post.model.js";
import { uploadToCloudinary } from "../config/cloudinaryConfig.js"; // Import the Cloudinary utility
import upload from "../middleware/upload.js";
import { storage } from "../middleware/upload.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const createPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const mediaUrl = await uploadToCloudinary(file);

        const newPost = new Post({
            userId: req.user._id,
            media: mediaUrl,
            caption,
        });

        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.log("Error in createPost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getPosts = async (req, res) => {
    try {
        const currentUserId = req.user._id; // Get the current user's ID from the request

        // Fetch the current user's document to get their followers and following lists
        const currentUser = await User.findById(currentUserId).select("following followers");

        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found" });
        }

        // Combine the following and followers lists into a single array of user IDs
        const relevantUserIds = [...currentUser.following, ...currentUser.followers,currentUserId];

        // Fetch posts only from users in the relevantUserIds array
        const posts = await Post.find({ userId: { $in: relevantUserIds } })
            .sort({ createdAt: -1 })
            .populate("userId", "username profilePic");

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getPosts controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }

        await post.save();

        // Emit the event to all connected users
        io.emit("postLiked", { postId, likes: post.likes });

        res.status(200).json({ likes: post.likes });
    } catch (error) {
        console.log("Error in likePost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const commentPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        post.comments.push({ userId, comment });
        await post.save();

        const receiverSocketId = getReceiverSocketId(post.userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("postCommented", { postId, comments: post.comments });
        }

        res.status(200).json({ comments: post.comments });
    } catch (error) {
        console.log("Error in commentPost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(postId);

        const receiverSocketId = getReceiverSocketId(post.userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("postDeleted", { postId });
        }

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.log("Error in deletePost controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCurrentUserPosts = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming `req.user` is set by your authentication middleware
        const posts = await Post.find({ userId }).populate("userId", "username profilePic");

        console.log("Fetched Posts:", posts); // Debugging: Log the fetched posts

        if (!posts || posts.length === 0) {
            return res.status(404).json({ error: "No posts found for the current user" });
        }

        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching current user posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};