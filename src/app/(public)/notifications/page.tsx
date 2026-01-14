"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  User,
  MessageSquare,
  Heart,
  BookOpen,
  AtSign,
  ArrowLeft,
  Check,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Container } from "@/components/layout/Container";
import { GlassButton } from "@/components/ui/GlassButton";
import { Avatar } from "@/components/ui/Avatar";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationWithDetails,
} from "@/lib/actions/notifications";
import { formatNotificationDisplay } from "@/lib/notifications/format";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - Notifications Page
// ============================================
// Full-page mobile-first notification center
// ============================================

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  comment: MessageSquare,
  reaction: Heart,
  follow: User,
  mention: AtSign,
  post: BookOpen,
};

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

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: NotificationWithDetails;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;
  const router = useRouter();

  const { actorText, messageText } = formatNotificationDisplay({
    actorName: notification.actor?.name,
    actorEmail: notification.actor?.email,
    message: notification.message,
    fallbackMessage: getDefaultMessage(notification.type),
  });

  function handleClick() {
    if (!notification.read) onRead(notification.id);
    if (notification.post?.slug) {
      router.push(`/blog/${notification.post.slug}`);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={cn(
        "flex gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]",
        "border border-foreground/5",
        notification.read
          ? "bg-foreground/5 opacity-70"
          : "bg-king-orange/5 border-king-orange/20 shadow-sm"
      )}
    >
      {/* Actor Avatar or Icon */}
      <div className="flex-shrink-0">
        {notification.actor?.imageUrl ? (
          <Avatar
            src={notification.actor.imageUrl}
            name={notification.actor.name}
            alt={notification.actor.name ?? "User"}
            size={44}
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-king-orange/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-king-orange" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          {actorText && <span className="font-semibold">{actorText} </span>}
          <span className="text-foreground/70">{messageText}</span>
        </p>

        {notification.post?.title && (
          <p className="text-xs text-king-orange mt-1 truncate font-medium">
            {notification.post.title}
          </p>
        )}

        <p className="text-xs text-foreground/50 mt-1.5">
          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col gap-1">
        {!notification.read && (
          <div className="w-2.5 h-2.5 rounded-full bg-king-orange animate-pulse" />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors mt-auto"
          aria-label="Delete notification"
        >
          <Trash2 className="w-3.5 h-3.5 text-foreground/40" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<
    NotificationWithDetails[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getMyNotifications(50);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleRead(id: string) {
    await markAsRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleDelete(id: string) {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen pb-20">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-30 glass-nav">
        <Container className="py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-foreground/10 transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-lg font-bold flex-1 text-center">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="p-2 -mr-2 rounded-full hover:bg-foreground/10 transition-colors active:scale-95"
                aria-label="Mark all as read"
              >
                <Check className="w-5 h-5 text-king-orange" />
              </button>
            )}
            {unreadCount === 0 && <div className="w-9" />}
          </div>
        </Container>
      </div>

      <Container className="py-4">
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-king-orange/10 border border-king-orange/20">
            <p className="text-sm font-medium text-king-orange">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-foreground/5 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-foreground/5 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-foreground/30" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No notifications</h2>
            <p className="text-sm text-foreground/60 mb-6">
              When someone interacts with your content, you&apos;ll see it here.
            </p>
            <GlassButton as="a" href="/" variant="primary">
              Explore Posts
            </GlassButton>
          </div>
        ) : (
          /* Notification List */
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
