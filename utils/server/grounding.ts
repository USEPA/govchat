const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// An empty or unset whitelist allows every user while the global toggle is on.
export const isGroundingAllowed = (userName: string): boolean => {
  if ((process.env.ENABLE_WEB_GROUNDING ?? 'false').toLowerCase() !== 'true') {
    return false;
  }

  const whitelist = parseList(process.env.ENABLE_WEB_GROUNDING_WHITELIST);
  if (whitelist.length === 0) return true;

  return whitelist.includes(userName.trim().toLowerCase());
};
