import type { PrototypeUserScenario } from "../user-flows/prototypeUserScenarios";
import {
  getPrototypeStorage,
  type StorageLike,
} from "../../services/prototypeStorage";

const USER_TEST_STORAGE_KEY = "stayview_user_test_sessions";

export type PrototypeUserTestResult = "pass" | "fail" | "blocked";

export interface PrototypeUserTestEvent {
  at: string;
  label: string;
  note?: string;
}

export interface PrototypeUserTestSession {
  id: string;
  scenarioId: string;
  task: string;
  actor: PrototypeUserScenario["actor"];
  startedAt: string;
  finishedAt?: string;
  result?: PrototypeUserTestResult;
  events: PrototypeUserTestEvent[];
}

interface UserTestClock {
  now: () => Date;
}

const defaultClock: UserTestClock = {
  now: () => new Date(),
};

export function startUserTestSession(
  scenario: PrototypeUserScenario,
  clock: UserTestClock = defaultClock
): PrototypeUserTestSession {
  return {
    id: `${scenario.id}-${clock.now().getTime()}`,
    scenarioId: scenario.id,
    task: scenario.task,
    actor: scenario.actor,
    startedAt: clock.now().toISOString(),
    events: [],
  };
}

export function recordUserTestEvent(
  session: PrototypeUserTestSession,
  label: string,
  note?: string,
  clock: UserTestClock = defaultClock
): PrototypeUserTestSession {
  return {
    ...session,
    events: [
      ...session.events,
      {
        at: clock.now().toISOString(),
        label,
        note,
      },
    ],
  };
}

export function finishUserTestSession(
  session: PrototypeUserTestSession,
  result: PrototypeUserTestResult,
  clock: UserTestClock = defaultClock,
  storage: StorageLike = getPrototypeStorage()
): PrototypeUserTestSession {
  const finishedSession = {
    ...session,
    finishedAt: clock.now().toISOString(),
    result,
  };

  persistUserTestSession(finishedSession, storage);
  return finishedSession;
}

export function readUserTestSessions(
  storage: StorageLike = getPrototypeStorage()
): PrototypeUserTestSession[] {
  const raw = storage.getItem(USER_TEST_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PrototypeUserTestSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearUserTestSessions(
  storage: StorageLike = getPrototypeStorage()
) {
  storage.removeItem(USER_TEST_STORAGE_KEY);
}

function persistUserTestSession(
  session: PrototypeUserTestSession,
  storage: StorageLike = getPrototypeStorage()
) {
  const currentSessions = readUserTestSessions(storage);
  storage.setItem(
    USER_TEST_STORAGE_KEY,
    JSON.stringify([...currentSessions, session])
  );
}
