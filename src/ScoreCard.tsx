import React, { useCallback, useState } from "react";
import "./App.css";

export type SleepData = {
  bedtimeEnd: Date;
  bedtimeStart: Date;
  day: Date;
  sleepScore: number;
  hrv: number;
  totalSleep: number;
  lowestHeartRate: number;
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

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 85) return "#4ade80"; // green
  if (score >= 70) return "#fbbf24"; // yellow
  if (score >= 50) return "#fb923c"; // orange
  return "#ef4444"; // red
};

function plausiblyStillWaiting(date: Date): boolean {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  return (
    date.toDateString() === yesterday.toDateString() && date.getHours() < 12
  );
}

type ScoreCardProps = {
  day: Date;
  data?: SleepData;
};

const ScoreCard: React.FC<ScoreCardProps> = (props) => {
  if (!props.data) {
    const couldBeWaiting = plausiblyStillWaiting(props.day);
    return (
      <div className="day-card">
        <div className="day-header">
          {getDayName(props.day)}, {props.day.getDate()}
        </div>
        <div className="no-data-message">
          {couldBeWaiting ? (
            "No data (yet!)"
          ) : (
            <>
              No data...
              <br />
              Perhaps no sleep?
            </>
          )}
        </div>
      </div>
    );
  }
  const {
    sleepScore,
    day,
    totalSleep,
    bedtimeStart,
    bedtimeEnd,
    hrv,
    lowestHeartRate,
  } = props.data;

  return (
    <div
      className="day-card"
      style={
        { "--score-color": getScoreColor(sleepScore) } as React.CSSProperties
      }
    >
      {/* Header */}
      <div className="day-header">
        {getDayName(day)}, {day.getDate()}
      </div>
      <div className="score-section">{sleepScore}</div>

      {/* Sleep Details */}
      <div className="timing-section">
        <div className="total-sleep">{formatDuration(totalSleep)}</div>
        <div className="sleep-timespan">
          {formatTime(bedtimeStart)} - {formatTime(bedtimeEnd)}
        </div>
      </div>
      <div className="heart-section">
        {lowestHeartRate} bpm, {hrv}ms hrv
      </div>
    </div>
  );
};

export default ScoreCard;
