import { useState } from "react";
import { BsSend, BsPaperclip } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const { loading, sendMessage } = useSendMessage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message && !file) return;

        const formData = new FormData();
        formData.append("message", message);
        if (file) {
            formData.append("file", file);
        }

        await sendMessage(formData);
        setMessage("");
        setFile(null);
        setFilePreview(null);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(selectedFile));
            } else if (selectedFile.type === "application/pdf") {
                setFilePreview("https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/1200px-PDF_file_icon.svg.png");
            } else if (selectedFile.type.startsWith("video/")) {
                setFilePreview(URL.createObjectURL(selectedFile));
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFilePreview(null);
    };

    return (
        <form className='px-4 my-3' onSubmit={handleSubmit}>
            <div className='w-full relative'>
                <input
                    type='text'
                    className='border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white'
                    placeholder='Send a message or photo (photo cannot download)'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <label htmlFor="file-input" className='absolute inset-y-0 end-10 flex items-center pe-3 cursor-pointer'>
                    <BsPaperclip className='text-gray-400 hover:text-gray-300' />
                </label>
                <input
                    id="file-input"
                    type='file'
                    className='hidden'
                    onChange={handleFileChange}
                    accept="image/*, application/pdf"
                />
                <button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
                    {loading ? <div className='loading loading-spinner'></div> : <BsSend />}
                </button>
            </div>
            {filePreview && (
                <div className='mt-2 relative'>
                    <img src={filePreview} alt="Preview" className='w-20 h-20 object-cover rounded-lg' />
                    <button
                        type='button'
                        className='absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center'
                        onClick={handleRemoveFile}
                    >
                        &times;
                    </button>
                </div>
            )}
        </form>
    );
};

export default MessageInput;