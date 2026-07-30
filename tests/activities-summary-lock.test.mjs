import assert from 'node:assert/strict'
import test from 'node:test'

import {
  activityWeekStartIso,
  isActivitySummaryWeekLocked,
} from '../api/activities-summaries.js'

test('calculates Monday as the start of an activity week', () => {
  assert.equal(activityWeekStartIso('2026-07-27'), '2026-07-27')
  assert.equal(activityWeekStartIso('2026-07-31'), '2026-07-27')
  assert.equal(activityWeekStartIso('2026-08-02'), '2026-07-27')
})

test('locks only weeks before the current Lisbon week', () => {
  const monday = new Date('2026-07-27T09:00:00Z')
  assert.equal(isActivitySummaryWeekLocked('2026-07-24', monday), true)
  assert.equal(isActivitySummaryWeekLocked('2026-07-27', monday), false)
  assert.equal(isActivitySummaryWeekLocked('2026-07-31', monday), false)
  assert.equal(isActivitySummaryWeekLocked('2026-08-03', monday), false)
})

test('uses Europe/Lisbon when the next week starts around midnight', () => {
  const beforeLisbonMidnight = new Date('2026-08-02T22:30:00Z')
  const afterLisbonMidnight = new Date('2026-08-02T23:30:00Z')

  assert.equal(isActivitySummaryWeekLocked('2026-07-31', beforeLisbonMidnight), false)
  assert.equal(isActivitySummaryWeekLocked('2026-07-31', afterLisbonMidnight), true)
})

test('does not lock an invalid activity date', () => {
  assert.equal(isActivitySummaryWeekLocked('', new Date('2026-07-27T09:00:00Z')), false)
  assert.equal(isActivitySummaryWeekLocked('not-a-date', new Date('2026-07-27T09:00:00Z')), false)
  assert.equal(isActivitySummaryWeekLocked('2026-02-31', new Date('2026-07-27T09:00:00Z')), false)
})
