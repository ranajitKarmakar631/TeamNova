import {
  createMeetingSchema,
  updateMeetingSchema,
  rescheduleMeetingSchema,
  cancelMeetingSchema,
  createTopicSchema,
  createActionItemSchema,
  convertActionItemToTaskSchema,
} from "../meeting.validation";
import {
  MeetingAudience,
  MeetingStatus,
  ParticipantRole,
  InvitationStatus,
  AttendanceStatus,
  TopicStatus,
  ActionItemStatus,
  MeetingActivityAction,
} from "../meeting.enum";
import { RolePermissions } from "../../../common/utils/role-permission";
import { Permissions, WorkspaceRoles } from "../../../common/enums/association.enum";
import { roleGuard } from "../../../common/utils/roleGuard";

console.log("=========================================");
console.log("RUNNING MEETING SYSTEM VERIFICATION TESTS");
console.log("=========================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

// 1. Verify Permissions
console.log("\n--- 1. Permissions & RoleGuard Verification ---");
assert(
  Permissions.MEETING_CREATE === "meeting:create",
  "Permissions.MEETING_CREATE exists"
);
assert(
  Permissions.MEETING_CREATE_WORKSPACE === "meeting:create_workspace",
  "Permissions.MEETING_CREATE_WORKSPACE exists"
);
assert(
  Permissions.MEETING_MANAGE_MINUTES === "meeting:manage_minutes",
  "Permissions.MEETING_MANAGE_MINUTES exists"
);

// Verify roleGuard works with OWNER
let roleGuardPassed = false;
try {
  roleGuard(WorkspaceRoles.OWNER, [Permissions.MEETING_CREATE, Permissions.MEETING_MANAGE_AGENDA]);
  roleGuardPassed = true;
} catch (e) {
  roleGuardPassed = false;
}
assert(roleGuardPassed, "RoleGuard allows OWNER to create meetings & manage agenda");

// Verify roleGuard blocks unauthorized roles
let roleGuardBlocked = false;
try {
  roleGuard(WorkspaceRoles.EMPLOYEE, [Permissions.MEETING_CANCEL]);
} catch (e) {
  roleGuardBlocked = true;
}
assert(roleGuardBlocked, "RoleGuard blocks EMPLOYEE from cancelling meetings");

// 2. Validation Schemas
console.log("\n--- 2. Validation Schemas Verification ---");

const validMeetingInput = {
  title: "Sprint Retrospective",
  description: "Review sprint deliverables and blockers",
  audience: MeetingAudience.WORKSPACE,
  startAt: new Date(Date.now() + 3600000).toISOString(),
  endAt: new Date(Date.now() + 7200000).toISOString(),
  timezone: "Asia/Kolkata",
  meetingLink: "https://meet.google.com/abc-defg-hij",
  meetingProvider: "GOOGLE_MEET",
  topics: [
    { title: "Review Velocity", priority: "HIGH" },
    { title: "Action items review", priority: "MEDIUM" },
  ],
  reminderSettings: {
    dailyReminder: true,
    fifteenMinutesBefore: true,
    fiveMinutesBefore: true,
    meetingStartNotification: true,
  },
};

const parsedMeeting = createMeetingSchema.safeParse(validMeetingInput);
assert(parsedMeeting.success, "createMeetingSchema successfully parses valid payload");

// Test invalid meeting (empty title)
const invalidMeeting = createMeetingSchema.safeParse({
  ...validMeetingInput,
  title: "",
});
assert(!invalidMeeting.success, "createMeetingSchema correctly rejects empty title");

// Test reschedule schema
const parsedReschedule = rescheduleMeetingSchema.safeParse({
  startAt: new Date(Date.now() + 86400000).toISOString(),
  endAt: new Date(Date.now() + 90000000).toISOString(),
});
assert(parsedReschedule.success, "rescheduleMeetingSchema validates date input");

// Test cancel schema
const parsedCancel = cancelMeetingSchema.safeParse({
  cancelReason: "Client unavailable",
});
assert(parsedCancel.success, "cancelMeetingSchema validates cancel reason");

// Test topic schema
const parsedTopic = createTopicSchema.safeParse({
  title: "Architecture Review",
  priority: "HIGH",
});
assert(parsedTopic.success, "createTopicSchema validates new topic");

// Test action item schema
const parsedActionItem = createActionItemSchema.safeParse({
  title: "Optimize Mongo Indexes",
  priority: "HIGH",
});
assert(parsedActionItem.success, "createActionItemSchema validates new action item");

// Test convert to task schema
const parsedConvertTask = convertActionItemToTaskSchema.safeParse({
  projectId: "6704bfa4a6e54ef7bf771000",
  title: "Migrate database schema",
});
assert(parsedConvertTask.success, "convertActionItemToTaskSchema validates task conversion input");

// 3. Enum Values Consistency
console.log("\n--- 3. Enums Consistency ---");
assert(MeetingStatus.SCHEDULED === "SCHEDULED", "MeetingStatus.SCHEDULED");
assert(MeetingStatus.IN_PROGRESS === "IN_PROGRESS", "MeetingStatus.IN_PROGRESS");
assert(MeetingStatus.COMPLETED === "COMPLETED", "MeetingStatus.COMPLETED");
assert(MeetingStatus.CANCELLED === "CANCELLED", "MeetingStatus.CANCELLED");
assert(ParticipantRole.ORGANIZER === "ORGANIZER", "ParticipantRole.ORGANIZER");
assert(InvitationStatus.ACCEPTED === "ACCEPTED", "InvitationStatus.ACCEPTED");
assert(AttendanceStatus.JOINED === "JOINED", "AttendanceStatus.JOINED");
assert(ActionItemStatus.CONVERTED_TO_TASK === "CONVERTED_TO_TASK", "ActionItemStatus.CONVERTED_TO_TASK");
assert(MeetingActivityAction.MEETING_CREATED === "MEETING_CREATED", "MeetingActivityAction.MEETING_CREATED");

console.log("\n=========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("=========================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

