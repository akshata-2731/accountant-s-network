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
  const [phone, setPhone] = useState(user.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const hasChanges = name !== user.name || email !== (user.email || '') || phone !== (user.phone || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsSaving(true);
    setMessage('');
    try {
      const updatedUser = await updateUserProfile(name, email, phone, user.token); // Pass phone now
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
            <p className="mt-2 text-gray-600">View and update your personal information.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal"
                  required
                />
              </div>

              {user.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Status</label>
                  <p className={`mt-1 text-sm font-semibold ${user.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-5">
                <div className="flex justify-end items-center gap-4">
                  {message && <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                  <a href={returnUrl}>
                    <Button type="button" variant="outline">
                      Back
                    </Button>
                  </a>
                  <Button type="submit" disabled={isSaving || !hasChanges}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
