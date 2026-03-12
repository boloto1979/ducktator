import React from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
    statusIndicator?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, statusIndicator }) => (
    <div className="bg-[#4a3b32] p-3 flex items-center gap-3 border-b border-[#5d4a3f] sticky top-0 z-10 w-full">
        <img src="/images/duck.png" alt="Duck Logo" className="w-8 h-8 pixelated" />
        <div className="flex-1">
            <div className="flex items-baseline gap-2">
                <h1 className="font-bold text-[#f58e0a] text-lg leading-tight">
                    {title}
                </h1>
                {subtitle && <span className="text-gray-400 font-normal text-xs">{subtitle}</span>}
            </div>
            {statusIndicator}
        </div>
    </div>
);
