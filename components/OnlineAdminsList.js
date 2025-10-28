'use client';

import { useEffect, useState, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { formatPHDate } from '@/lib/dateUtils';


export default function OnlineAdminsList({ currentUserId, currentUserName, currentUserType = 'admin' }) {
  const [admins, setAdmins] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // for modal
  const [selectedType, setSelectedType] = useState(null); // admin or responder
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef(null); // Reference for auto-scroll

  useEffect(() => {
    let intervalId;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admins/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        console.log('Status API Response:', data); // Debug log
        setAdmins(data.admins || []);
        setResponders(data.responders || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'online':
        return 'bg-green-500';
      case 'standby':
        return 'bg-yellow-500';
      case 'ready to go':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Format "Last seen" time for offline users
  const formatLastSeen = (lastActiveAt) => {
    if (!lastActiveAt) {
      console.log('No lastActiveAt provided');
      return null;
    }
    
    try {
      const lastActive = new Date(lastActiveAt);
      const now = new Date();
      const diffMs = now - lastActive;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      console.log('Last Active:', lastActiveAt, 'Diff mins:', diffMins); // Debug log

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return lastActive.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting last seen:', error);
      return null;
    }
  };

  const renderUserCard = (user, type) => (
    <div
      key={`${type}-${user.id}`}
      className="border-2 border-gray-500 bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => {
        setSelectedUser(user);
        setSelectedType(type);
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src={user.profile_image_url || user.image_url || '/default-avatar.png'}
          alt="User"
          className="w-12 h-12 rounded-full object-cover border border-gray-300"
        />
        <div className="flex flex-col">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${getStatusColor(user.status)} ${user.status?.toLowerCase() === 'online' ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-gray-800 capitalize">{user.status}</span>
          </div>
          {user.status?.toLowerCase() === 'offline' && user.last_active_at && (
            <span className="text-xs text-gray-500 ml-5">
              Last seen {formatLastSeen(user.last_active_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {type === 'responder' && user.responder_status && (
            <div className="text-xs text-gray-600">
              <span className="font-medium text-red-600">Responder:</span>{' '}
              {user.responder_status}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setSelectedType(type);
              setShowChat(true);
            }}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );

const renderUserModal = () => {
  if (!selectedUser || showChat) return null; // Don't show profile modal if chat is open

  const {
    name,
    email,
    contact,
    dob,
    address,
    profile_image_url,
    image_url,
  } = selectedUser;

  return (
    <div
      className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setSelectedUser(null)} // close on backdrop click
    >
      <div
        className="bg-white rounded-xl border-2 border-gray-500 w-full max-w-md p-6 relative shadow-lg"
        onClick={(e) => e.stopPropagation()} // prevent modal click from closing
      >
        <button
          onClick={() => setSelectedUser(null)}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-600"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <img
            src={profile_image_url || image_url || '/default-avatar.png'}
            alt="User"
            className="w-24 h-24 rounded-full border border-gray-300 object-cover mb-4"
          />
          <h2 className="text-xl font-bold text-blue-700">{name}</h2>
          <p className="text-gray-600">{email}</p>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-700">
          <p><span className="font-medium text-gray-700">Contact:</span> {contact || 'N/A'}</p>
          <p><span className="font-medium text-gray-700">Date of Birth:</span> {formatPHDate(dob)}</p>
          <p><span className="font-medium text-gray-700">Address:</span> {address || 'N/A'}</p>
          {selectedType === 'responder' && selectedUser.responder_status && (
            <p><span className="font-medium text-gray-700">Responder Status:</span> {selectedUser.responder_status}</p>
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Chat with {name}
          </button>
        </div>
      </div>
    </div>
  );
};

  // Fetch chat messages when chat opens
  useEffect(() => {
    if (showChat && selectedUser && currentUserId) {
      fetchChatMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchChatMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [showChat, selectedUser, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchChatMessages = async () => {
    if (!selectedUser || !currentUserId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${currentUserId}&otherUserId=${selectedUser.id}&userType=${currentUserType}&otherUserType=${selectedType}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const renderChatModal = () => {
    if (!showChat || !selectedUser) return null;
    const recipientName = selectedUser.name;
    const accountType = selectedType; // 'admin' | 'responder'
    const accountId = selectedUser.id;
    const senderType = 'chat'; // Use 'chat' to categorize in Others

    const handleSend = async () => {
      if (!chatInput.trim() || !currentUserId) return;
      setChatSending(true);
      try {
        const res = await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountType,
            accountId,
            senderType,
            senderId: currentUserId,
            senderName: currentUserName || 'Unknown',
            recipientName,
            message: chatInput.trim(),
          }),
        });
        if (!res.ok) throw new Error('Failed to send message');
        setChatInput('');
        // Refresh messages to show the sent message
        await fetchChatMessages();
      } catch (err) {
        alert(err.message || 'Failed to send');
      } finally {
        setChatSending(false);
      }
    };

    const handleCloseChat = () => {
      setShowChat(false);
      setSelectedUser(null); // Clear selected user to prevent profile modal from opening
      setSelectedType(null);
      setChatMessages([]);
      setChatInput('');
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={handleCloseChat}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Chat with {recipientName}</h3>
              <p className="text-xs text-gray-500 capitalize">{accountType}</p>
            </div>
            <button onClick={handleCloseChat} className="text-gray-500 hover:text-gray-700" aria-label="Close">
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 py-3 h-64 overflow-y-auto space-y-2">
            {loadingMessages && chatMessages.length === 0 && (
              <p className="text-xs text-gray-500 text-center">Loading messages...</p>
            )}
            {!loadingMessages && chatMessages.length === 0 && (
              <p className="text-xs text-gray-500 text-center">No messages yet. Start a conversation!</p>
            )}
            {chatMessages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 opacity-75">{msg.sender_name}</p>
                    )}
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            {/* Invisible div for auto-scroll */}
            <div ref={chatEndRef} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Type a message..."
              className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button onClick={handleSend} disabled={chatSending || !chatInput.trim()} className={`px-4 py-2 rounded-md text-white ${chatSending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {chatSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    );
  };


  if (loading) return <p className="text-gray-600">Loading status...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Filter out current user from the lists
  const filteredAdmins = admins.filter(admin => admin.id !== currentUserId);
  const filteredResponders = responders.filter(responder => responder.id !== currentUserId);

  return (
    <div className="p-6 bg-white rounded-xl">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Admin Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAdmins.length > 0 ? (
          filteredAdmins.map((admin) => renderUserCard(admin, 'admin'))
        ) : (
          <p className="text-gray-500 text-sm col-span-full">No other admins online</p>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mt-8 mb-4">Responder Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResponders.length > 0 ? (
          filteredResponders.map((responder) => renderUserCard(responder, 'responder'))
        ) : (
          <p className="text-gray-500 text-sm col-span-full">No responders online</p>
        )}
      </div>

      {renderUserModal()}
      {renderChatModal()}
    </div>
  );
}
