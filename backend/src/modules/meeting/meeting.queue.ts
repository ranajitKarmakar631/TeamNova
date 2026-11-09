import { Queue } from "bullmq";
import { getRedisConfig } from "../../config/redis.config";

export const MEETING_REMINDER_QUEUE_NAME = "meeting-reminder-queue";

export enum MeetingReminderType {
  DAILY = "DAILY",
  MINUTES_15 = "MINUTES_15",
  MINUTES_5 = "MINUTES_5",
  START = "START",
}

export interface MeetingReminderJobData {
  meetingId: string;
  workspaceId: string;
  scheduleVersion: number;
  reminderType: MeetingReminderType;
}

const redisConfig = getRedisConfig();

export const meetingReminderQueue = new Queue(MEETING_REMINDER_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 500,
    },
    removeOnFail: {
      count: 1000,
    },
  },
});

meetingReminderQueue.on("error", (err: Error) => {
  console.error("[Meeting Reminder Queue] Error:", err.message);
});

export const scheduleMeetingReminders = async (meeting: {
  _id: any;
  workspaceId: any;
  startAt: Date;
  scheduleVersion: number;
  reminderSettings?: {
    dailyReminder?: boolean;
    fifteenMinutesBefore?: boolean;
    fiveMinutesBefore?: boolean;
    meetingStartNotification?: boolean;
  };
}) => {
  const meetingId = meeting._id.toString();
  const workspaceId = meeting.workspaceId.toString();
  const scheduleVersion = meeting.scheduleVersion;
  const startTime = new Date(meeting.startAt).getTime();
  const now = Date.now();

  const settings = meeting.reminderSettings || {
    dailyReminder: true,
    fifteenMinutesBefore: true,
    fiveMinutesBefore: true,
    meetingStartNotification: true,
  };

  // Helper to schedule delayed job if scheduled time is in the future
  const scheduleJob = async (
    type: MeetingReminderType,
    fireTime: number
  ) => {
    const delay = fireTime - now;
    if (delay <= 0) {
      // Past-due, skip scheduling
      return;
    }

    const jobId = `meeting:${meetingId}:v${scheduleVersion}:${type}`;
    const data: MeetingReminderJobData = {
      meetingId,
      workspaceId,
      scheduleVersion,
      reminderType: type,
    };

    try {
      await meetingReminderQueue.add(type, data, {
        jobId,
        delay,
      });
    } catch (err: any) {
      console.warn(`[Meeting Reminder] Could not queue job ${jobId}:`, err.message);
    }
  };

  // 1. Daily reminder (24 hours before)
  if (settings.dailyReminder) {
    const dailyTime = startTime - 24 * 60 * 60 * 1000;
    await scheduleJob(MeetingReminderType.DAILY, dailyTime);
  }

  // 2. 15 minutes before
  if (settings.fifteenMinutesBefore) {
    const m15Time = startTime - 15 * 60 * 1000;
    await scheduleJob(MeetingReminderType.MINUTES_15, m15Time);
  }

  // 3. 5 minutes before
  if (settings.fiveMinutesBefore) {
    const m5Time = startTime - 5 * 60 * 1000;
    await scheduleJob(MeetingReminderType.MINUTES_5, m5Time);
  }

  // 4. Meeting start
  if (settings.meetingStartNotification) {
    await scheduleJob(MeetingReminderType.START, startTime);
  }
};

export const cancelMeetingReminderJobs = async (
  meetingId: string,
  scheduleVersion: number
) => {
  const reminderTypes = [
    MeetingReminderType.DAILY,
    MeetingReminderType.MINUTES_15,
    MeetingReminderType.MINUTES_5,
    MeetingReminderType.START,
  ];

  for (const type of reminderTypes) {
    const jobId = `meeting:${meetingId}:v${scheduleVersion}:${type}`;
    try {
      const job = await meetingReminderQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      // Ignore if job doesn't exist
    }
  }
};

export const closeMeetingReminderQueue = async (): Promise<void> => {
  try {
    await meetingReminderQueue.close();
    console.log("[Meeting Reminder Queue] Closed successfully");
  } catch (error) {
    console.error("[Meeting Reminder Queue] Failed to close:", error);
  }
};

