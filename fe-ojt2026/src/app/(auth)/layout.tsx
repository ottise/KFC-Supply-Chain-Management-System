"use client";

import React from 'react';
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Left Side: Branding (Hidden on mobile) */}
            <Link href="/" className="hidden lg:flex lg:w-[40%] bg-[#E4002B] relative items-center justify-center overflow-hidden border-r border-red-800">
                <img
                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80"
                    className="absolute inset-0 object-cover w-full h-full opacity-40 mix-blend-overlay"
                    alt="Branding"
                />
                <div className="relative z-10 text-white p-16 w-full">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg"
                        className="w-24 mb-8"
                        alt="KFC Logo"
                    />
                    <h1 className="text-4xl font-bold mb-4 leading-tight uppercase tracking-tighter">
                        KFC SCM <br /> Việt Nam
                    </h1>
                    <div className="h-1.5 w-20 bg-white mb-8"></div>
                    <p className="text-xl opacity-80 font-light italic">Hệ thống quản lý chuỗi cung ứng.</p>
                </div>
            </Link>

            {/* Right Side: Form Content */}
            <div className="w-full lg:w-[60%] flex items-center justify-center p-8 md:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
