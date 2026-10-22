export enum ProcessState {
  NEW = "NEW",
  READY = "READY",
  RUNNING = "RUNNING",
  WAITING = "WAITING",
  TERMINATED = "TERMINATED",
}

export interface ThreadControlBlock {
  tid: number;
  state: ProcessState;
  remainingBurst: number;
}

export interface ProcessControlBlock {
  pid: number;
  state: ProcessState;
  burstTime: number;
  priority: number;
  arrivalTime: number;
  memoryRequirement: number;
  threads: ThreadControlBlock[];
  remainingBurst: number;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number;
  completionTime: number;
  startTime: number;
}

export function createPCB(
  pid: number,
  burst: number,
  priority: number,
  arrival: number,
  memory: number
): ProcessControlBlock {
  return {
    pid,
    state: ProcessState.NEW,
    burstTime: burst,
    priority,
    arrivalTime: arrival,
    memoryRequirement: memory,
    threads: [],
    remainingBurst: burst,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: -1,
    completionTime: 0,
    startTime: -1,
  };
}

export interface ScheduleResult {
  algorithmName: string;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  throughput: number;
  gantt: { pid: number; duration: number }[];
  processes: ProcessControlBlock[];
}


export interface DiskScheduleResult {
  algorithm: string;
  order: number[];
  totalMovement: number;
  avgSeek: number;
}

export interface LogEntry {
  time: number;
  tag: string;
  message: string;
}
