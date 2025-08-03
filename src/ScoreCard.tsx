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

export type SleepData = {
  day: Date;
  bedtimeEnd: Date;
  bedtimeStart: Date;
  sleepScore: number;
  totalSleep: number;
  sessions: SleepSession[];
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

const getDayDisplay = (date: Date) => {
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
    const couldBeWaiting = isYesterday(props.day) && new Date().getHours() < 12;
    return (
      <div className="day-card">
        <div className="day-header">{getDayDisplay(props.day)}</div>
        <div className="no-data-message">
          <>
            No data...
            <br />
            {couldBeWaiting ? "(yet!)" : "Perhaps no sleep?"}
          </>
        </div>
      </div>
    );
  }
  const { sleepScore, day, totalSleep, bedtimeStart, bedtimeEnd, sessions } =
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
      <div className="score-section">{sleepScore}</div>

      {/* Sleep Details */}
      <div className="timing-section">
        <div className="total-sleep">{formatDuration(totalSleep)} </div>
        <div className="sleep-timespan">
          {formatTime(bedtimeStart)} - {formatTime(bedtimeEnd)}{" "}
          {sessions.length > 1 && (
            <span className="nap-section">
              + {sessions.length - 1} {sessions.length > 2 ? "naps" : "nap"}
            </span>
          )}
        </div>
        <div className="sleep-heart">
          <span className="heart-emoji">🫀</span> {sessions[0].lowestHeartRate}
          bpm, avg HRV {sessions[0].averageHRV}
        </div>
      </div>
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
