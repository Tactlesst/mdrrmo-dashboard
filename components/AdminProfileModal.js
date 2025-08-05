'use client';

import { useState, useEffect } from 'react';

export default function AdminProfileModal({ onClose }) {
  const [admin, setAdmin] = useState({ name: '', email: '', profile_image_url: '' });
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ message: '', error: false });
  const [newImageFile, setNewImageFile] = useState(null); // Only store new image if selected

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          onClose();
        }
      })
      .catch(() => onClose());
  }, [onClose]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus({ message: '', error: false });

    let imageUrl = admin.profile_image_url;

    // Upload image only if a new one is selected
    if (newImageFile) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result;

        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          imageUrl = data.url;
          sendUpdate(imageUrl);
        } else {
          setStatus({ message: 'Image upload failed.', error: true });
        }
      };

      reader.readAsDataURL(newImageFile);
    } else {
      // No new image selected, just send update
      sendUpdate(imageUrl);
    }
  };

  const sendUpdate = async (imageUrl) => {
    const response = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: admin.name,
        profile_image_url: imageUrl,
        password: newPassword,
      }),
    });

    const data = await response.json();
    setStatus({ message: data.message, error: !response.ok });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file); // Save the file to upload on form submit
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-red-700 text-center">Admin Profile</h2>

        {status.message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              status.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="mt-1 w-full border rounded px-3 py-2"
              value={admin.name}
              onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled
              className="mt-1 w-full border rounded px-3 py-2 bg-gray-100"
              value={admin.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Profile Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full border rounded px-3 py-2"
              onChange={handleImageChange}
            />
            {admin.profile_image_url && (
              <img
                src={admin.profile_image_url}
                alt="Profile"
                className="w-20 h-20 rounded-full mt-2 border object-cover"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              className="mt-1 w-full border rounded px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}
