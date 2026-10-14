import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isGroundingAllowed } from '@/utils/server/grounding';

describe('isGroundingAllowed', () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.ENABLE_WEB_GROUNDING;
    delete process.env.ENABLE_WEB_GROUNDING_WHITELIST;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('denies everyone when the global toggle is off', () => {
    process.env.ENABLE_WEB_GROUNDING = 'false';
    process.env.ENABLE_WEB_GROUNDING_WHITELIST = 'a@epa.gov';
    expect(isGroundingAllowed('a@epa.gov')).toBe(false);
  });

  it('allows everyone when toggle is on and whitelist is empty', () => {
    process.env.ENABLE_WEB_GROUNDING = 'true';
    expect(isGroundingAllowed('anyone@epa.gov')).toBe(true);
    expect(isGroundingAllowed('')).toBe(true);
  });

  it('allows listed users only', () => {
    process.env.ENABLE_WEB_GROUNDING = 'true';
    process.env.ENABLE_WEB_GROUNDING_WHITELIST = 'a@epa.gov,b@epa.gov';
    expect(isGroundingAllowed('b@epa.gov')).toBe(true);
    expect(isGroundingAllowed('c@epa.gov')).toBe(false);
  });

  it('ignores case and whitespace', () => {
    process.env.ENABLE_WEB_GROUNDING = 'TRUE';
    process.env.ENABLE_WEB_GROUNDING_WHITELIST = ' Chase.Andrew@epa.gov , b@epa.gov ';
    expect(isGroundingAllowed('chase.andrew@EPA.gov')).toBe(true);
  });

  it('denies an empty user name when a whitelist is set', () => {
    process.env.ENABLE_WEB_GROUNDING = 'true';
    process.env.ENABLE_WEB_GROUNDING_WHITELIST = 'a@epa.gov';
    expect(isGroundingAllowed('')).toBe(false);
  });
});
