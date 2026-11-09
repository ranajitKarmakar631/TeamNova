import { Worker, Job } from "bullmq";
import { getRedisConfig } from "../../config/redis.config";
import {
  MEETING_REMINDER_QUEUE_NAME,
  MeetingReminderJobData,
  MeetingReminderType,
} from "./meeting.queue";
import MeetingModel from "./meeting.model";
import MeetingParticipantModel from "./meeting-participant.model";
import { InvitationStatus, MeetingStatus } from "./meeting.enum";
import {
  notificationService,
  NotificationPriorityEnum,
  NotificationTypeEnum,
} from "../notification";
import { getIO } from "../chats/socket/socket.instance";

let meetingWorker: Worker | null = null;

export const initMeetingWorker = (): void => {
  if (meetingWorker) {
    console.log("[Meeting Worker] Already initialized");
    return;
  }

  const redisConfig = getRedisConfig();

  meetingWorker = new Worker(
    MEETING_REMINDER_QUEUE_NAME,
    async (job: Job<MeetingReminderJobData>) => {
      const { meetingId, workspaceId, scheduleVersion, reminderType } = job.data;

      const meeting = await MeetingModel.findById(meetingId);
      if (!meeting) {
        return;
      }

      // 1. Guard against outdated schedule versions
      if (meeting.scheduleVersion !== scheduleVersion) {
        return;
      }

      // 2. Guard against cancelled or completed meetings
      if (
        meeting.status === MeetingStatus.CANCELLED ||
        meeting.status === MeetingStatus.COMPLETED
      ) {
        return;
      }

      // If START reminder, update status to IN_PROGRESS if still SCHEDULED
      if (reminderType === MeetingReminderType.START && meeting.status === MeetingStatus.SCHEDULED) {
        meeting.status = MeetingStatus.IN_PROGRESS;
        await meeting.save();
      }

      // 3. Find participants (exclude declined members)
      const participants = await MeetingParticipantModel.find({
        meetingId: meeting._id,
        invitationStatus: { $ne: InvitationStatus.DECLINED },
      }).select("userId");

      const recipientIds = participants.map((p) => p.userId.toString());
      if (recipientIds.length === 0) {
        return;
      }

      // 4. Construct notification content
      let title = "";
      let message = "";
      let priority = NotificationPriorityEnum.MEDIUM;

      switch (reminderType) {
        case MeetingReminderType.DAILY:
          title = `Meeting Reminder: ${meeting.title}`;
          message = `You have a scheduled meeting tomorrow: "${meeting.title}" at ${new Date(
            meeting.startAt
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${meeting.timezone}).`;
          priority = NotificationPriorityEnum.MEDIUM;
          break;

        case MeetingReminderType.MINUTES_15:
          title = `Starting in 15 Minutes: ${meeting.title}`;
          message = `Your meeting "${meeting.title}" starts in 15 minutes. Prepare your notes or join early!`;
          priority = NotificationPriorityEnum.HIGH;
          break;

        case MeetingReminderType.MINUTES_5:
          title = `Starting in 5 Minutes: ${meeting.title}`;
          message = `Your meeting "${meeting.title}" is starting in 5 minutes!`;
          priority = NotificationPriorityEnum.URGENT;
          break;

        case MeetingReminderType.START:
          title = `Meeting Starting Now: ${meeting.title}`;
          message = `The meeting "${meeting.title}" is now in progress. Click to join.`;
          priority = NotificationPriorityEnum.URGENT;
          break;
      }

      // 5. Send bulk notifications via Notification Service
      try {
        await notificationService.queueBulkNotifications({
          recipients: recipientIds,
          sender: meeting.organizerId.toString(),
          workspaceId,
          type:
            reminderType === MeetingReminderType.START
              ? NotificationTypeEnum.MEETING_STARTED
              : NotificationTypeEnum.MEETING_REMINDER,
          title,
          message,
          data: {
            meetingId: (meeting._id as any).toString(),
            meetingLink: meeting.meetingLink,
            reminderType,
          },
          priority,
          sendEmail: true,
        });
      } catch (err: any) {
        console.warn("[Meeting Worker] Failed to queue bulk notifications:", err.message);
      }

      // 6. Emit real-time socket event to workspace room
      try {
        const io = getIO();
        if (io) {
          io.to(`workspace:${workspaceId}`).emit("meeting:reminder", {
            meetingId: (meeting._id as any).toString(),
            reminderType,
            title: meeting.title,
            startAt: meeting.startAt,
            meetingLink: meeting.meetingLink,
          });
        }
      } catch (err) {
        // Socket emission failure is non-fatal
      }
    },
    {
      connection: redisConfig,
      concurrency: 5,
    }
  );

  meetingWorker.on("completed", (job) => {
    // Job completed
  });

  meetingWorker.on("failed", (job, err) => {
    console.error(`[Meeting Worker] Job ${job?.id} failed:`, err.message);
  });
};

export const closeMeetingWorker = async (): Promise<void> => {
  if (meetingWorker) {
    try {
      await meetingWorker.close();
      meetingWorker = null;
      console.log("[Meeting Worker] Closed successfully");
    } catch (error) {
      console.error("[Meeting Worker] Failed to close:", error);
    }
  }
};
