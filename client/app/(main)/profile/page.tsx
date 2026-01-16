"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Save, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [savingInfo, setSavingInfo] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        username: "",
        email: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        // Simulate API fetch
        const loadProfile = async () => {
            setTimeout(() => {
                setFormData({
                    username: "jdoe_dev",
                    email: "john.doe@example.com",
                });
                setLoading(false);
            }, 0);
        };
        loadProfile();
    }, []);

    const handleInfoUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingInfo(true);
        // Simulate API call
        setTimeout(() => {
            setSavingInfo(false);
            alert("Profile updated!");
        }, 1000);
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        setSavingPassword(true);
        // Simulate API call
        setTimeout(() => {
            setSavingPassword(false);
            alert("Password updated!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="animate-pulse">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="pb-8 max-w-7xl mx-auto">
            {/* Header Section */}
            {/* Removed flex/items-center to ensure h1 sits at the exact natural top, correcting the "too high" issue caused by vertical centering */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* --- Column 1: General Information --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className="bg-indigo-50 p-3 rounded-lg">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
                                <p className="text-sm text-gray-500">Update your public profile details.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-6 mb-8">
                                {/* Avatar Display - Read Only */}
                                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold border-4 border-white shadow-sm shrink-0">
                                    {formData.username.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="pt-1">
                                    <h3 className="font-medium text-gray-900">Profile Photo</h3>
                                    <p className="text-sm text-gray-500">Default avatar generated from username.</p>
                                </div>
                            </div>

                            <form onSubmit={handleInfoUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={savingInfo}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50"
                                    >
                                        {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- Column 2: Security --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className="bg-orange-50 p-3 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="New password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Confirm password"
                                    />
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg flex gap-2 items-start mt-4">
                                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-gray-500 leading-tight">
                                        Ensure your password is at least 8 characters long and includes a number.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50"
                                    >
                                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}