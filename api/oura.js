const axios = require("axios");

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("API called with params:", req.query);

  const { start_date, end_date } = req.query;

  // Validate required parameters
  if (!start_date || !end_date) {
    return res.status(400).json({
      error: "Both start_date and end_date parameters are required",
    });
  }

  try {
    console.log("Fetching from Oura API...");

    // Fetch both endpoints concurrently
    const [dailySleepResponse, sleepResponse] = await Promise.all([
      axios.get(
        `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OURA_ACCESS_TOKEN}`,
          },
        }
      ),
      axios.get(
        `https://api.ouraring.com/v2/usercollection/sleep?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OURA_ACCESS_TOKEN}`,
          },
        }
      ),
    ]);

    console.log("Oura API responses received");

    const dailySleepData = dailySleepResponse.data.data || [];
    const sleepData = sleepResponse.data.data || [];

    console.log(
      `Daily sleep records: ${dailySleepData.length}, Sleep records: ${sleepData.length}`
    );

    // Create a map of daily sleep data by date for quick lookup
    const dailySleepMap = new Map();
    dailySleepData.forEach((dayData) => {
      dailySleepMap.set(dayData.day, dayData);
    });

    // Group sleep sessions by day and aggregate them
    const sleepByDay = new Map();

    sleepData
      .filter((sleep) => sleep.type !== "deleted") // Filter out deleted records
      .forEach((sleep) => {
        if (!sleepByDay.has(sleep.day)) {
          sleepByDay.set(sleep.day, []);
        }
        sleepByDay.get(sleep.day).push(sleep);
      });

    // Process each day's sleep sessions and combine into single objects
    const combinedData = Array.from(sleepByDay.entries())
      .map(([day, sessions]) => {
        const dailyData = dailySleepMap.get(day);

        // Sort sessions by bedtime_start to find earliest and latest
        const sortedSessions = sessions.sort(
          (a, b) =>
            new Date(a.bedtime_start).getTime() -
            new Date(b.bedtime_start).getTime()
        );

        // Aggregate data across all sessions for this day
        let totalSleepDuration = 0;
        let allHrvValues = [];
        let lowestHeartRates = [];

        sortedSessions.forEach((session) => {
          // Sum total sleep duration
          totalSleepDuration += session.total_sleep_duration || 0;

          // Collect all HRV values
          if (
            session.hrv &&
            session.hrv.items &&
            session.hrv.items.length > 0
          ) {
            const validHrvValues = session.hrv.items.filter(
              (value) => value > 0
            );
            allHrvValues.push(...validHrvValues);
          }

          // Collect heart rates to find the lowest
          if (session.lowest_heart_rate && session.lowest_heart_rate > 0) {
            lowestHeartRates.push(session.lowest_heart_rate);
          }
        });

        // Calculate aggregated values
        const averageHrv =
          allHrvValues.length > 0
            ? allHrvValues.reduce((sum, value) => sum + value, 0) /
              allHrvValues.length
            : 0;

        const overallLowestHeartRate =
          lowestHeartRates.length > 0 ? Math.min(...lowestHeartRates) : 0;

        // Use earliest bedtime_start and latest bedtime_end
        const earliestSession = sortedSessions[0];
        const latestSession = sortedSessions.reduce((latest, current) =>
          new Date(current.bedtime_end) > new Date(latest.bedtime_end)
            ? current
            : latest
        );

        return {
          bedtimeEnd: new Date(latestSession.bedtime_end),
          bedtimeStart: new Date(earliestSession.bedtime_start),
          day: new Date(day),
          sleepScore: dailyData ? dailyData.score || 0 : 0,
          hrv: Math.round(averageHrv),
          totalSleep: totalSleepDuration, // Total sleep across all sessions
          lowestHeartRate: overallLowestHeartRate,
        };
      })
      // Sort by day in ascending order
      .sort((a, b) => a.day.getTime() - b.day.getTime());

    console.log(`Combined data created: ${combinedData.length} records`);

    res.json(combinedData);
  } catch (error) {
    console.error(
      "Error fetching Oura data:",
      error.response?.data || error.message
    );

    // Handle specific Oura API errors
    if (error.response?.status === 401) {
      res.status(401).json({ error: "Invalid Oura API token" });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: "Rate limit exceeded" });
    } else {
      res.status(500).json({ error: "Failed to fetch sleep data" });
    }
  }
}
