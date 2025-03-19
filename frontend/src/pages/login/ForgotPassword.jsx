import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, dob, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Password changed successfully!");
        navigate("/login");
      } else {
        setMessage(data.error || "Failed to change password");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-900'>
      <div className='w-full max-w-md p-8 rounded-lg shadow-md bg-gray-800 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
        <h1 className='text-3xl font-semibold text-center text-gray-300 mb-6'>
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='label p-2'>
              <span className='text-base label-text text-gray-300'>Username</span>
            </label>
            <input
              type='text'
              placeholder='Enter username'
              className='w-full input input-bordered h-10 bg-gray-700 text-white'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className='mb-4'>
            <label className='label'>
              <span className='text-base label-text text-gray-300'>Date of Birth</span>
            </label>
            <input
              type='date'
              className='w-full input input-bordered h-10 bg-gray-700 text-white'
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className='mb-6'>
            <label className='label'>
              <span className='text-base label-text text-gray-300'>New Password</span>
            </label>
            <input
              type='password'
              placeholder='Enter New Password'
              className='w-full input input-bordered h-10 bg-gray-700 text-white'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <button className='btn btn-block btn-sm mt-2 bg-blue-600 text-white hover:bg-blue-700' type='submit'>
              Change Password
            </button>
          </div>

          {message && <p className='text-center mt-4 text-red-500'>{message}</p>}
        </form>

        <div className='mt-6 text-center'>
          <Link to="/login" className='text-blue-500 hover:text-blue-400'>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;