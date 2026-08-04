import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MfaSettings from '../components/MfaSettings';
import SEO from '../components/SEO';
import { User, Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, token, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileName, email: profileEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
        await refreshProfile();
      } else {
        setMessage(data.message || 'Failed to update profile.');
      }
    } catch {
      setMessage('Connection error.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setNotificationsEnabled(val);
    localStorage.setItem('notificationsEnabled', String(val));
    setMessage('Notification settings updated!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-xs text-slate-500">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="My Profile & Security Settings" description="Update your account details and configure multi-factor authentication." canonicalPath="/profile" />
      
      <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-brand-darkBg transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Back Navigation & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-brand-deepBlue dark:text-white leading-tight">My Profile</h1>
              <p className="text-xs text-slate-400">Manage your identity and authentication security credentials.</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${message.includes('successfully') || message.includes('updated') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Account Details Form & Notifications */}
            <div className="space-y-8">
              {/* Profile Details Form */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm relative overflow-hidden text-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-brand-glowCyan" />
                  <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">Account Details</h3>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-glowCyan"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-brand-darkBg border border-slate-200 dark:border-brand-darkBorder text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-glowCyan"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Notification Preferences */}
              <div className="p-6 rounded-3xl bg-white dark:bg-brand-darkCard border border-slate-200 dark:border-brand-darkBorder shadow-sm text-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-brand-glowCyan" />
                  <h3 className="text-sm font-bold text-brand-deepBlue dark:text-white">Alert Preferences</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">Choose how you wish to receive notifications from ForenSecure.</p>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-brand-darkBg transition-colors border border-slate-100 dark:border-brand-darkBorder">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={handleNotificationToggle}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-brand-deepBlue dark:text-white">Email Alerts</p>
                    <p className="text-[10px] text-slate-400">Receive alerts for new grades, assignments, and announcements.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column: Two-Factor Settings */}
            <div>
              <MfaSettings />
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
