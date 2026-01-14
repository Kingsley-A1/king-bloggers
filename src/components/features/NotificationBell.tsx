"use client";

import * as React from "react";
import {
  Bell,
  User,
  MessageSquare,
  Heart,
  BookOpen,
  AtSign,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  type NotificationWithDetails,
} from "@/lib/actions/notifications";
import { formatNotificationDisplay } from "@/lib/notifications/format";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS V2 - Notification Bell
// ============================================
// Real-time alerts with glass dropdown
// ============================================

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  comment: MessageSquare,
  reaction: Heart,
  follow: User,
  mention: AtSign,
  post: BookOpen,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: NotificationWithDetails;
  onRead: (id: string) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;

  const { actorText, messageText } = formatNotificationDisplay({
    actorName: notification.actor?.name,
    actorEmail: notification.actor?.email,
    message: notification.message,
    fallbackMessage: getDefaultMessage(notification.type),
  });

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors",
        notification.read ? "opacity-60" : "bg-white/5 hover:bg-white/10"
      )}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-king-orange/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-king-orange" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          {actorText && (
            <span className="font-semibold text-foreground">{actorText}</span>
          )}{" "}
          <span className="text-foreground/70">{messageText}</span>
        </div>
        {notification.post?.title && (
          <Link
            href={`/blog/${notification.post.slug}`}
            className="text-xs text-king-orange hover:underline truncate block"
          >
            {notification.post.title}
          </Link>
        )}
        <div className="text-xs text-foreground/50 mt-1">
          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
        </div>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 rounded-full bg-king-orange" />
        </div>
      )}
    </div>
  );
}

function getDefaultMessage(type: string): string {
  switch (type) {
    case "comment":
      return "commented on your post";
    case "reaction":
      return "reacted to your post";
    case "follow":
      return "started following you";
    case "mention":
      return "mentioned you";
    case "post":
      return "published a new post";
    default:
      return "interacted with you";
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    NotificationWithDetails[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Load notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getMyNotifications(10)
        .then(setNotifications)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Poll for unread count
  React.useEffect(() => {
    const loadCount = () => getUnreadCount().then(setUnreadCount);
    loadCount();
    const interval = setInterval(loadCount, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRead(id: string) {
    await markAsRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-all",
          "hover:bg-white/10 active:scale-95",
          isOpen && "bg-white/10"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto",
            "glass-card rounded-xl shadow-2xl z-50",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-king-orange hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-foreground/50">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-foreground/50">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={handleRead}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
