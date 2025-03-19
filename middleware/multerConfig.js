import multer from "multer";
import fs from "fs";
import path from "path";


const storage = multer.memoryStorage(); // Store the file in memory

const uploadDir = path.join(process.cwd(), "uploads");

const upload = multer({ storage });

export default upload;
