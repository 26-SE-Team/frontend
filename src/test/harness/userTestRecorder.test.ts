import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { resetPrototypeFallbackStorage } from "../../services/prototypeStorage";
import { prototypeUserScenarios } from "../user-flows/prototypeUserScenarios";
import {
  finishUserTestSession,
  readUserTestSessions,
  recordUserTestEvent,
  startUserTestSession,
} from "./userTestRecorder";

const fixedClock = {
  now: () => new Date("2026-05-30T09:00:00.000Z"),
};

describe("userTestRecorder", () => {
  beforeEach(resetPrototypeFallbackStorage);
  afterEach(resetPrototypeFallbackStorage);

  it("records alpha-test events locally without an API server", () => {
    const scenario = prototypeUserScenarios[0];
    const started = startUserTestSession(scenario, fixedClock);
    const progressed = recordUserTestEvent(
      started,
      "검색어 입력",
      "상도 검색",
      fixedClock
    );

    const finished = finishUserTestSession(progressed, "pass", fixedClock);

    assert.equal(finished.scenarioId, scenario.id);
    assert.equal(finished.events.length, 1);
    assert.deepEqual(readUserTestSessions(), [finished]);
  });
});
