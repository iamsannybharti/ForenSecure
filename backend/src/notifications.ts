export type NotificationLike = {
  read?: boolean;
  createdAt?: Date | string;
};

export function sortNotifications<T extends NotificationLike>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!!a.read !== !!b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}
