/**
 * Utility helper functions
 */

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US');
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US');
};
