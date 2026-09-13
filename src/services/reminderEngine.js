import { getReminders } from '../api/reports';
import {
  cancelAllReminderNotifications,
  ensureAndroidChannel,
  requestNotificationPermission,
  scheduleReminderNotification,
} from './notifications';

// Pulls the backend's computed due-dates (single source of truth — see agritrack.Sp_GetDueReminders)
// and (re)schedules one local notification per reminder so the farmer is alerted even with the app closed.
// Call this after login, after logging an activity, and after advancing a crop cycle's stage.
//
// Reminder DATA always loads regardless of notification permission/support (e.g. on web, where
// expo-notifications is a no-op) — only the OS-level notification scheduling is skipped when
// permission isn't granted or the platform doesn't support it. Dashboard/Reminders screens must
// keep working even when nothing can be scheduled.
export async function syncReminderNotifications(strings) {
  const reminders = await getReminders();

  const granted = await requestNotificationPermission();
  if (!granted) {
    return reminders;
  }

  await ensureAndroidChannel();
  await cancelAllReminderNotifications();

  const all = [...reminders.today, ...reminders.upcoming];
  for (const reminder of all) {
    const isWater = reminder.reminderType === 'Water';
    const body = isWater
      ? strings.water(reminder.fieldName, reminder.cropTypeName)
      : strings.pesticide(reminder.fieldName, reminder.cropTypeName);

    await scheduleReminderNotification({
      id: `${reminder.cropCycleId}-${reminder.reminderType}`,
      title: strings.title,
      body,
      dueDate: reminder.dueDate,
    });
  }

  return reminders;
}
