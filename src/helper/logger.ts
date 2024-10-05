import { formatDuration } from "@/utils/format";

// const logger = console
const logger = process.env.NODE_ENV !== "production" ? console : undefined;

export function loggerTime(startTime: number) {
  let endTime = Date.now();
  logger?.log("It took ", endTime - startTime, " seconds")
  logger?.log("Time Format ", formatDuration((endTime - startTime)/1000))
  logger?.log("===========\n")
}

export default logger;