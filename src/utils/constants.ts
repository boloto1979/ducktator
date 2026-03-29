import { Schedule } from '../types';

export const ROAST_DELAY_MINUTES = 5;

export const DEFAULT_SCHEDULE: Schedule = {
  enabled: false,
  days: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
};
