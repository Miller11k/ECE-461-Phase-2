/**
 * Determines if logging should be enabled based on specific and global environment variables.
 * @param specificLogEnvVar - The specific log environment variable (e.g., 'LOG_POST_BYREGEX').
 * @param globalLogEnvVar - The global log environment variable (e.g., 'LOG_ALL').
 * @returns 1 if logging is enabled, 0 otherwise.
 */
export const shouldLog = (log_specifc: number, log_all: number): number => {
    const specificLog = log_specifc || 0;
    const globalLog = log_all || 0;
  
    return specificLog === 1 || globalLog === 1 ? 1 : 0;
  };