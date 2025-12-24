'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  Building2,
  Save,
  Key,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('profile');

  const handleSave = (section: string) => {
    setSaved(true);
    alert(`${section} settings saved successfully!`);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your warehouse system preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: User, label: 'Profile', id: 'profile' },
                { icon: Building2, label: 'Company', id: 'company' },
                { icon: Bell, label: 'Notifications', id: 'notifications' },
                { icon: Shield, label: 'Security', id: 'security' },
                { icon: Palette, label: 'Appearance', id: 'appearance' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          {activeSection === 'profile' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-700" />
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" defaultValue="User" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex gap-2">
                  <Mail className="mt-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@glampack.com"
                    defaultValue="admin@glampack.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Phone className="mt-2.5 h-4 w-4 text-slate-400" />
                  <Input id="phone" placeholder="+233 XX XXX XXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" defaultValue="manager">
                  <option value="admin">Administrator</option>
                  <option value="manager">Warehouse Manager</option>
                  <option value="staff">Staff</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
              <Button onClick={() => handleSave('Profile')} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Company Settings */}
          {activeSection === 'company' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-700" />
                <div>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="GlamPack Manufacturing" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input id="address" placeholder="Accra, Ghana" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select id="industry" defaultValue="manufacturing">
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="distribution">Distribution</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees">Number of Employees</Label>
                  <Select id="employees" defaultValue="50-100">
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="50-100">50-100</option>
                    <option value="100+">100+</option>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleSave('Company')} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Company Info
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-700" />
                <div>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: 'Low Stock Alerts',
                  description: 'Get notified when inventory is low',
                  enabled: true,
                },
                {
                  label: 'New Transfers',
                  description: 'Notifications for stock transfers',
                  enabled: true,
                },
                {
                  label: 'Delivery Updates',
                  description: 'Status changes for deliveries',
                  enabled: false,
                },
                {
                  label: 'Manufacturing Orders',
                  description: 'Production order notifications',
                  enabled: true,
                },
              ].map((notification, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{notification.label}</p>
                    <p className="text-sm text-slate-500">{notification.description}</p>
                  </div>
                  <Badge variant={notification.enabled ? 'success' : 'secondary'}>
                    {notification.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
              <Button onClick={() => handleSave('Notifications')} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Security */}
          {activeSection === 'security' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-700" />
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="flex gap-2">
                  <Key className="mt-2.5 h-4 w-4 text-slate-400" />
                  <Input id="currentPassword" type="password" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="flex gap-2">
                  <Key className="mt-2.5 h-4 w-4 text-slate-400" />
                  <Input id="newPassword" type="password" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="flex gap-2">
                  <Key className="mt-2.5 h-4 w-4 text-slate-400" />
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              <Button onClick={() => handleSave('Password')} variant="destructive" className="w-full gap-2">
                <Shield className="h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-slate-700" />
                <div>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select id="theme" defaultValue="light">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select id="fontSize" defaultValue="medium">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Current Theme</h3>
                <p className="text-sm text-slate-500 mb-3">Slate monochromatic design system</p>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded bg-slate-900"></div>
                  <div className="h-10 w-10 rounded bg-slate-700"></div>
                  <div className="h-10 w-10 rounded bg-slate-500"></div>
                  <div className="h-10 w-10 rounded bg-slate-300"></div>
                  <div className="h-10 w-10 rounded bg-slate-100"></div>
                </div>
              </div>
              <Button onClick={() => handleSave('Appearance')} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Appearance
              </Button>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
