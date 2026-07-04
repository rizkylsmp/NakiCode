export type HeaderProfile = {
  type: "admin" | "user";
  username: string;
};

export type HeaderNavItem = {
  label: string;
  href: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedOrderId: number | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
};
