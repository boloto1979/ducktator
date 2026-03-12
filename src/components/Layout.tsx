import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-[#2b2a2a] text-gray-200 font-sans text-sm selection:bg-[#f58e0a] selection:text-white ${className}`}>
        {children}
    </div>
);
