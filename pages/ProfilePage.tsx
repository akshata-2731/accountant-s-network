import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import type { User } from '../types';
import { updateUserProfile } from '../services/mockApiService';

interface ProfilePageProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onProfileUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const hasChanges = name !== user.name || email !== (user.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setIsSaving(true);
    setMessage('');
    try {
      const updatedUser = await updateUserProfile(name, email, user.token);
      onProfileUpdate(updatedUser);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const returnUrl = user.role === 'admin' ? '#/admin' : '#/dashboard';

  return (
    <div className="bg-brand-light-gray min-h-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-serif text-brand-gray">My Profile</h1>
          </div>
          <Card>
            <div className="space-y-6 p-6">
              {/* ADMIN: Only show username */}
              {user.role === 'admin' ? (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value="hello"
                    readOnly
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              ) : (
                // USER: show full name + email, editable
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                      required
                    />
                  </div>
                  <div className="flex justify-end items-center gap-4">
                    {message && (
                      <p
                        className={`text-sm ${
                          message.includes('successfully') ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {message}
                      </p>
                    )}
                    <a href={returnUrl}>
                      <Button type="button" variant="outline">
                        Back
                      </Button>
                    </a>
                    <Button type="submit" disabled={isSaving || !hasChanges}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}
              {/* Always show Back button for admin */}
              {user.role === 'admin' && (
                <div className="flex justify-end items-center gap-4">
                  <a href={returnUrl}>
                    <Button type="button" variant="outline">
                      Back
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
