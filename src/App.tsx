import React, { useEffect, useState } from "react";
import "./App.css";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import ScoreCard, { SleepData } from "./ScoreCard";
import cloud from "./Realistic_Cloud_PNG_Transparent_Clip_Art_Image.png";

const getInitialDayMode = (): boolean => {
  const stored = localStorage.getItem("dayMode");
  if (stored === "true" || stored === "false") {
    return stored === "true";
  }
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const lastSevenDaysReverseOrder = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  return date;
});

const lastSevenDaysForwardOrder = [...lastSevenDaysReverseOrder].reverse();

const App: React.FC = () => {
  const [sleepData, setSleepData] = useState<{
    [dateString: string]: SleepData;
  }>({});
  const [loading, setLoading] = useState(true);
  const [vertical, setVertical] = useState(true);
  const [dayMode, setDayMode] = useState<boolean>(getInitialDayMode);

  useEffect(() => {
    document.body.classList.toggle("day-mode", dayMode);
    localStorage.setItem("dayMode", String(dayMode));
  }, [dayMode]);

  useEffect(function listenForCalendarOrientation() {
    const checkWindowWidth = () => {
      setVertical(window.innerWidth < 1300);
    };

    checkWindowWidth();

    window.addEventListener("resize", checkWindowWidth);

    return () => window.removeEventListener("resize", checkWindowWidth);
  }, []);

  useEffect(() => {
    const querySleepData = async () => {
      try {
        setLoading(true);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 8);

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        const response = await fetch(
          `/api/oura?start_date=${startDateStr}&end_date=${endDateStr}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: any[] = await response.json();

        const dates = data.reduce((dataMap, item) => {
          const itemObject = {
            ...item,
            bedtimeEnd: new Date(item.bedtimeEnd),
            bedtimeStart: new Date(item.bedtimeStart),
            day: new Date(item.day + 'T12:00:00'),
            sessions: item.sessions.map((session: any) => ({
              ...session,
              start: new Date(session.start),
              end: new Date(session.end),
            })),
          };
          return { ...dataMap, [itemObject.day.toDateString()]: itemObject };
        }, {} as { [dateString: string]: SleepData });

        setSleepData(dates);
      } catch (error) {
        console.error("Error fetching sleep data:", error);
      } finally {
        setLoading(false);
      }
    };

    querySleepData();
  }, []);

  return (
    <div className="app-container">
      <div className="clouds-layer" aria-hidden="true">
        <img className="cloud" src={cloud} alt="" />
        <img className="cloud" src={cloud} alt="" />
        <img className="cloud" src={cloud} alt="" />
        <img className="cloud" src={cloud} alt="" />
      </div>
      <div className="mode-toggle">
        <DarkModeSwitch
          checked={!dayMode}
          onChange={(isDark) => setDayMode(!isDark)}
          size={24}
          moonColor="#f4f4f4"
          sunColor="#4b4b4b"
        />
      </div>
      <div className="content-wrapper">
        <div className="header-section">
          <div className="title">
            ⋆˙⟡&nbsp;&nbsp;how is mina doing?&nbsp;&nbsp;⋆˙⟡
          </div>
          <div className="activity-legend">
            <span className="legend-title">activity</span>
            <span className="legend-item"><span className="legend-dot legend-low" />low</span>
            <span className="legend-item"><span className="legend-dot legend-medium" />medium</span>
            <span className="legend-item"><span className="legend-dot legend-high" />high</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-message">loading...</div>
          </div>
        ) : (
          <div className="scroll-wrapper">
            <div className="calendar-container">
              <div className="calendar-grid">
                {(vertical
                  ? lastSevenDaysReverseOrder
                  : lastSevenDaysForwardOrder
                ).map((date, i) => {
                  const daySleepData = sleepData[date.toDateString()];
                  return <ScoreCard key={i} data={daySleepData} day={date} />;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
