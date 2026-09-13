import { Platform } from 'react-native';

// expo-notifications has no working implementation in a plain mobile browser tab (no
// service worker/push setup, no background delivery) — every call here is a safe no-op on
// web instead of throwing, so reminder data can still load/save while notifications are
// simply skipped. Native iOS/Android keep full local scheduling.
const isWeb = Platform.OS === 'web';

let Notifications = null;
if (!isWeb) {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function requestNotificationPermission() {
  if (isWeb) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllReminderNotifications() {
  if (isWeb) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// One notification per due reminder, fired at 7am on its due date (or immediately if already overdue).
export async function scheduleReminderNotification({ id, title, body, dueDate }) {
  if (isWeb) return;
  const trigger = buildTrigger(dueDate);
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger,
  });
}

function buildTrigger(dueDateIso) {
  const due = new Date(dueDateIso);
  const now = new Date();
  const fireAt = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 7, 0, 0);

  if (fireAt <= now) {
    // Already due (or overdue) — fire shortly after the app schedules it rather than in the past.
    return { seconds: 5, channelId: Platform.OS === 'android' ? 'reminders' : undefined };
  }
  return { date: fireAt, channelId: Platform.OS === 'android' ? 'reminders' : undefined };
}

export async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Farm reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
