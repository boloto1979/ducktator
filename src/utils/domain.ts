export const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

export const isBlacklisted = (url: string, blacklist: string[]): boolean => {
  const hostname = getHostname(url);
  return blacklist.some(site => hostname.includes(site));
};
