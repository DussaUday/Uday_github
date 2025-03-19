import React, { useState, useRef } from "react";
import { BsImage } from "react-icons/bs";
import usePost from "../../hooks/usePost";
import UserPosts from "./UserPosts";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("none");
    const [filterIntensity, setFilterIntensity] = useState(1);
    const [crop, setCrop] = useState({
        aspect: 1 / 1,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
    });
    const [croppedMedia, setCroppedMedia] = useState(null);
    const mediaRef = useRef(null);
    const { createPost, loading } = usePost();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(file);
            setCroppedMedia(null);
        }
    };

    const handleRemoveMedia = () => {
        setMedia(null);
        setCroppedMedia(null);
        setSelectedFilter("none");
        setFilterIntensity(1);
    };

    const handleCropComplete = (crop) => {
        if (media && media.type.startsWith("image") && mediaRef.current) {
            const image = mediaRef.current;
            const canvas = document.createElement("canvas");
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            canvas.toBlob((blob) => {
                setCroppedMedia(blob);
            }, media.type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!media) return;

        const formData = new FormData();
        formData.append("media", croppedMedia || media);
        formData.append("caption", caption);
        formData.append("filter", selectedFilter);
        formData.append("filterIntensity", filterIntensity);

        try {
            const success = await createPost(formData);
            if (success) {
                navigate("/");
            } else {
                console.error("Failed to create post.");
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    const filters = [
        { name: "None", value: "none" },
        { name: "Grayscale", value: "grayscale" },
        { name: "Sepia", value: "sepia" },
        { name: "Blur", value: "blur" },
        { name: "Brightness", value: "brightness" },
        { name: "Contrast", value: "contrast" },
    ];

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Create Post</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Media
                    </label>
                    <div className="flex items-center space-x-4">
                        <label
                            htmlFor="media"
                            className="cursor-pointer p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <BsImage className="text-2xl text-gray-600" />
                        </label>
                        <input
                            id="media"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*, video/*"
                        />
                        {media && (
                            <div className="relative flex-shrink-0">
                                {media.type.startsWith("image") ? (
                                    <div className="w-96 h-96 rounded-lg overflow-hidden">
                                        <ReactCrop
                                            src={URL.createObjectURL(media)}
                                            crop={crop}
                                            onChange={(newCrop) => setCrop(newCrop)}
                                            onComplete={handleCropComplete}
                                            ruleOfThirds
                                        >
                                            <img
                                                ref={mediaRef}
                                                src={URL.createObjectURL(media)}
                                                alt="Preview"
                                                className={`w-full h-full object-cover ${selectedFilter}`}
                                                style={{
                                                    filter: `${selectedFilter}(${filterIntensity})`,
                                                }}
                                            />
                                        </ReactCrop>
                                    </div>
                                ) : (
                                    <div className="w-96 h-96 rounded-lg overflow-hidden">
                                        <video
                                            src={URL.createObjectURL(media)}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transform translate-x-1/2 -translate-y-1/2 hover:bg-red-600 transition-colors"
                                    onClick={handleRemoveMedia}
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {media && media.type.startsWith("image") && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apply Filter
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {filters.map((filter) => (
                                <button
                                    key={filter.value}
                                    type="button"
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        selectedFilter === filter.value
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setSelectedFilter(filter.value)}
                                >
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter Intensity
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={filterIntensity}
                                onChange={(e) => setFilterIntensity(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                        Caption
                    </label>
                    <textarea
                        id="caption"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={loading || !media}
                >
                    {loading ? "Posting..." : "Post"}
                </button>
            </form>

            <div className="mt-8">
                <UserPosts />
            </div>
        </div>
    );
};

export default CreatePost;