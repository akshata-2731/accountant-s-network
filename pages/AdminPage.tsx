import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import ReminderModal from '../components/ReminderModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { getAdminData, updateReferralStatus, setReferralReminder, subscribeToNewReferrals, unsubscribeFromNewReferrals } from '../services/mockApiService';
import type { Referral, AdminStats } from '../types';
import { ReferralStatus } from '../types';
import { TrophyIcon, BellIcon, ArrowDownTrayIcon } from '../components/icons';

const ADMIN_USERNAME = "hello";
const ADMIN_PASSWORD = "hello@123";

const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f0f0f0' }}>
      <Card>
        <h2 className="text-2xl font-bold font-serif text-brand-gray mb-4 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-72 mx-auto">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
            required
          />
          <Button type="submit" variant="primary" className="w-full">Login</Button>
          {error && <p className="text-red-600 text-center">{error}</p>}
        </form>
      </Card>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ReferralStatus }> = ({ status }) => {
    const colorClasses = {
        [ReferralStatus.LeadReceived]: 'bg-blue-100 text-blue-800',
        [ReferralStatus.ProposalSent]: 'bg-indigo-100 text-indigo-800',
        [ReferralStatus.Accepted]: 'bg-purple-100 text-purple-800',
        [ReferralStatus.WorkInProgress]: 'bg-yellow-100 text-yellow-800',
        [ReferralStatus.Completed]: 'bg-green-100 text-green-800',
        [ReferralStatus.Paid]: 'bg-teal-100 text-teal-800',
    };
    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorClasses[status]}`}>
            {status}
        </span>
    );
};

const AdminStatsSection: React.FC<{ stats: AdminStats | null }> = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <p className="text-sm text-gray-500">Total Referrals</p>
            <p className="text-3xl font-bold text-brand-gray">{stats?.totalReferrals ?? '...'}</p>
        </Card>
        <Card>
            <p className="text-sm text-gray-500">Total Pending Commission</p>
            <p className="text-3xl font-bold text-brand-gray">₹{stats?.pendingCommission.toLocaleString() ?? '...'}</p>
        </Card>
        <Card>
            <p className="text-sm text-gray-500">Conversion Rate (to Paid)</p>
            <p className="text-3xl font-bold text-brand-gray">{stats?.conversionRate ?? '...'}%</p>
        </Card>
    </div>
);

const TopReferrers: React.FC<{ referrers: { name: string; totalCommission: number; referralCount: number }[] }> = ({ referrers }) => (
    <Card>
        <h2 className="text-2xl font-bold font-serif text-brand-gray mb-4">Top Referrers</h2>
        <ul className="space-y-4">
            {referrers.map((referrer, index) => (
                <li key={referrer.name} className="flex items-center justify-between transition-transform hover:scale-105">
                    <div className="flex items-center">
                        <span className={`text-lg font-bold w-8 ${index === 0 ? 'text-yellow-500' : 'text-brand-teal'}`}>
                            {index === 0 ? <TrophyIcon className="w-6 h-6" /> : `${index + 1}.`}
                        </span>
                        <div>
                            <p className="font-semibold text-brand-gray">{referrer.name}</p>
                            <p className="text-xs text-gray-500">{referrer.referralCount} referrals</p>
                        </div>
                    </div>
                    <span className="font-bold text-brand-teal">₹{referrer.totalCommission.toLocaleString()}</span>
                </li>
            ))}
             {referrers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No paid referrals yet.</p>
            )}
        </ul>
    </Card>
);

const AdminPage: React.FC = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [reminderModalReferral, setReminderModalReferral] = useState<Referral | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const fetchAdminData = useCallback(async () => {
        if (referrals.length === 0) setIsLoading(true);
        setError(null);
        try {
            const adminData = await getAdminData();
            setReferrals(adminData.referrals);
            setStats(adminData.stats);
        } catch (err) {
            setError("Failed to load admin data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [referrals.length]);

    useEffect(() => {
        if (isAdminAuthenticated) {
            fetchAdminData();
        }
    }, [fetchAdminData, isAdminAuthenticated]);

    useEffect(() => {
        if (!isAdminAuthenticated) return;
        const handleNewReferral = (newReferral: Referral) => {
            setReferrals(prevReferrals => {
                if (prevReferrals.some(r => r.id === newReferral.id)) {
                    return prevReferrals;
                }
                const updatedReferrals = [newReferral, ...prevReferrals];
                setStats(prevStats => {
                    if (!prevStats) return null;
                    const totalReferrals = updatedReferrals.length;
                    const pendingCommission = updatedReferrals
                        .filter(r => r.status !== ReferralStatus.Paid)
                        .reduce((sum, r) => sum + r.expectedCommission, 0);
                    const paidCount = updatedReferrals.filter(r => r.status === ReferralStatus.Paid).length;
                    const conversionRate = totalReferrals > 0 ? Math.round((paidCount / totalReferrals) * 100) : 0;
                    return { totalReferrals, pendingCommission, conversionRate };
                });
                return updatedReferrals;
            });
        };
        subscribeToNewReferrals(handleNewReferral);
        return () => unsubscribeFromNewReferrals(handleNewReferral);
    }, [isAdminAuthenticated]);

    const filteredReferrals = useMemo(() => {
        if (!searchTerm) {
            return referrals;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return referrals.filter(referral =>
            referral.clientName.toLowerCase().includes(lowercasedFilter) ||
            referral.referrerName.toLowerCase().includes(lowercasedFilter)
        );
    }, [referrals, searchTerm]);

    const topReferrers = useMemo(() => {
        const referrerStats: { [name: string]: { totalCommission: number; referralCount: number } } = {};
        referrals.forEach(r => {
            if (!referrerStats[r.referrerName]) {
                referrerStats[r.referrerName] = { totalCommission: 0, referralCount: 0 };
            }
            if (r.status === ReferralStatus.Paid) {
                 referrerStats[r.referrerName].totalCommission += r.expectedCommission;
            }
            referrerStats[r.referrerName].referralCount += 1;
        });
        return Object.entries(referrerStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.totalCommission - a.totalCommission)
            .slice(0, 5);
    }, [referrals]);

    const handleStatusChange = async (referralId: string, newStatus: ReferralStatus) => {
        const referral = referrals.find(r => r.id === referralId);
        if (!referral) return;
        const executeUpdate = async () => {
            setConfirmModalState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
            setUpdatingId(referralId);
            try {
                await updateReferralStatus(referralId, newStatus);
                fetchAdminData();
            } catch (err) {
                console.error("Failed to update status:", err);
                alert("Could not update status. Please try again.");
            } finally {
                setUpdatingId(null);
            }
        };
        if (newStatus === ReferralStatus.Paid) {
            setConfirmModalState({
                isOpen: true,
                title: 'Confirm Payout',
                message: `Marking this referral for "${referral.clientName}" as "Paid" will process the commission payout. This action cannot be undone. Are you sure you want to proceed?`,
                onConfirm: executeUpdate,
            });
        } else {
            executeUpdate();
        }
    };

    const handleSetReminder = async (referralId: string, reminderDate: string | null, reminderNote: string | null) => {
        try {
            const updatedReferral = await setReferralReminder(referralId, reminderDate, reminderNote);
            setReferrals(prev => prev.map(r => r.id === referralId ? updatedReferral : r));
            setReminderModalReferral(null);
        } catch (error) {
            console.error("Failed to set reminder:", error);
            alert("Could not set reminder. Please try again.");
        }
    };

    const handleExportCSV = () => {
        if (referrals.length === 0) {
            alert("No data to export.");
            return;
        }
        const headers = [
            'ID', 'Client Name', 'Referrer', 'Date Submitted', 'Status',
            'Expected Commission', 'Reminder Date', 'Reminder Note'
        ];
        const sanitizeCell = (cellData: string | number | null | undefined) => {
            const cell = String(cellData || '');
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        };
        const csvContent = [
            headers.join(','),
            ...referrals.map(r => [
                sanitizeCell(r.id),
                sanitizeCell(r.clientName),
                sanitizeCell(r.referrerName),
                sanitizeCell(r.dateSubmitted),
                sanitizeCell(r.status),
                sanitizeCell(r.expectedCommission),
                sanitizeCell(r.reminderDate),
                sanitizeCell(r.reminderNote)
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split('T')[0];
            link.setAttribute("href", url);
            link.setAttribute("download", `referrals-export-${today}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isAdminAuthenticated) {
        return <AdminLogin onSuccess={() => setIsAdminAuthenticated(true)} />;
    }

    if (isLoading) {
        return <div className="text-center p-10">Loading Admin Panel...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }

    return (
        <div className="bg-brand-light-gray">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-serif text-brand-gray">Admin Dashboard</h1>
                    <p className="mt-2 text-gray-600">Oversee and manage the entire referral network.</p>
                </div>
                <AdminStatsSection stats={stats} />
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                <h2 className="text-2xl font-bold font-serif text-brand-gray">Referral Management</h2>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-grow sm:flex-grow-0 w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm transition"
                                    />
                                    <Button onClick={handleExportCSV} variant="outline" className="py-2 px-3 text-sm flex-shrink-0 flex items-center gap-2">
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                        <span>Export</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Client Name</th>
                                            <th className="px-6 py-3">Mobile Number</th>
                                            <th className="px-6 py-3">Email Address</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Current Status</th>
                                            <th className="px-6 py-3">Reminder</th>
                                            <th className="px-6 py-3">Update Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReferrals.map(referral => (
                                            <tr key={referral.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{referral.clientName}</td>
                                                <td className="px-6 py-4">{referral.mobile}</td>
                                                <td className="px-6 py-4">{referral.email}</td>
                                                <td className="px-6 py-4 text-gray-600">{referral.dateSubmitted}</td>
                                                <td className="px-6 py-4"><StatusBadge status={referral.status} /></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setReminderModalReferral(referral)}
                                                        className={`p-1 rounded-full transition-colors ${referral.reminderDate ? 'text-brand-teal hover:bg-teal-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                                        title={referral.reminderDate ? `Reminder set for ${new Date(referral.reminderDate).toLocaleString()}` : 'Set a reminder'}
                                                    >
                                                        <BellIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={referral.status}
                                                        onChange={(e) => handleStatusChange(referral.id, e.target.value as ReferralStatus)}
                                                        disabled={updatingId === referral.id}
                                                        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                    >
                                                        {Object.values(ReferralStatus).map(status => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <TopReferrers referrers={topReferrers} />
                    </div>
                </div>
            </div>
            {reminderModalReferral && (
                <ReminderModal
                    referral={reminderModalReferral}
                    onClose={() => setReminderModalReferral(null)}
                    onSave={handleSetReminder}
                />
            )}
            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                title={confirmModalState.title}
                message={confirmModalState.message}
                onConfirm={confirmModalState.onConfirm}
                onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                confirmText="Yes, Proceed"
            />
        </div>
    );
};

export default AdminPage;
