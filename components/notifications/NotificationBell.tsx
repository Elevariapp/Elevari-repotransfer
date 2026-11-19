'use client';

import { useState } from 'react';
import { notificationService } from '@/lib/notifications/web';
import Button from '@/components/ui/Button';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = notificationService.getUnreadCount();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative p-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18 10c0 1.1-.9 2-2 2h-1c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2s2 .9 2 2v2zM7 8c0-1.1.9-2 2-2s2 .9 2 2v2c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2v1c-1.1 0-2 .9-2 2s-.9-.9-2-2v-1c0-1.1.9-2 2-2V8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-elevari-error text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationCenter open={open} />
    </div>
  );
}