"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Save, Loader2, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user-service";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Saving States
    const [savingInfo, setSavingInfo] = useState(false);
    const [infoSaveSuccess, setInfoSaveSuccess] = useState(false);

    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);

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

    // Load Profile Data on Mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await userService.getProfile();
                setFormData({
                    username: data.fullName,
                    email: data.email,
                });
            } catch (error) {
                console.error("Failed to load profile", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleInfoUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingInfo(true);
        setInfoSaveSuccess(false);

        try {
            await userService.updateProfile(formData.username, formData.email);

            // Trigger Success Animation
            setInfoSaveSuccess(true);
            setTimeout(() => setInfoSaveSuccess(false), 2000);

        } catch (error) {
            console.error(error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSavingInfo(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }

        setSavingPassword(true);
        setPasswordSaveSuccess(false);

        try {
            await userService.updatePassword(passwordData.currentPassword, passwordData.newPassword);

            // Trigger Success Animation & Clear Form
            setPasswordSaveSuccess(true);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setPasswordSaveSuccess(false), 2000);

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to update password.");
        } finally {
            setSavingPassword(false);
        }
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
        <div className="pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            {/* UPDATED: Stack on mobile (flex-col), row on desktop (sm:flex-row) */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="self-start sm:self-center flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
            </div>

            {/* Grid Layout - Already responsive (grid-cols-1 by default) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Column 1: General Information --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
                                <p className="text-sm text-gray-500">Update your public profile details.</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleInfoUpdate} className="space-y-6">
                                {/* UPDATED: Stack inputs on mobile, side-by-side on desktop */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Display Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                placeholder="jdoe_dev"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingInfo}
                                        className={`w-full sm:w-auto px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-medium shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px] justify-center 
                                            ${infoSaveSuccess
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            }`}
                                    >
                                        {savingInfo ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                            </>
                                        ) : infoSaveSuccess ? (
                                            <>
                                                <Check className="w-4 h-4 animate-in zoom-in duration-200" /> Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" /> Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* --- Column 2: Security --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                                <ShieldCheck className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                            </div>
                        </div>

                        <div className="p-6 flex-1">
                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                            placeholder="New password"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                            placeholder="Confirm password"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingPassword}
                                        className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-medium shadow-sm hover:shadow disabled:opacity-70 
                                            ${passwordSaveSuccess
                                                ? "bg-green-50 border border-green-200 text-green-700"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                    >
                                        {savingPassword ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : passwordSaveSuccess ? (
                                            <>
                                                <Check className="w-4 h-4 animate-in zoom-in duration-200" /> Password Updated
                                            </>
                                        ) : (
                                            "Update Password"
                                        )}
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