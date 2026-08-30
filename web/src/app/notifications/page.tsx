import { NotificationsList } from '@/modules/notifications/components/NotificationsList';

// Page de notifications (US-20 / US-21) — reste fine, comme les autres pages.
export default function NotificationsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <NotificationsList />
    </main>
  );
}
