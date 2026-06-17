import React, { useCallback, useState } from "react";
import "./App.css";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export type SleepSession = {
  start: Date;
  end: Date;
  phases: string;
  lowestHeartRate: number;
  averageHRV: number;
};

export type ActivityData = {
  activityScore: number;
  sedentaryTime: number;
  lowActivityTime: number;
  mediumActivityTime: number;
  highActivityTime: number;
  steps: number;
};

export type SleepData = {
  day: Date;
  bedtimeEnd: Date;
  bedtimeStart: Date;
  sleepScore: number;
  totalSleep: number;
  sessions: SleepSession[];
  activityData?: ActivityData | null;
};

// Helper function to format time duration
const formatDuration = (seconds: number): string => {
  const minutes = seconds / 60;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to get day name
const getDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

const getDayDisplay = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return `${getDayName(date)}, ${date.getDate()}`;
};

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 85) return "#4ade80"; // green
  if (score >= 70) return "#fbbf24"; // yellow
  if (score >= 50) return "#e58267"; // orange
  return "#ef4444"; // red
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

type ScoreCardProps = {
  day: Date;
  data?: SleepData;
};

const ScoreCard: React.FC<ScoreCardProps> = (props) => {
  const [showExpanded, setShowExpanded] = useState(false);
  const toggleShowExpanded = useCallback(() => {
    setShowExpanded((prev) => !prev);
  }, []);

  if (!props.data) {
    const couldBeWaiting = (isToday(props.day) || isYesterday(props.day)) && new Date().getHours() < 12;
    return (
      <div className="day-card">
        <div className="day-header">{getDayDisplay(props.day)}</div>
        <div className="no-data-message">
          No data...{couldBeWaiting && <><br />(yet!)</>}
        </div>
      </div>
    );
  }
  const { sleepScore, day, totalSleep, bedtimeStart, bedtimeEnd, sessions, activityData } =
    props.data;

  console.log("props data", props.data);

  return (
    <div
      className="day-card"
      style={
        { "--score-color": getScoreColor(sleepScore) } as React.CSSProperties
      }
    >
      {/* Header */}
      <div className="day-header">{getDayDisplay(day)}</div>
      <div className="score-section">{sleepScore} <span className="activity-label">sleep</span></div>

      {/* Sleep Details */}
      <div className="timing-section">
        <div className="sleep-duration-row">
          <span className="total-sleep">{formatDuration(totalSleep)}</span>
          <span className="sleep-timespan">
            {formatTime(bedtimeStart)} - {formatTime(bedtimeEnd)}
            {sessions.length > 1 && (
              <span className="nap-section">
                {" "}+ {sessions.length - 1} {sessions.length > 2 ? "naps" : "nap"}
              </span>
            )}
          </span>
        </div>
        <div className="sleep-heart">
          <span className="heart-emoji">📈</span> {sessions[0].lowestHeartRate}
          bpm, avg HRV {sessions[0].averageHRV}
        </div>
      </div>
      {/* Activity Section */}
      {activityData && (() => {
        const zones = [
          { key: "low",    time: activityData.lowActivityTime,    label: "low",    cls: "activity-low" },
          { key: "medium", time: activityData.mediumActivityTime, label: "medium", cls: "activity-medium" },
          { key: "high",   time: activityData.highActivityTime,   label: "high",   cls: "activity-high" },
        ];
        const activeTotal = zones.reduce((s, z) => s + z.time, 0);
        const pct = (t: number) => activeTotal > 0 ? `${(t / activeTotal * 100).toFixed(1)}%` : "0%";
        const fmtMins = (s: number) => {
          const m = Math.round(s / 60);
          return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
        };
        return (
          <div className="activity-section" style={{ "--activity-score-color": getScoreColor(activityData.activityScore) } as React.CSSProperties}>
            <div className="activity-score">{activityData.activityScore} <span className="activity-label">activity</span></div>
            <div className="activity-bar">
              {zones.map(z => (
                <div key={z.key} className={`activity-bar-segment ${z.cls}`} style={{ width: pct(z.time) }} />
              ))}
            </div>
            <div className="activity-bar-times">
              {zones.map(z => (
                <div key={z.key} className="segment-time" style={{ width: pct(z.time) }}>{fmtMins(z.time)}</div>
              ))}
            </div>

            <div className="activity-steps">👟 {activityData.steps.toLocaleString()} steps</div>
          </div>
        );
      })()}
      {/* Nap Section */}
      {sessions.length > 1 && (
        <>
          <div className="expand-arrow" onClick={toggleShowExpanded}>
            {showExpanded ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          {showExpanded && (
            <div className="expanded-section">
              <div className="naps-title">naps:</div>
              {sessions.slice(1).map((session, i) => (
                <div className="nap-time">
                  {formatTime(session.start)} - {formatTime(session.end)}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScoreCard;
