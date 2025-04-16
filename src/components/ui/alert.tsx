import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export function Alert({ children, variant = 'default' }: AlertProps) {
  const variantStyles = {
    default: 'bg-gray-100 border-gray-300 text-gray-700',
    destructive: 'bg-red-100 border-red-300 text-red-700',
  };

  return (
    <div
      className={`p-4 rounded-md border ${variantStyles[variant]} flex gap-2 items-start`}
      role="alert"
    >
      {children}
    </div>
  );
}

export function AlertCircle({ className }: { className?: string }) {
  return <FiAlertCircle className={className} />;
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <h5 className="font-medium text-sm">{children}</h5>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm opacity-90">{children}</div>;
}

export type { AlertProps }; 