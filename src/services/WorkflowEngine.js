/**
 * Centralized Application Workflow Engine & State Transition Validator
 */

import { APPLICATION_STATUS } from '../data/models.js';

const ALLOWED_TRANSITIONS = {
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.UNDER_REVIEW
  ],
  [APPLICATION_STATUS.UNDER_REVIEW]: [
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED
  ],
  [APPLICATION_STATUS.SHORTLISTED]: [
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.REJECTED
  ],
  [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: [
    APPLICATION_STATUS.INTERVIEW_COMPLETED
  ],
  [APPLICATION_STATUS.INTERVIEW_COMPLETED]: [
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED
  ],
  [APPLICATION_STATUS.SELECTED]: [
    APPLICATION_STATUS.OFFER_ISSUED
  ],
  [APPLICATION_STATUS.OFFER_ISSUED]: [
    APPLICATION_STATUS.OFFER_ACCEPTED,
    APPLICATION_STATUS.EXPIRED,
    APPLICATION_STATUS.DECLINED
  ],
  [APPLICATION_STATUS.OFFER_ACCEPTED]: [
    APPLICATION_STATUS.INTERNSHIP_ACTIVE
  ],
  [APPLICATION_STATUS.INTERNSHIP_ACTIVE]: [
    APPLICATION_STATUS.INTERNSHIP_COMPLETED,
    APPLICATION_STATUS.TERMINATED
  ],
  [APPLICATION_STATUS.INTERNSHIP_COMPLETED]: [
    APPLICATION_STATUS.CERTIFICATE_ISSUED
  ],
  [APPLICATION_STATUS.CERTIFICATE_ISSUED]: [],
  [APPLICATION_STATUS.REJECTED]: [],
  [APPLICATION_STATUS.TERMINATED]: []
};

export class WorkflowEngine {
  /**
   * Validates if a state transition from currentStatus to targetStatus is allowed.
   */
  static isValidTransition(currentStatus, targetStatus) {
    if (!currentStatus || !targetStatus) return false;
    if (currentStatus === targetStatus) return true; // idempotent
    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowedNextStates.includes(targetStatus);
  }

  /**
   * Asserts transition validity or throws an error.
   */
  static assertValidTransition(currentStatus, targetStatus) {
    if (!this.isValidTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Invalid workflow transition: Cannot move application from status "${currentStatus}" to "${targetStatus}".`
      );
    }
  }

  /**
   * Returns list of valid next status options for a given current status.
   */
  static getNextPossibleStates(currentStatus) {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
