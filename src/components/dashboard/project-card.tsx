"use client";

import React from "react";

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  tasks: TaskItem[];
  onToggleTask: (taskId: string, currentCompleted: boolean) => void;
}

export function ProjectCard({
  title,
  description,
  level,
  tasks,
  onToggleTask,
}: ProjectCardProps) {
  const levelColor =
    level === "Beginner"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : level === "Intermediate"
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-purple-500/10 text-purple-400 border-purple-500/20";

  return (
    <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
        <span
          className={`text-[10px] px-2.5 py-1 border rounded-md font-medium uppercase tracking-wider ${levelColor}`}
        >
          {level}
        </span>
      </div>

      {/* Interactive Task Checklist */}
      <div className="space-y-2 pt-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onToggleTask(task.id, task.completed)}
            className="flex items-center gap-3 p-2.5 bg-[#090a0f] border border-[#1f212d] rounded-xl cursor-pointer hover:border-slate-700 transition"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition ${
                task.completed
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-700 bg-transparent"
              }`}
            >
              {task.completed && "✓"}
            </div>
            <span
              className={`text-xs ${
                task.completed
                  ? "line-through text-slate-500"
                  : "text-slate-300"
              }`}
            >
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
