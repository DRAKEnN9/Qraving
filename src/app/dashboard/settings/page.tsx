'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Store,
  Bell,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Save,
  Check,
  X,
} from 'lucide-react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Settings {
  notifications: {
    orderReceived: boolean;
    orderCompleted: boolean;
    dailySummary: boolean;
  };

  /* --- Team management helpers (moved below) ---
  const fetchTeam = async () => {
    try {
      setTeamLoading(true);
      setTeamError('');
      const token = localStorage.getItem('token');
      // fetch my role
      const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const me = await meRes.json().catch(() => ({}));
      const accRole = me?.user?.accountRole || me?.user?.role;
      if (accRole === 'owner' || accRole === 'admin') setMyRole(accRole);
      // fetch members
      const res = await fetch('/api/account/members', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load members');
      setMembers(data.members || []);
    } catch (e: any) {
      setTeamError(e.message || 'Failed to load members');
    } finally {
      setTeamLoading(false);
    }
  };

  const sendInvite = async () => {
    try {
      setInviting(true);
      setLastInviteLink('');
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/account/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite');
      setInviteEmail('');
      setLastInviteLink(data.inviteLink || '');
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const regenerateInvite = async (memberId: string, email: string, role: 'owner' | 'admin') => {
    try {
      setSavingMemberId(memberId);
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/account/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invite');
      setLastInviteLink(data.inviteLink || '');
      await fetchTeam();
      // Optionally place the link on clipboard automatically
      try { await navigator.clipboard?.writeText(String(data.inviteLink || '')); } catch {}
    } catch (e: any) {
      setTeamError(e.message || 'Failed to generate invite');
    } finally {
      setSavingMemberId('');
    }
  };

  const updateMemberRole = async (memberId: string, role: 'owner' | 'admin') => {
    try {
      setSavingMemberId(memberId);
      setTeamError('');
      const token = localStorage.getItem('token');
      // Require password for any role change
      const currentPassword: string | undefined = window.prompt('Enter your current password to confirm role change') || undefined;
      if (!currentPassword) {
        setTeamError('Role change cancelled: password required');
        return;
      }
      const res = await fetch('/api/account/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ memberId, role, currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message || 'Failed to update role');
    } finally {
      setSavingMemberId('');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      setSavingMemberId(memberId);
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/account/members?memberId=${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message || 'Failed to remove member');
    } finally {
      setSavingMemberId('');
    }
  };

  */
  restaurant: {
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    timezone: string;
    openingHours: string;
  };
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'restaurant' | 'notifications' | 'team'>(
    'restaurant'
  );
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      orderReceived: true,
      orderCompleted: true,
      dailySummary: true,
    },
    restaurant: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      openingHours: '9:00 AM - 10:00 PM',
    },
  });
  const [saveMessage, setSaveMessage] = useState('');

  // Team management state
  type Member = {
    _id: string;
    email: string;
    role: 'owner' | 'admin';
    status: 'invited' | 'active';
    invitedAt?: string;
    acceptedAt?: string;
  };
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin'>('admin');
  const [inviting, setInviting] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState('');
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [myRole, setMyRole] = useState<'owner' | 'admin'>('admin');
  // Role change modal state
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    memberId: string;
    role: 'owner' | 'admin';
  } | null>(null);
  const [rolePassword, setRolePassword] = useState('');
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Initialize tab from URL (?tab=...)
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'restaurant' ||
      tabParam === 'notifications' ||
      tabParam === 'team'
    ) {
      setActiveTab(tabParam);
    }

    fetchSettings();
  }, [router, searchParams]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      if (data.restaurants && data.restaurants.length > 0) {
        const restaurant = data.restaurants[0];
        setRestaurantId(restaurant._id);
        setSettings((prev) => ({
          ...prev,
          restaurant: {
            name: restaurant.name || '',
            description: restaurant.description || '',
            address: restaurant.address || '',
            phone: restaurant.phone || restaurant.contactPhone || '',
            email: restaurant.email || restaurant.primaryEmail || '',
            currency: restaurant.settings?.currency || 'INR',
            timezone: restaurant.settings?.timezone || 'Asia/Kolkata',
            openingHours: restaurant.settings?.openingHours || '9:00 AM - 10:00 PM',
          },
        }));
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/owner/restaurant/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          settings: settings.restaurant,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveMessage(err.message || 'Failed to save settings');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateRestaurantField = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      restaurant: {
        ...prev.restaurant,
        [field]: value,
      },
    }));
  };

  const toggleNotification = (field: keyof Settings['notifications']) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field],
      },
    }));
  };

  // Team management helpers (inside component)
  const fetchTeam = async () => {
    try {
      setTeamLoading(true);
      setTeamError('');
      const token = localStorage.getItem('token');
      
      console.log('Fetching team data...');
      
      // fetch my role
      const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      console.log('Auth response status:', meRes.status);
      
      if (!meRes.ok) {
        throw new Error(`Authentication failed (${meRes.status})`);
      }
      
      const me = await meRes.json().catch(() => ({}));
      console.log('User data:', me);
      
      const accRole = me?.user?.accountRole || me?.user?.role;
      if (accRole === 'owner' || accRole === 'admin') setMyRole(accRole);
      
      // fetch members
      const res = await fetch('/api/account/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Members response status:', res.status);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to load members (${res.status})`);
      
      console.log('Members data:', data);
      setMembers(data.members || []);
    } catch (e: any) {
      console.error('Team fetch error:', e);
      setTeamError(e.message || 'Failed to load members');
    } finally {
      setTeamLoading(false);
    }
  };

  const sendInvite = async () => {
    try {
      setInviting(true);
      setLastInviteLink('');
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/account/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite');
      setInviteEmail('');
      setLastInviteLink(data.inviteLink || '');
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const regenerateInvite = async (memberId: string, email: string, role: 'owner' | 'admin') => {
    try {
      setSavingMemberId(memberId);
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/account/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invite');
      setLastInviteLink(data.inviteLink || '');
      await fetchTeam();
      try {
        await navigator.clipboard?.writeText(String(data.inviteLink || ''));
      } catch {}
    } catch (e: any) {
      setTeamError(e.message || 'Failed to generate invite');
    } finally {
      setSavingMemberId('');
    }
  };

  const updateMemberRole = (memberId: string, role: 'owner' | 'admin') => {
    if (myRole !== 'owner') return;
    setSavingMemberId(memberId);
    setRoleChangeTarget({ memberId, role });
    setRolePassword('');
    setRoleError('');
  };

  const confirmMemberRoleChange = async () => {
    if (!roleChangeTarget) return;
    if (!rolePassword) {
      setRoleError('Current password is required');
      return;
    }
    try {
      setRoleSubmitting(true);
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/account/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberId: roleChangeTarget.memberId,
          role: roleChangeTarget.role,
          currentPassword: rolePassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setRoleChangeTarget(null);
      setSavingMemberId('');
      await fetchTeam();
    } catch (e: any) {
      setRoleError(e.message || 'Failed to update role');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const cancelMemberRoleChange = async () => {
    setRoleChangeTarget(null);
    setSavingMemberId('');
    setRolePassword('');
    setRoleError('');
    // Refresh to revert any transient UI selection
    try {
      await fetchTeam();
    } catch {}
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      setSavingMemberId(memberId);
      setTeamError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/account/members?memberId=${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      await fetchTeam();
    } catch (e: any) {
      setTeamError(e.message || 'Failed to remove member');
    } finally {
      setSavingMemberId('');
    }
  };

  useEffect(() => {
    if (activeTab === 'team') fetchTeam();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'restaurant' as const, label: 'Restaurant Profile', icon: Store },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'team' as const, label: 'Team & Access', icon: Users },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your restaurant settings and preferences
          </p>
        </div>
        {/* Theme Toggle */}
        <div className="flex items-center gap-2">
          <span className="mr-1 hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:inline">
            Theme: {theme}
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-3 py-2 ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-label="Use light theme"
            >
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 border-l border-slate-200 px-3 py-2 dark:border-slate-800 ${
                theme === 'dark'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-label="Use dark theme"
            >
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex items-center gap-2 border-l border-slate-200 px-3 py-2 dark:border-slate-800 ${
                theme === 'system'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              aria-label="Use system theme"
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-6 rounded-lg p-4 ${saveMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          <div className="flex items-center gap-2">
            {saveMessage.includes('success') ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span className="font-medium">{saveMessage}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex min-w-max gap-2 border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.replace(`/dashboard/settings?tab=${tab.id}`);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:p-6">
        {/* Restaurant Profile Tab */}
        {activeTab === 'restaurant' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                Restaurant Information
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Restaurant Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={settings.restaurant.name}
                      onChange={(e) => updateRestaurantField('name', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Your Restaurant Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={settings.restaurant.email}
                      onChange={(e) => updateRestaurantField('email', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="contact@restaurant.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={settings.restaurant.phone}
                      onChange={(e) => updateRestaurantField('phone', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Currency
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                      value={settings.restaurant.currency}
                      onChange={(e) => updateRestaurantField('currency', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <textarea
                      value={settings.restaurant.address}
                      onChange={(e) => updateRestaurantField('address', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="123 Main Street, City, State, ZIP"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={settings.restaurant.description}
                    onChange={(e) => updateRestaurantField('description', e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Tell customers about your restaurant..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Opening Hours
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={settings.restaurant.openingHours}
                      onChange={(e) => updateRestaurantField('openingHours', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="9:00 AM - 10:00 PM"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Timezone
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                      value={settings.restaurant.timezone}
                      onChange={(e) => updateRestaurantField('timezone', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 p-4 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Notification channels have been disabled. All notifications will be handled through the web interface.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                Notification Events
              </h2>
              <div className="space-y-4">
                {[
                  {
                    key: 'orderReceived' as const,
                    label: 'New Order Received',
                    description: 'Get notified when a customer places an order',
                  },
                  {
                    key: 'orderCompleted' as const,
                    label: 'Order Completed',
                    description: 'Get notified when you mark an order as completed',
                  },
                  {
                    key: 'dailySummary' as const,
                    label: 'Daily Summary',
                    description: 'Receive a daily summary of orders and revenue',
                  },
                ].map((event) => (
                  <div
                    key={event.key}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {event.label}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {event.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleNotification(event.key)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        settings.notifications[event.key] ? 'bg-emerald-600' : 'bg-slate-300'
                      } sm:ml-4`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notifications[event.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-6 md:grid md:grid-cols-3">
              {/* Members List */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
                  {teamLoading && <span className="text-xs text-slate-500">Refreshing…</span>}
                </div>
                {teamError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {teamError}
                  </div>
                )}
                {members.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-600">
                    No members yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m._id} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-slate-800">{m.email}</td>
                            <td className="px-3 py-2">
                              <select
                                className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={m.role}
                                onChange={(e) =>
                                  updateMemberRole(m._id, e.target.value as 'owner' | 'admin')
                                }
                                disabled={savingMemberId === m._id || myRole !== 'owner'}
                              >
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="space-x-2 px-3 py-2">
                              {m.status === 'invited' && (
                                <button
                                  onClick={() => regenerateInvite(m._id, m.email, m.role)}
                                  className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                  disabled={savingMemberId === m._id || myRole !== 'owner'}
                                >
                                  Copy Invite Link
                                </button>
                              )}
                              <button
                                onClick={() => removeMember(m._id)}
                                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                                disabled={savingMemberId === m._id || myRole !== 'owner'}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invite Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Invite Member
                </h2>
                {myRole !== 'owner' && (
                  <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    Only the owner can invite members.
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={myRole !== 'owner'}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Role
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin')}
                      disabled={myRole !== 'owner'}
                    >
                      <option value="admin">Admin (limited access)</option>
                      <option value="owner">Owner (full access)</option>
                    </select>
                  </div>
                  <button
                    onClick={sendInvite}
                    disabled={inviting || myRole !== 'owner'}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {inviting ? 'Inviting…' : 'Send Invite'}
                  </button>

                  {lastInviteLink && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <p className="font-semibold">Invite Link</p>
                      <div className="mt-1 break-all text-xs">{lastInviteLink}</div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(lastInviteLink)}
                        className="mt-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Confirm Role Change
            </h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Changing member role to{' '}
              <span className="font-semibold capitalize">{roleChangeTarget.role}</span> requires the
              owner's current password.
            </p>
            {roleError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {roleError}
              </div>
            )}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                type="password"
                value={rolePassword}
                onChange={(e) => setRolePassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter current password"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelMemberRoleChange}
                disabled={roleSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmMemberRoleChange}
                disabled={roleSubmitting || !rolePassword}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {roleSubmitting ? 'Updating…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 sm:flex sm:justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:ml-auto sm:w-auto"
        >
          {saving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
