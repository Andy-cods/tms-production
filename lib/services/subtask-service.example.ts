/**
 * SubtaskService - Usage Examples
 * 
 * This file demonstrates how to use the SubtaskService for managing task hierarchies.
 * DO NOT import this file - it's for reference only.
 */

import { subtaskService } from "./subtask-service";
import type { Role } from "@prisma/client";

// =============================================================================
// EXAMPLE 1: Check if subtasks can be added to a task
// =============================================================================
async function exampleCanAddSubtasks() {
  const result = await subtaskService.canAddSubtasks("task_123");

  if (result.canAdd) {
    console.log("✅ Can add subtasks to this task");
  } else {
    console.log("❌ Cannot add subtasks:", result.reason);
    // Reasons:
    // - "Task không tồn tại"
    // - "Không thể tạo subtask cho một subtask"
    // - "Không thể tạo subtask cho task đã hoàn thành"
  }
}

// =============================================================================
// EXAMPLE 2: Create a subtask
// =============================================================================
async function exampleCreateSubtask() {
  const result = await subtaskService.createSubtask({
    parentId: "task_parent_123",
    title: "Design Login UI",
    description: "Create responsive login page with form validation",
    assigneeId: "user_456", // Optional: will inherit from parent if not provided
    deadline: new Date("2025-12-31"),
    userId: "user_789", // Current user creating the subtask
    userRole: "LEADER" as Role,
  });

  if (result.success && result.subtask) {
    console.log("✅ Subtask created:", {
      id: result.subtask.id,
      title: result.subtask.title,
      parentTaskId: result.subtask.parentTaskId,
      status: result.subtask.status, // "TODO"
    });

    // Parent task is automatically updated to WAITING_SUBTASKS
  } else {
    console.error("❌ Failed to create subtask:", result.error);
  }
}

// =============================================================================
// EXAMPLE 3: Create subtask with inherited assignee
// =============================================================================
async function exampleCreateSubtaskInheritAssignee() {
  // Subtask will inherit assigneeId from parent
  const result = await subtaskService.createSubtask({
    parentId: "task_parent_123",
    title: "Implement Backend API",
    description: "Create REST endpoints for authentication",
    // No assigneeId provided → inherits from parent
    userId: "user_789",
    userRole: "ADMIN" as Role,
  });

  if (result.success) {
    console.log("Subtask assignee:", result.subtask?.assigneeId);
    // Will be same as parent's assigneeId
  }
}

// =============================================================================
// EXAMPLE 4: Aggregate subtask status
// =============================================================================
async function exampleAggregateStatus() {
  const result = await subtaskService.aggregateSubtaskStatus("task_parent_123");

  if (result.success && result.status) {
    const { canComplete, recommendedStatus, summary, subtaskCounts } = result.status;

    console.log("Parent status analysis:", {
      canComplete,           // true if all subtasks DONE
      recommendedStatus,     // Suggested status for parent
      summary,              // "3/5 subtask hoàn thành"
      counts: subtaskCounts,
    });

    // Example counts:
    // {
    //   total: 5,
    //   done: 3,
    //   inProgress: 2,
    //   blocked: 0,
    //   todo: 0,
    //   inReview: 0,
    //   rework: 0
    // }

    // Use to update UI
    if (canComplete) {
      console.log("✅ All subtasks complete! Parent can be marked DONE");
    } else {
      console.log(`⏳ ${summary}`);
    }
  }
}

// =============================================================================
// EXAMPLE 5: Delete a subtask
// =============================================================================
async function exampleDeleteSubtask() {
  const result = await subtaskService.deleteSubtask({
    subtaskId: "task_subtask_456",
    userId: "user_789",
    userRole: "ADMIN" as Role,
  });

  if (result.success) {
    console.log("✅ Subtask deleted");
    // Parent status is automatically recalculated and updated
  } else {
    console.error("❌ Failed to delete:", result.error);
  }
}

// =============================================================================
// EXAMPLE 6: Update parent status based on subtasks
// =============================================================================
async function exampleUpdateParentStatus() {
  const result = await subtaskService.updateParentStatus("task_parent_123");

  if (result.success && result.task) {
    console.log("✅ Parent status updated:", {
      id: result.task.id,
      status: result.task.status,
      completedAt: result.task.completedAt,
    });
  }
}

// =============================================================================
// EXAMPLE 7: Complete workflow - Create and manage subtasks
// =============================================================================
async function exampleCompleteWorkflow() {
  const userId = "user_123";
  const userRole: Role = "LEADER";
  const parentTaskId = "task_parent_789";

  // Step 1: Check if we can add subtasks
  const canAdd = await subtaskService.canAddSubtasks(parentTaskId);
  if (!canAdd.canAdd) {
    console.error("Cannot add subtasks:", canAdd.reason);
    return;
  }

  // Step 2: Create multiple subtasks
  const subtasks = [
    { title: "Design UI mockups", assigneeId: "user_designer" },
    { title: "Implement backend", assigneeId: "user_backend" },
    { title: "Write tests", assigneeId: "user_qa" },
  ];

  for (const subtaskData of subtasks) {
    const result = await subtaskService.createSubtask({
      parentId: parentTaskId,
      title: subtaskData.title,
      assigneeId: subtaskData.assigneeId,
      userId,
      userRole,
    });

    if (result.success) {
      console.log(`✅ Created: ${subtaskData.title}`);
    }
  }

  // Step 3: Check parent status (should be WAITING_SUBTASKS)
  const statusResult = await subtaskService.aggregateSubtaskStatus(parentTaskId);
  if (statusResult.success) {
    console.log("Parent status:", statusResult.status?.recommendedStatus);
  }

  // Step 4: Simulate completing subtasks
  // (In real app, this happens when subtask status changes)
  // When last subtask is marked DONE, call:
  await subtaskService.updateParentStatus(parentTaskId);
  // Parent will be marked DONE automatically
}

// =============================================================================
// EXAMPLE 8: Handle permission errors
// =============================================================================
async function examplePermissionHandling() {
  const result = await subtaskService.createSubtask({
    parentId: "task_123",
    title: "Unauthorized subtask",
    userId: "user_random", // User with no permissions
    userRole: "REQUESTER" as Role,
  });

  if (!result.success) {
    if (result.error?.includes("Không có quyền")) {
      console.error("Permission denied!");
      // Show appropriate UI message
    }
  }
}

// =============================================================================
// EXAMPLE 9: Status aggregation logic demonstration
// =============================================================================
async function exampleStatusAggregation() {
  const parentId = "task_parent_123";

  // Scenario 1: All subtasks DONE
  // Result: canComplete = true, recommendedStatus = "DONE"

  // Scenario 2: Some IN_PROGRESS
  // Result: canComplete = false, recommendedStatus = "IN_PROGRESS"

  // Scenario 3: All TODO
  // Result: canComplete = false, recommendedStatus = "TODO"

  // Scenario 4: Some BLOCKED
  // Result: canComplete = false, recommendedStatus = "BLOCKED"

  const result = await subtaskService.aggregateSubtaskStatus(parentId);

  if (result.success && result.status) {
    console.log("Status Logic Result:", {
      recommendation: result.status.recommendedStatus,
      canMarkDone: result.status.canComplete,
      breakdown: result.status.subtaskCounts,
    });
  }
}

// =============================================================================
// EXAMPLE 10: Integration with server actions
// =============================================================================
async function exampleServerActionIntegration() {
  // In a server action (actions/task.ts)
  
  // Create subtask action
  async function createSubtaskAction(
    parentId: string,
    title: string,
    userId: string,
    userRole: Role
  ) {
    const result = await subtaskService.createSubtask({
      parentId,
      title,
      userId,
      userRole,
    });

    if (result.success) {
      // Revalidate cache
      // revalidatePath(`/requests/${requestId}`);
      return { success: true, subtaskId: result.subtask?.id };
    }

    return { success: false, error: result.error };
  }

  // Update status when subtask completes
  async function onSubtaskComplete(subtaskId: string, parentId: string) {
    // 1. Update subtask to DONE
    // await prisma.task.update({ where: { id: subtaskId }, data: { status: "DONE" } });

    // 2. Recalculate parent status
    const result = await subtaskService.updateParentStatus(parentId);

    if (result.success) {
      console.log("Parent updated:", result.task?.status);
    }
  }
}

// =============================================================================
// EXPORT (for reference only)
// =============================================================================
export {
  exampleCanAddSubtasks,
  exampleCreateSubtask,
  exampleCreateSubtaskInheritAssignee,
  exampleAggregateStatus,
  exampleDeleteSubtask,
  exampleUpdateParentStatus,
  exampleCompleteWorkflow,
  examplePermissionHandling,
  exampleStatusAggregation,
  exampleServerActionIntegration,
};

