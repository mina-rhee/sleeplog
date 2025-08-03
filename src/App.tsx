import React, { useEffect, useState } from "react";
import "./App.css";
import ScoreCard, { SleepData } from "./ScoreCard";

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const lastSevenDaysReverseOrder = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (i + 1));
  return date;
});

const lastSevenDaysForwardOrder = [...lastSevenDaysReverseOrder].reverse();

const App: React.FC = () => {
  const [sleepData, setSleepData] = useState<{
    [dateString: string]: SleepData;
  }>({});
  const [loading, setLoading] = useState(true);
  const [vertical, setVertical] = useState(true);

  useEffect(function listenForCalendarOrientation() {
    const checkWindowWidth = () => {
      console.log("setting vertical", window.innerWidth < 1300);
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

        // Calculate date range: yesterday to a week before
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 8); // 7 days total including yesterday

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        console.log("1");
        const response = await fetch(
          `/api/oura?start_date=${startDateStr}&end_date=${endDateStr}`
        );
        console.log(response);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: any[] = await response.json();

        // Convert date strings to Date objects
        const dates = data.reduce((dataMap, item) => {
          const itemObject = {
            ...item,
            bedtimeEnd: new Date(item.bedtimeEnd),
            bedtimeStart: new Date(item.bedtimeStart),
            day: new Date(item.day),
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
      <div className="content-wrapper">
        <div className="header-section">
          <div className="title">
            ⋆˙⟡&nbsp;&nbsp;how did mina sleep?&nbsp;&nbsp;⋆˙⟡
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <img className="loading-clouds" src="/clouds.gif" />
            <div className="loading-message">
              loading{" "}
              <span className="dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default App;
