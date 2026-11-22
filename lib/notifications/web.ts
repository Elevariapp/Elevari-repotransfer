export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l([...this.notifications]));
  }

  getAll(): Notification[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  add(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotification);
    this.emit();
    return id;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.emit();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => {
      n.read = true;
    });
    this.emit();
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.emit();
  }

  clear() {
    this.notifications = [];
    this.emit();
  }
}

export const notificationService = new NotificationService();