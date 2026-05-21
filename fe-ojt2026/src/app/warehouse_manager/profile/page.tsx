"use client";
import React, { useState } from 'react';
import WarehouseManagerProfileForm from '@/components/warehouse_manager/profile/WarehouseManagerProfileForm';
import Link from 'next/dist/client/link';

import { useAuthContext } from '@/lib/contexts/AuthContext';
import { userApi } from '@/lib/api/userApi';
import { useToast } from '@/components/ui/ToastProvider';

interface WarehouseManagerProfile {
    fullName: string;
    phoneNumber: string;
    email: string;
    role: string;
}

export default function WarehouseManagerProfilePage() {
    const { user, updateUser } = useAuthContext();
    const [isLoading, setIsLoading] = useState(false);
    const { error: showError } = useToast();

    // Initial data mapped from current user context
    const profileData: WarehouseManagerProfile = {
        fullName: user?.fullname || '',
        phoneNumber: user?.phone || '',
        email: user?.email || '',
        role: 'Warehouse Manager', // Display role mapping handled by component
    };

    const handleProfileSubmit = async (data: WarehouseManagerProfile) => {
        if (!user || (!user.id && !('nameid' in user))) return;

        setIsLoading(true);
        try {
            // Strip non-digit characters from phone (formatPhoneNumber adds spaces for display)
            const rawPhone = data.phoneNumber.replace(/[^\d+]/g, '');
            const updatePayload = {
                fullname: data.fullName.trim(),
                phone: rawPhone,
            };

            const userId = user.id || (user as { nameid?: string }).nameid;
            if (!userId) return;
            await userApi.updateProfile(userId, updatePayload);

            // Update local context with display-friendly values
            updateUser({
                fullname: updatePayload.fullname,
                phone: updatePayload.phone
            });

        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            const err = error as { response?: { data?: { Message?: string; message?: string } } };
            const message = err.response?.data?.Message || err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ cá nhân.';
            showError("Lỗi cập nhật", message);
            throw error; // Re-throw so form component knows submission failed
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 relative">

                {/* Back button - góc trái */}
                <Link
                    href="/warehouse_manager"
                    className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-semibold">Quay lại</span>
                </Link>

                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#E4002B] to-[#B8001F] flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
                    </div>
                    <p className="text-gray-600">Cập nhật thông tin tài khoản của bạn</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto p-6">
                <WarehouseManagerProfileForm
                    key={user?.id || (user as { nameid?: string })?.nameid || 'loading'}
                    initialData={profileData}
                    onSubmit={handleProfileSubmit}
                    isLoading={isLoading}
                    userId={user?.id || (user as { nameid?: string })?.nameid}
                />
            </div>
        </div>
    );
}
