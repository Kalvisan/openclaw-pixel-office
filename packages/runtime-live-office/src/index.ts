/**
 * Live Office - maps task/event data to AgentSim for 2D visualization.
 * Used by runtime API to serve /api/live-office.
 */

import type { AgentSim, AgentSimState } from "@openclaw-office/office-sim";

export interface LiveOfficeLayout {
  width: number;
  height: number;
  spots: {
    desk: { x: number; y: number }[];
    chair: { x: number; y: number }[];
    meeting: { x: number; y: number }[];
    closet: { x: number; y: number }[];
  };
}

export interface LiveOfficeState {
  agents: AgentSim[];
  layout: LiveOfficeLayout;
  tasks: { task_id: string; agent_id: string; status: string }[];
}

/** Default desk/chair spots for up to 8 agents (40x25 grid) */
const DEFAULT_SPOTS: LiveOfficeLayout["spots"] = {
  desk: Array.from({ length: 8 }, (_, i) => ({
    x: 10 + (i % 4) * 4,
    y: 6 + Math.floor(i / 4) * 2,
  })),
  chair: Array.from({ length: 8 }, (_, i) => ({
    x: 10 + (i % 4) * 4,
    y: 12 + Math.floor(i / 4) * 2,
  })),
  meeting: [{ x: 19, y: 16 }],
  closet: [{ x: 14, y: 20 }],
};

const DEFAULT_LAYOUT: LiveOfficeLayout = {
  width: 40,
  height: 25,
  spots: DEFAULT_SPOTS,
};

export interface TaskRow {
  task_id: string;
  agent_id: string;
  status: string;
}

/** Build AgentSim list from tasks and agent IDs. Running task → working at desk, else idle. */
export function buildLiveOfficeState(
  tasks: TaskRow[],
  agentIds: string[],
  layout: LiveOfficeLayout = DEFAULT_LAYOUT
): LiveOfficeState {
  const runningByAgent = new Map<string, string>();
  for (const t of tasks) {
    if (t.status === "running" || t.status === "picked") {
      runningByAgent.set(t.agent_id, t.task_id);
    }
  }

  const agents: AgentSim[] = [];
  const desks = layout.spots.desk;
  const chairs = layout.spots.chair;

  for (let i = 0; i < agentIds.length; i++) {
    const agent_id = agentIds[i];
    const desk = desks[i] ?? desks[0] ?? { x: 10, y: 6 };
    const chair = chairs[i] ?? chairs[0] ?? { x: 10, y: 12 };
    const isWorking = runningByAgent.has(agent_id);

    const state: AgentSimState = isWorking ? "working" : "idle";
    const { x, y } = isWorking ? desk : chair;

    agents.push({
      agent_id,
      state,
      x,
      y,
      desk_x: desk.x,
      desk_y: desk.y,
    });
  }

  return {
    agents,
    layout,
    tasks: tasks.map((t) => ({
      task_id: t.task_id,
      agent_id: t.agent_id,
      status: t.status,
    })),
  };
}

export { DEFAULT_LAYOUT };
