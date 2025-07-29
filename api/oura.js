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
      fetch(
        `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${start_date}&end_date=${end_date}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OURA_ACCESS_TOKEN}`,
          },
        }
      ),
      fetch(
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
    const combinedData = Array.from(sleepByDay.entries()).map(
      ([day, sessions]) => {
        const dailyData = dailySleepMap.get(day);

        const totalSleepDuration = sessions.reduce(
          (sleepDuration, session) =>
            session.total_sleep_duration + sleepDuration,
          0
        );

        const mainSession = sessions.sort((a, b) => {
          if (a.type === "long_sleep") return -1;
          if (b.type === "long_sleep") return -1;
          return b.totalSleepDuration - a.totalSleepDuration;
        })[0];

        return {
          bedtimeEnd: new Date(mainSession.bedtime_end),
          bedtimeStart: new Date(mainSession.bedtime_start),
          day: new Date(day),
          sleepScore: dailyData ? dailyData.score || 0 : 0,
          totalSleep: totalSleepDuration, // Total sleep across all sessions
          sessions: sessions.map((session) => ({
            start: new Date(session.bedtime_start),
            end: new Date(session.bedtime_end),
            phases: session.sleep_phase_5_min,
            lowestHeartRate: session.lowest_heart_rate,
            averageHRV: session.average_hrv,
          })),
        };
      }
    );

    console.log(`Combined data created: ${combinedData.length} records`);

    res.json(combinedData);
  } catch (error) {
    console.error("Error fetching Oura data:", error.message);

    // Handle specific HTTP errors
    if (error.message.includes("401")) {
      res.status(401).json({ error: "Invalid Oura API token" });
    } else if (error.message.includes("429")) {
      res.status(429).json({ error: "Rate limit exceeded" });
    } else {
      res.status(500).json({ error: "Failed to fetch sleep data" });
    }
  }
}
