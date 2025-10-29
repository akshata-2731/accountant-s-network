import React from 'react';
import Button from './Button';
import { GoogleIcon, UserCircleIcon, BellIcon } from './icons';
import type { User } from '../types';


interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  unreadCount: number;
}

const Logo: React.FC = () => (
  <div className="flex items-center space-x-4">
    <img src="/assets/logo.png" alt="Accountant's Factory Logo" className="h-12 w-auto" />
  </div>
);


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, unreadCount }) => {
  const handleScrollTo = (e: React.MouseEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#/" aria-label="Home">
            <Logo />
          </a>
          <nav className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4">
                {currentUser.role === 'admin' && (
                  <a href="#/admin" className="font-semibold text-brand-teal hover:underline">
                    Admin Panel
                  </a>
                )}
                {currentUser.role === 'user' && (
                  <a href="#/dashboard" className="font-semibold text-brand-teal hover:underline">
                    Dashboard
                  </a>
                )}
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                </span>

                <a
                  href="#/profile"
                  title="My Profile"
                  className="text-gray-600 hover:text-brand-teal flex items-center gap-1"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  <span className="text-sm font-medium hidden md:inline">My Profile</span>
                </a>
                {currentUser.role === 'admin' && (
                  <div className="relative" title={`${unreadCount} unread notifications`}>
                    <BellIcon className="w-6 h-6 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
                <Button onClick={onLogout} variant="secondary" className="py-2 px-4 text-sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-6">
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, 'how-it-works')}
                  className="font-semibold text-brand-gray hover:text-brand-teal transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#services"
                  onClick={(e) => handleScrollTo(e, 'services')}
                  className="font-semibold text-brand-gray hover:text-brand-teal transition-colors"
                >
                  Services
                </a>
                <a
                  href="#testimonials"
                  onClick={(e) => handleScrollTo(e, 'testimonials')}
                  className="font-semibold text-brand-gray hover:text-brand-teal transition-colors"
                >
                  Testimonials
                </a>
                <a
                  href="#faqs"
                  onClick={(e) => handleScrollTo(e, 'faqs')}
                  className="font-semibold text-brand-gray hover:text-brand-teal transition-colors"
                >
                  FAQs
                </a>
                <Button onClick={(e) => handleScrollTo(e, 'hero')} variant="primary" className="py-2 px-4 text-sm">
                  Join Now
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
