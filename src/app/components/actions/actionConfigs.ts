import { CheckCircle2, Clock, RefreshCw, User, Users, XCircle } from 'lucide-react';
import type { ActionCard } from './ActionSelectionScreen';
import type { ComboboxOption } from '../SearchableCombobox';

/**
 * Role-specific action configs for the ActionSelectionScreen.
 *
 * Copy and transitions are pulled straight from
 * "WorkflowSteps and Choices_V2_7-24-2026.csv" so this stays the single source
 * of truth for what each role can do at the "choose next action" step.
 *
 * Callers pass in dynamic bits (e.g. reassignOptions) so the config stays pure.
 */

/**
 * Field Supervisor — the "I've completed my section, now route it" moment.
 *
 * Per CSV, the FS has three preconditions that yield different transitions:
 *  - FS initiated → send to Operator to complete their part
 *  - Operator initiated (or operator unavailable / STD) → send to Assistant Manager review
 *  - Sent for rework → send to Assistant Manager review (Reworked status)
 *
 * For the prototype we surface both paths as cards; the human dev will resolve
 * which one is legitimately available when the workflow engine contract lands.
 */
export function buildFsActions(params: {
  showSendToOperator?: boolean;
  isReworkPath?: boolean;
}): ActionCard[] {
  const { showSendToOperator = false, isReworkPath = false } = params;

  const cards: ActionCard[] = [
    {
      id: 'send-to-assistant-manager',
      icon: CheckCircle2,
      tone: 'emerald',
      title: isReworkPath
        ? 'I have reworked the report. Send to Assistant Manager review.'
        : 'I have completed the form. Send to Assistant Manager review.',
      description: isReworkPath
        ? 'Sends the reworked report to the Assistant Manager for final review.'
        : 'Sends the report to the Assistant Manager for the next stage of review.',
      context: {
        kind: 'comment',
        label: 'Note to Assistant Manager',
        placeholder: 'Add any context that will help the Assistant Manager review this report.',
        required: false,
        maxLength: 1000,
      },
    },
  ];

  if (showSendToOperator) {
    cards.push({
      id: 'send-to-operator',
      icon: User,
      tone: 'indigo',
      title: 'I have completed the form. Send to Operator to complete.',
      description: 'Routes the report to the Operator so they can complete their section next.',
      context: {
        kind: 'comment',
        label: 'Note to Operator',
        placeholder: 'What does the operator need to complete?',
        required: false,
        maxLength: 1000,
      },
    });
  }

  return cards;
}

/**
 * Assistant Manager — 3 actions (matches image 3 and the CSV).
 * Precondition (per CSV): Both Field Supervisor and Operator have completed
 * their sections, OR the Operator section was skipped, OR the report was sent
 * back after rework.
 *
 * The Rework action routes back to the SPECIFIC Field Supervisor who worked
 * the report — the workflow engine does that lookup; the UI just fires the
 * action.
 */
export function buildAmActions(params: {
  reassignOptions: ComboboxOption[];
}): ActionCard[] {
  const { reassignOptions } = params;

  return [
    {
      id: 'send-to-spm',
      icon: CheckCircle2,
      tone: 'emerald',
      title: 'I have reviewed this accident report. Send to Safety Program Manager review.',
      description: 'Moves the report into the Agency Safety Review queue for the Safety Program Manager to classify.',
      context: {
        kind: 'comment',
        label: 'Note to Safety Program Manager',
        placeholder: 'Add any context that will help the Safety Program Manager review this report.',
        required: false,
        maxLength: 1000,
      },
    },
    {
      id: 'rework',
      icon: RefreshCw,
      tone: 'amber',
      title: 'Need additional information / Rework',
      description: 'Returns the report to the Field Supervisor who worked it for corrections.',
      context: {
        kind: 'comment',
        label: 'Rework note',
        placeholder: 'What needs to be corrected before this can move forward?',
        required: true,
        maxLength: 1000,
        hint: 'Sent to the specific Field Supervisor who worked this report.',
      },
    },
    {
      id: 'reassign',
      icon: Users,
      tone: 'teal',
      title: 'Re-Assign',
      description: 'Reassigns the report to another Assistant Manager. You will be prompted to select one.',
      context: {
        kind: 'user-picker',
        label: 'Assign to',
        placeholder: 'Select an Assistant Manager',
        required: true,
        options: reassignOptions,
      },
    },
  ];
}

/**
 * Safety Program Manager — up to 6 actions (matches the mock in image 1).
 * Precondition (per CSV): "Accident Report is reviewed by the Assistant Manager."
 *
 * Note on the operator-input pair: Pending vs Needs Operator Input is a state
 * toggle, not two cards side by side. When the case is not on hold, we show
 * Pending ("put it on hold"). Once the case is on hold pending the operator,
 * the next time the SPM opens it we show Needs Operator Input ("push it back
 * to the operator now that they're available").
 */
export function buildSpmActions(params: {
  reassignOptions: ComboboxOption[];
  canApprove?: boolean;
  approveDisabledReason?: string;
  caseIsOnHoldPendingOperator?: boolean;
}): ActionCard[] {
  const {
    reassignOptions,
    canApprove = true,
    approveDisabledReason,
    caseIsOnHoldPendingOperator = false,
  } = params;

  const operatorInputCard: ActionCard = caseIsOnHoldPendingOperator
    ? {
        id: 'needs-operator-input',
        icon: User,
        tone: 'sky',
        title: 'Needs Operator Input',
        description: 'Assigns the report to the Operator for completion. Use this once the operator is available to finish their section.',
        context: {
          kind: 'comment',
          label: 'Note to operator',
          placeholder: 'What does the operator need to complete?',
          required: false,
          maxLength: 1000,
        },
      }
    : {
        id: 'pending-operator-input',
        icon: Clock,
        tone: 'indigo',
        title: 'Pending Operator Input',
        description: 'Keeps the report assigned to you while operator information is pending.',
        context: {
          kind: 'comment',
          label: 'Hold reason',
          placeholder: 'e.g. Operator on STD — holding until they return to complete their section.',
          required: false,
          maxLength: 1000,
        },
      };

  return [
    {
      id: 'approve',
      icon: CheckCircle2,
      tone: 'emerald',
      title: 'I have reviewed this accident report.',
      description: 'Closes the accident report. No further assignment will be created.',
      disabled: !canApprove,
      disabledReason: approveDisabledReason,
    },
    {
      id: 'rework',
      icon: RefreshCw,
      tone: 'amber',
      title: 'Need additional information / Rework',
      description: 'Returns the report to the Field Supervisor for rework.',
      context: {
        kind: 'comment',
        label: 'Rework note',
        placeholder: 'What needs to be corrected before this can move forward?',
        required: true,
        maxLength: 1000,
        hint: 'Sent to the specific Field Supervisor who worked this report.',
      },
    },
    operatorInputCard,
    {
      id: 'reassign',
      icon: Users,
      tone: 'teal',
      title: 'Re-Assign',
      description: 'Assigns the report to another user. You will be prompted to select a user.',
      context: {
        kind: 'user-picker',
        label: 'Assign to',
        placeholder: 'Select a user',
        required: true,
        options: reassignOptions,
      },
    },
    {
      id: 'cancel',
      icon: XCircle,
      tone: 'red',
      title: 'Cancel this report (must add comments)',
      description: 'Cancels this report. You will be prompted to add comments.',
      context: {
        kind: 'comment',
        label: 'Comments',
        placeholder: 'Enter comments (required)',
        required: true,
        maxLength: 1000,
      },
    },
  ];
}
