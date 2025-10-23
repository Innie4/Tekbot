'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/glass-input';
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Filter,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/api-client';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateUserDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  status: 'active' | 'inactive';
};

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<CreateUserDto>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<any>('/users');
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setUsers(items as User[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const createdUser = await api.post<User>('/users', newUser);
      setUsers([...users, createdUser]);
      setShowAddModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
      setShowActionMenu(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleUpdateUserStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      const updatedUser = await api.patch<User>(`/users/${id}`, { status });
      setUsers(users.map((u) => (u.id === id ? updatedUser : u)));
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(
    (user) =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastActive = (lastLoginAt?: string) => {
    if (!lastLoginAt) return 'Never';
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </Button>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button
          className="glass-button-effect"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="border rounded px-3 py-2 w-full"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="border rounded px-3 py-2 w-full"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                className="border rounded px-3 py-2 w-full"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="border rounded px-3 py-2 w-full"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
              <select
                className="border rounded px-3 py-2 w-full"
                value={newUser.status}
                onChange={(e) =>
                  setNewUser({ ...newUser, status: e.target.value as 'active' | 'inactive' })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Add</Button>
            </div>
          </div>
        </div>
      )}

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <GlassInput
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/10">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Email
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Role
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Last Active
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan flex items-center justify-center text-xs font-medium">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-white/10 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatLastActive(user.lastLoginAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowActionMenu(user.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {/* Actions Dropdown */}
                      {showActionMenu === user.id && (
                        <div className="absolute right-0 mt-2 bg-white rounded shadow z-10">
                          <button
                            className="block px-4 py-2 w-full text-left hover:bg-gray-100"
                            onClick={() => alert('Edit user coming soon!')}
                          >
                            Edit
                          </button>
                          <button
                            className="block px-4 py-2 w-full text-left hover:bg-gray-100 text-red-600"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
