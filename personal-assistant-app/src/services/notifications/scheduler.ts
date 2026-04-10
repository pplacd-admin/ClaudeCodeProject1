import * as Notifications from 'expo-notifications';

export async function scheduleAllNotifications() {
  // Cancel existing to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  // Helper: schedule at HH:MM daily
  const scheduleDaily = async (hour: number, minute: number, title: string, body: string, id: string) => {
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);
    if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as any,
    });
  };

  await scheduleDaily(7, 0, '🌅 Morning Briefing', 'Your daily briefing is ready. Start strong!', 'morning-brief');
  await scheduleDaily(9, 0, '🧠 Micro-Lesson Time', '5 minutes to sharpen your AI knowledge', 'micro-lesson-1');
  await scheduleDaily(11, 0, '🧠 Micro-Lesson + Quiz', 'Time for a lesson and quick quiz!', 'micro-lesson-2');
  await scheduleDaily(13, 0, '🧠 Micro-Lesson Time', 'Afternoon AI insight waiting for you', 'micro-lesson-3');
  await scheduleDaily(15, 0, '📧 Inbox Check', 'How close are you to inbox zero?', 'inbox-nudge');
  await scheduleDaily(15, 30, '🧠 Quiz Time', 'Test your knowledge before EOD', 'quiz-reminder');
  await scheduleDaily(16, 45, '🔔 Log-Off Reminder', 'Time to wrap up! Review your day.', 'logoff-reminder');
}
