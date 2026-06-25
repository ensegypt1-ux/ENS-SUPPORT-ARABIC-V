export const GUEST_PARTICIPANT_PREFIX = "guest:";

export function guestParticipantId(guestSessionId: string): string {
  return `${GUEST_PARTICIPANT_PREFIX}${guestSessionId}`;
}

export function isGuestParticipantId(userId: string): boolean {
  return userId.startsWith(GUEST_PARTICIPANT_PREFIX);
}

export function parseGuestSessionIdFromParticipantId(
  participantId: string
): string | null {
  if (!isGuestParticipantId(participantId)) return null;
  return participantId.slice(GUEST_PARTICIPANT_PREFIX.length);
}
