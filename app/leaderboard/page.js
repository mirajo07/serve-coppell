"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LeaderboardPage() {
  const [leaderboardStudents, setLeaderboardStudents] = useState([]);
  const [categoryLeaderboards, setCategoryLeaderboards] = useState([]);
  const [filterType, setFilterType] = useState("all-time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    "Community Service",
    "Food & Hunger",
    "Environment",
    "Animals",
    "Library / Education",
    "Arts",
    "Hospital / Healthcare",
    "Senior Support",
    "School",
  ];

  useEffect(() => {
    buildLeaderboard();
  }, [filterType, customStartDate, customEndDate]);

  async function buildLeaderboard() {
    setLoading(true);

    const { data: manualHoursData, error: manualHoursError } = await supabase
      .from("volunteer_hours")
      .select("*");

    const { data: signupsData, error: signupsError } = await supabase
      .from("signups")
      .select("*, opportunities(event_date, category)");

    if (manualHoursError) {
      console.error("Error loading manual hours:", manualHoursError);
    }

    if (signupsError) {
      console.error("Error loading signup hours:", signupsError);
    }

    const studentTotals = {};
    const categoryTotals = {};

    categories.forEach((category) => {
      categoryTotals[category] = {};
    });

    function addHoursToStudent(studentUsername, studentName, hours) {
      const key = studentUsername || studentName;

      if (!key) {
        return;
      }

      if (!studentTotals[key]) {
        studentTotals[key] = {
          username: studentUsername || studentName,
          name: studentName || studentUsername,
          totalHours: 0,
          eventCount: 0,
        };
      }

      studentTotals[key].totalHours = studentTotals[key].totalHours + hours;
      studentTotals[key].eventCount = studentTotals[key].eventCount + 1;
    }

    function addHoursToCategory(category, studentUsername, studentName, hours) {
      const cleanCategory = category || "Community Service";

      if (!categoryTotals[cleanCategory]) {
        categoryTotals[cleanCategory] = {};
      }

      const key = studentUsername || studentName;

      if (!key) {
        return;
      }

      if (!categoryTotals[cleanCategory][key]) {
        categoryTotals[cleanCategory][key] = {
          username: studentUsername || studentName,
          name: studentName || studentUsername,
          categoryHours: 0,
          eventCount: 0,
        };
      }

      categoryTotals[cleanCategory][key].categoryHours =
        categoryTotals[cleanCategory][key].categoryHours + hours;

      categoryTotals[cleanCategory][key].eventCount =
        categoryTotals[cleanCategory][key].eventCount + 1;
    }

    if (manualHoursData) {
      manualHoursData.forEach((entry) => {
        if (entry.status && entry.status !== "approved") {
          return;
        }

        const entryDate = entry.event_date || entry.created_at || "";

        if (!isDateInSelectedRange(entryDate)) {
          return;
        }

        const hours = Number(entry.hours) || 0;
        const category = entry.category || "Community Service";

        addHoursToStudent(entry.student_username, entry.student_name, hours);

        addHoursToCategory(
          category,
          entry.student_username,
          entry.student_name,
          hours
        );
      });
    }

    if (signupsData) {
      signupsData.forEach((signup) => {
        if (signup.source !== "teacher-opportunity-signup") {
          return;
        }

        if (signup.status !== "completed") {
          return;
        }

        const eventDate =
          signup.opportunities?.event_date ||
          signup.teacher_signed_at ||
          signup.created_at ||
          "";

        if (!isDateInSelectedRange(eventDate)) {
          return;
        }

        const hours = Number(signup.opportunity_hours) || 0;
        const category = signup.opportunities?.category || "Community Service";

        addHoursToStudent(signup.student_username, signup.student_name, hours);

        addHoursToCategory(
          category,
          signup.student_username,
          signup.student_name,
          hours
        );
      });
    }

    const leaderboardArray = Object.keys(studentTotals).map((key) => {
      return studentTotals[key];
    });

    leaderboardArray.sort((a, b) => {
      return b.totalHours - a.totalHours;
    });

    const categoryLeaderboardArray = categories.map((category) => {
      const studentsObject = categoryTotals[category] || {};

      const studentsArray = Object.keys(studentsObject).map((key) => {
        return studentsObject[key];
      });

      studentsArray.sort((a, b) => {
        return b.categoryHours - a.categoryHours;
      });

      return {
        category,
        students: studentsArray.slice(0, 3),
      };
    });

    setLeaderboardStudents(leaderboardArray);
    setCategoryLeaderboards(categoryLeaderboardArray);
    setLoading(false);
  }

  function isDateInSelectedRange(dateValue) {
    if (filterType === "all-time") {
      return true;
    }

    if (!dateValue) {
      return false;
    }

    const dateOnly = getDateOnly(dateValue);

    if (!dateOnly) {
      return false;
    }

    const eventDate = new Date(dateOnly + "T00:00:00");

    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (filterType === "this-week") {
      const startOfWeek = new Date(todayOnly);
      startOfWeek.setDate(todayOnly.getDate() - todayOnly.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }

    if (filterType === "this-month") {
      return (
        eventDate.getMonth() === todayOnly.getMonth() &&
        eventDate.getFullYear() === todayOnly.getFullYear()
      );
    }

    if (filterType === "custom") {
      if (!customStartDate || !customEndDate) {
        return true;
      }

      const startDate = new Date(customStartDate + "T00:00:00");
      const endDate = new Date(customEndDate + "T23:59:59");

      return eventDate >= startDate && eventDate <= endDate;
    }

    return true;
  }

  function getDateOnly(dateValue) {
    if (!dateValue) {
      return "";
    }

    if (typeof dateValue === "string" && dateValue.includes("T")) {
      return dateValue.split("T")[0];
    }

    if (
      typeof dateValue === "string" &&
      dateValue.length >= 10 &&
      dateValue[4] === "-" &&
      dateValue[7] === "-"
    ) {
      return dateValue.slice(0, 10);
    }

    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const allTotalHours = leaderboardStudents.reduce((total, student) => {
    return total + student.totalHours;
  }, 0);

  const totalEvents = leaderboardStudents.reduce((total, student) => {
    return total + student.eventCount;
  }, 0);

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <h1 style={titleStyle}>Full Leaderboard 🎉🏆</h1>

        <p style={subtitleStyle}>
          This leaderboard adds all counted hours together into one total.
        </p>
      </section>

      <section style={filterSectionStyle}>
        <div style={filterCardStyle}>
          <label style={filterLabelStyle}>Sort / Filter by Date</label>

          <select
            style={selectStyle}
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option value="all-time">All Time</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="custom">Chosen Date to Chosen Date</option>
          </select>

          {filterType === "custom" && (
            <div style={dateRangeStyle}>
              <div>
                <label style={smallLabelStyle}>Start Date</label>
                <input
                  style={dateInputStyle}
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </div>

              <div>
                <label style={smallLabelStyle}>End Date</label>
                <input
                  style={dateInputStyle}
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={summarySectionStyle}>
        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{allTotalHours}</h2>
          <p style={summaryTextStyle}>All Total Hours</p>
        </div>

        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{leaderboardStudents.length}</h2>
          <p style={summaryTextStyle}>Students on Leaderboard</p>
        </div>

        <div style={summaryCardStyle}>
          <h2 style={summaryNumberStyle}>{totalEvents}</h2>
          <p style={summaryTextStyle}>Total Logged Events</p>
        </div>
      </section>

      <section style={encouragementSectionStyle}>
        <div style={encouragementCardStyle}>
          <h2 style={encouragementTitleStyle}>Keep Going!</h2>

          <p style={encouragementTextStyle}>
            Every service hour helps your community. Track your hours, sign up
            for opportunities, and keep building your service record.
          </p>
        </div>
      </section>

      <section style={leaderboardSectionStyle}>
        <div style={leaderboardCardStyle}>
          <div style={leaderboardTitleBarStyle}>
            <h2 style={leaderboardTitleStyle}>Main Leaderboard</h2>
          </div>

          <div style={tableHeaderStyle}>
            <span>Rank</span>
            <span>Student</span>
            <span>Events</span>
            <span>Hours</span>
          </div>

          {loading ? (
            <p style={emptyTextStyle}>Loading leaderboard...</p>
          ) : leaderboardStudents.length === 0 ? (
            <p style={emptyTextStyle}>
              No hours found for this selected time period.
            </p>
          ) : (
            leaderboardStudents.map((student, index) => (
              <div style={tableRowStyle} key={student.username}>
                <span style={rankStyle}>
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}
                </span>

                <span>{student.name}</span>

                <span>{student.eventCount}</span>

                <span style={hoursStyle}>{student.totalHours}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={categorySectionStyle}>
        <div style={categoryHeaderCardStyle}>
          <h2 style={categoryMainTitleStyle}>Top 3 Students by Category</h2>

          <p style={categoryMainTextStyle}>
            
          </p>
        </div>

        <div style={categoryGridStyle}>
          {categoryLeaderboards.map((categoryBoard) => (
            <div style={categoryCardStyle} key={categoryBoard.category}>
              <h3 style={categoryTitleStyle}>{categoryBoard.category}</h3>

              {loading ? (
                <p style={categoryEmptyStyle}>Loading...</p>
              ) : categoryBoard.students.length === 0 ? (
                <p style={categoryEmptyStyle}>No hours yet.</p>
              ) : (
                <div style={categoryListStyle}>
                  {categoryBoard.students.map((student, index) => (
                    <div style={categoryRowStyle} key={student.username}>
                      <span style={categoryRankStyle}>
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : "🥉"}
                      </span>

                      <span style={categoryStudentNameStyle}>
                        {student.name}
                      </span>

                      <span style={categoryHoursStyle}>
                        {student.categoryHours} hrs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto, Segoe UI, Arial",
  backgroundColor: "#d2dbe4",
  minHeight: "100vh",
};

const headerStyle = {
  padding: "70px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  fontFamily: "Roboto, Segoe UI, Arial",
  color: "#111827",
  marginBottom: "16px",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  fontFamily: "Roboto, Segoe UI, Arial",
  maxWidth: "800px",
  margin: "0 auto",
  lineHeight: "1.6",
};

const filterSectionStyle = {
  padding: "30px 40px 0",
  display: "flex",
  justifyContent: "center",
};

const filterCardStyle = {
  width: "100%",
  maxWidth: "850px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const filterLabelStyle = {
  display: "block",
  color: "#111827",
  fontWeight: 700,
  marginBottom: "10px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #9ca3af",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const dateRangeStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginTop: "18px",
};

const smallLabelStyle = {
  display: "block",
  color: "#374151",
  fontWeight: 700,
  marginBottom: "8px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const dateInputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #9ca3af",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const summarySectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  padding: "30px 40px 0",
};

const summaryCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "22px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const summaryNumberStyle = {
  fontSize: "38px",
  color: "#f97316",
  margin: 0,
  fontFamily: "Roboto, Segoe UI, Arial",
};

const summaryTextStyle = {
  color: "#374151",
  fontWeight: 700,
  fontFamily: "Roboto, Segoe UI, Arial",
};

const encouragementSectionStyle = {
  padding: "30px 40px 0",
  display: "flex",
  justifyContent: "center",
};

const encouragementCardStyle = {
  width: "100%",
  maxWidth: "850px",
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "16px",
  padding: "24px",
  textAlign: "center",
};

const encouragementTitleStyle = {
  color: "#1d4ed8",
  marginTop: 0,
  fontFamily: "Roboto, Segoe UI, Arial",
};

const encouragementTextStyle = {
  color: "#374151",
  fontSize: "17px",
  fontFamily: "Roboto, Segoe UI, Arial",
  lineHeight: "1.6",
};

const leaderboardSectionStyle = {
  padding: "50px 40px 30px",
  display: "flex",
  justifyContent: "center",
};

const leaderboardCardStyle = {
  width: "100%",
  maxWidth: "950px",
  backgroundColor: "white",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
  overflow: "hidden",
};

const leaderboardTitleBarStyle = {
  padding: "20px 24px",
  backgroundColor: "white",
  borderBottom: "1px solid #e5e7eb",
};

const leaderboardTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: "26px",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr 1fr 1.5fr",
  gap: "16px",
  padding: "18px 24px",
  backgroundColor: "#f97316",
  color: "white",
  fontWeight: 700,
  fontFamily: "Roboto, Segoe UI, Arial",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr 1fr 1.5fr",
  gap: "16px",
  padding: "18px 24px",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
  alignItems: "center",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const rankStyle = {
  fontWeight: 700,
  color: "#ea580c",
  fontSize: "22px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const hoursStyle = {
  fontWeight: 900,
  color: "#000000",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const emptyTextStyle = {
  padding: "24px",
  textAlign: "center",
  color: "#374151",
  fontSize: "18px",
  fontFamily: "Roboto, Segoe UI, Arial",
};

const categorySectionStyle = {
  padding: "10px 40px 70px",
};

const categoryHeaderCardStyle = {
  maxWidth: "950px",
  margin: "0 auto 24px",
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "24px",
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const categoryMainTitleStyle = {
  marginTop: 0,
  marginBottom: "8px",
  color: "#111827",
  fontSize: "30px",
};

const categoryMainTextStyle = {
  color: "#374151",
  fontSize: "16px",
  margin: 0,
};

const categoryGridStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "20px",
};

const categoryCardStyle = {
  backgroundColor: "white",
  border: "1px solid #d1d5db",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const categoryTitleStyle = {
  color: "#111827",
  fontSize: "22px",
  marginTop: 0,
  marginBottom: "16px",
};

const categoryListStyle = {
  display: "grid",
  gap: "12px",
};

const categoryRowStyle = {
  display: "grid",
  gridTemplateColumns: "44px 1fr auto",
  gap: "10px",
  alignItems: "center",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px",
};

const categoryRankStyle = {
  fontSize: "22px",
};

const categoryStudentNameStyle = {
  color: "#111827",
  fontWeight: 700,
};

const categoryHoursStyle = {
  color: "#ea580c",
  fontWeight: 900,
};

const categoryEmptyStyle = {
  color: "#6b7280",
  backgroundColor: "#f9fafb",
  border: "1px dashed #d1d5db",
  borderRadius: "12px",
  padding: "14px",
  textAlign: "center",
};