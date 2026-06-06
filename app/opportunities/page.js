"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OpportunitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userAddress, setUserAddress] = useState("");
  const [teacherOpportunities, setTeacherOpportunities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [signups, setSignups] = useState([]);

  useEffect(() => {
    async function loadData() {
      const savedUser = JSON.parse(localStorage.getItem("currentUser"));
      setCurrentUser(savedUser);

      const { data: signupData, error: signupError } = await supabase
        .from("signups")
        .select("*");

      if (signupError) {
        console.error("Error loading Supabase signups:", signupError);
      } else {
        const formattedSignups = signupData.map((signup) => ({
          id: signup.id,
          studentUsername: signup.student_username,
          studentName: signup.student_name,
          className: signup.class_name,
          opportunityId: signup.opportunity_id,
          opportunityTitle: signup.opportunity_title,
          opportunityLocation: signup.opportunity_location,
          opportunityHours: signup.opportunity_hours,
          teacherName: signup.teacher_name,
          teacherUsername: signup.teacher_username,
          status: signup.status,
          source: signup.source,
        }));

        setSignups(formattedSignups);
      }

      const { data: opportunityData, error: opportunityError } = await supabase
        .from("opportunities")
        .select("*")
        .order("event_date", { ascending: true });

      if (opportunityError) {
        console.error(
          "Error loading Supabase opportunities:",
          opportunityError
        );
        alert("Could not load teacher opportunities from Supabase.");
        return;
      }

      const formattedOpportunities = opportunityData.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        eventDate: item.event_date,
        startTime: item.start_time || "",
        endTime: item.end_time || "",
        hours: item.hours || 1,
        category: item.category || "Teacher Uploaded",
        maxSpots: item.max_spots || "",
        teacherName: item.teacher_name || "Unknown Teacher",
        teacherUsername: item.teacher_username || "unknown",
      }));

      setTeacherOpportunities(formattedOpportunities);
    }

    loadData();
  }, []);

  function openDirections(destination) {
    if (!userAddress) {
      alert("Please enter your address first.");
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      userAddress
    )}&destination=${encodeURIComponent(destination)}`;

    window.open(mapsUrl, "_blank");
  }

  async function signUpForTeacherOpportunity(opportunity) {
    if (!currentUser) {
      alert("Please log in before signing up.");
      window.location.href = "/login";
      return;
    }

    if (currentUser.role.toLowerCase() !== "student") {
      alert("Only students can sign up for volunteer activities.");
      return;
    }

    const alreadySignedUp = signups.some((signup) => {
      return (
        signup.studentUsername === currentUser.username &&
        signup.opportunityTitle === opportunity.title &&
        signup.status !== "disapproved"
      );
    });

    if (alreadySignedUp) {
      alert("You already signed up for this opportunity.");
      return;
    }

    const maxSpots = Number(opportunity.maxSpots);

    const activeSignupsForThisOpportunity = signups.filter((signup) => {
      return (
        signup.opportunityTitle === opportunity.title &&
        signup.status !== "disapproved"
      );
    });

    if (maxSpots && activeSignupsForThisOpportunity.length >= maxSpots) {
      alert("This opportunity is full.");
      return;
    }

    const newSignupForSupabase = {
      student_username: currentUser.username,
      student_name: currentUser.displayName,
      class_name: currentUser.className || "",
      opportunity_id: opportunity.id,
      opportunity_title: opportunity.title,
      opportunity_location: opportunity.location,
      opportunity_hours: opportunity.hours,
      teacher_name: opportunity.teacherName || "Unknown Teacher",
      teacher_username: opportunity.teacherUsername || "unknown",
      status: "pending",
      source: "teacher-opportunity-signup",
    };

    const { data, error } = await supabase
      .from("signups")
      .insert([newSignupForSupabase])
      .select()
      .single();

    if (error) {
      console.error("Error saving signup:", error);
      alert("Signup failed. Please try again.");
      return;
    }

    const newSignupForPage = {
      id: data.id,
      studentUsername: data.student_username,
      studentName: data.student_name,
      className: data.class_name,
      opportunityId: data.opportunity_id,
      opportunityTitle: data.opportunity_title,
      opportunityLocation: data.opportunity_location,
      opportunityHours: data.opportunity_hours,
      teacherName: data.teacher_name,
      teacherUsername: data.teacher_username,
      status: data.status,
      source: data.source,
    };

    setSignups((previousSignups) => [...previousSignups, newSignupForPage]);

    alert("Signup submitted for teacher approval!");
  }

  function getApprovedStudents(opportunityTitle) {
    return signups.filter((signup) => {
      return (
        signup.opportunityTitle === opportunityTitle &&
        signup.status === "approved"
      );
    });
  }

  function getActiveSignupCount(opportunityTitle) {
    return signups.filter((signup) => {
      return (
        signup.opportunityTitle === opportunityTitle &&
        signup.status !== "disapproved"
      );
    }).length;
  }

  const communityOpportunities = [
    {
      id: 1,
      title: "Teen Volunteers in Coppell",
      description:
        "Help with city programs, library activities, park events, environmental projects, and community service needs.",
      area: "Coppell",
      category: "City / Community",
      signupLink:
        "https://app.betterimpact.com/PublicOrganization/fe92d4d3-0fcf-4526-a9fd-7cd9d2c5a4d5/2",
      contact: "teenvolunteers@coppelltx.gov",
      ageRequirement: "13–17; must live in Coppell or attend Coppell ISD",
    },
    {
      id: 2,
      title: "Coppell Nature Park / Biodiversity Education Center",
      description:
        "Help with nature education, trail projects, habitat restoration, garden work, and environmental events.",
      area: "Coppell",
      category: "Environment",
      signupLink: "https://coppellparks.com/1131/Volunteer-With-Us",
      contact: "BEC@coppelltx.gov",
      ageRequirement: "13–17 for teen roles; adults may need background check",
    },
    {
      id: 3,
      title: "Keep Coppell Beautiful",
      description:
        "Help with litter cleanups, recycling awareness, beautification projects, and environmental service.",
      area: "Coppell",
      category: "Environment",
      signupLink: "https://www.coppelltx.gov/810/Coppell-Volunteers",
      contact: "teenvolunteers@coppelltx.gov",
      ageRequirement: "Usually 13–17 through Teen Volunteers in Coppell",
    },
    {
      id: 4,
      title: "Coppell Life Safety Park",
      description:
        "Help with safety education events, tours, family programs, and community safety activities.",
      area: "Coppell",
      category: "Education / Safety",
      signupLink:
        "https://www.justserve.org/projects/d1009330-6546-41b5-8c72-c8eb90ed580a",
      contact: "Use Life Safety Park / City contact",
      ageRequirement: "Confirm age",
    },
    {
      id: 5,
      title: "Coppell Connected: Neighbors Helping Neighbors",
      description:
        "Help neighbors with community support needs, service projects, and local assistance efforts.",
      area: "Coppell",
      category: "Community Service",
      signupLink:
        "https://www.justserve.org/projects/b500c2ae-8058-4137-9b3e-21d9daecd84a",
      contact: "neighbors@coppelltx.gov",
      ageRequirement: "Under 18 needs adult group leader",
    },
    {
      id: 6,
      title: "Coppell Community Garden",
      description:
        "Help plant, weed, harvest, maintain garden beds, and support garden service projects.",
      area: "Coppell",
      category: "Environment / Food",
      signupLink:
        "https://coppellcommunitygarden.org/get-involved/volunteer/",
      contact: "info@coppellcommunitygarden.org",
      ageRequirement: "Teens accepted; some adult roles 18+",
    },
    {
      id: 7,
      title: "Coppell Humane Society",
      description:
        "Help with animal supply drives, adoption support, foster support, donations, and animal welfare projects.",
      area: "Coppell / DFW",
      category: "Animals",
      signupLink: "https://www.coppellhumanesociety.org/membership-form",
      contact: "admin@coppellhumanesociety.org",
      ageRequirement: "Youth interest accepted; confirm approved role",
    },
    {
      id: 8,
      title: "Coppell Special Olympics",
      description:
        "Help athletes during practices, games, events, parades, fundraisers, and banquets.",
      area: "Coppell",
      category: "Special Needs / Sports",
      signupLink: "https://www.coppellso.org/volunteer",
      contact: "coppellsoteams@coppellso.org",
      ageRequirement: "Middle school+ for training assistant roles",
    },
    {
      id: 9,
      title: "Theatre Coppell",
      description:
        "Help with theatre productions, backstage support, ticketing, ushering, sets, costumes, and community theatre tasks.",
      area: "Coppell",
      category: "Arts",
      signupLink: "https://www.theatrecoppell.com/volunteer",
      contact: "volunteer@theatrecoppell.com",
      ageRequirement: "Some roles 12+ with adult; some 18+",
    },
    {
      id: 11,
      title: "Metrocrest Services",
      description:
        "Help in food pantry, resale store, seasonal drives, senior meal support, and family assistance programs.",
      area: "Carrollton",
      category: "Food & Hunger / Community",
      signupLink: "https://metrocrestservices.org/volunteer-opportunities/",
      contact: "info@metrocrestservices.org",
      ageRequirement: "13+; ages 13–15 with parent/guardian",
    },
    {
      id: 12,
      title: "Christian Community Action",
      description:
        "Help sort food, organize pantry items, support warehouse tasks, assist with seasonal programs, and help families in need.",
      area: "Lewisville",
      category: "Food & Hunger",
      signupLink: "https://www.ccahelps.org/volunteer/",
      contact: "volunteer@ccahelps.org",
      ageRequirement: "Many roles 12+; ages 12–15 with adult",
    },
    {
      id: 13,
      title: "North Texas Food Bank",
      description:
        "Pack food boxes, sort donations, prepare food for distribution, and help fight hunger across North Texas.",
      area: "Plano / DFW",
      category: "Food & Hunger",
      signupLink: "https://volunteer.ntfb.org/need/",
      contact: "214-330-1396",
      ageRequirement: "12+; ages 12–15 with adult",
    },
    {
      id: 15,
      title: "City of Lewisville Teen Volunteers",
      description:
        "Help with city events, library programs, parks projects, animal services, and community activities.",
      area: "Lewisville",
      category: "City / Community",
      signupLink: "https://www.cityoflewisville.com/how-do-i/volunteer",
      contact: "Use City of Lewisville volunteer contact",
      ageRequirement: "13–17",
    },
    {
      id: 16,
      title: "Lewisville Teen Court",
      description:
        "Serve as teen jurors, bailiffs, defense attorneys, prosecutors, or court volunteers in youth court programs.",
      area: "Lewisville",
      category: "Civic / Government",
      signupLink:
        "https://www.lewisvillecourt.com/court-appearance/juvenile-teen-court/volunteer-for-teen-court",
      contact: "Through Lewisville Teen Court portal",
      ageRequirement: "Teen roles; confirm exact age",
    },
    {
      id: 20,
      title: "Irving Arts Center Teen Volunteers",
      description:
        "Help with arts events, performances, gallery support, children’s art programs, and community events.",
      area: "Irving",
      category: "Arts",
      signupLink:
        "https://www.irvingartscenter.com/about/get-involved/volunteer/",
      contact: "artscentervolunteers@cityofirving.org",
      ageRequirement: "Area teens; confirm exact age",
    },
    {
      id: 21,
      title: "Irving Cares",
      description:
        "Help with food pantry support, donation sorting, client support programs, and community assistance.",
      area: "Irving",
      category: "Food & Hunger / Community",
      signupLink: "https://irvingcares.org/",
      contact: "Through Irving Cares volunteer page",
      ageRequirement: "Confirm age",
    },
    {
      id: 23,
      title: "Baylor Scott & White Health Volunteers",
      description:
        "Help in hospital departments, greet visitors, support patients, deliver items, and assist staff with non-clinical tasks.",
      area: "DFW / Grapevine",
      category: "Hospital / Healthcare",
      signupLink: "https://www.bswhealth.com/get-involved/become-a-volunteer",
      contact: "Through Baylor Scott & White volunteer page",
      ageRequirement: "Varies by site/program",
    },
    {
      id: 24,
      title: "VolunteerNow / VOLY",
      description:
        "Search platform for nonprofit opportunities including food banks, events, tutoring, shelters, and service projects.",
      area: "DFW-wide",
      category: "Volunteer Search Platform",
      signupLink: "https://volnow.org/",
      contact: "Through VOLY listings",
      ageRequirement: "Varies by opportunity",
    },
    {
      id: 25,
      title: "JustServe Youth Service — North & East Texas",
      description:
        "Search platform for youth-friendly service projects like donation drives, cleanups, food support, and community help.",
      area: "DFW-wide",
      category: "Volunteer Search Platform",
      signupLink: "https://www.justserve.org/youthservicedfw",
      contact: "Through JustServe listings",
      ageRequirement: "Varies by project",
    },
    {
      id: 26,
      title: "GRACE Grapevine",
      description:
        "Help with food pantry, clothing, donation sorting, seasonal events, client support, and community assistance.",
      area: "Grapevine",
      category: "Food & Hunger / Community",
      signupLink: "https://www.gracegrapevine.org/volunteer",
      contact: "Through GRACE volunteer coordinator",
      ageRequirement: "12–16 with parent/guardian; 17+ independently",
    },
    {
      id: 27,
      title: "City of Grapevine Volunteer Program",
      description:
        "Help with city events, parks, recreation, library activities, festivals, and community programs.",
      area: "Grapevine",
      category: "City / Community",
      signupLink: "https://www.grapevinetexas.gov/1003/Volunteer",
      contact: "City of Grapevine volunteer program",
      ageRequirement: "Varies by role",
    },
    {
      id: 28,
      title: "Grapevine Public Library VolunTEENS",
      description:
        "Help with library events, summer reading, youth programs, shelving, and teen activities.",
      area: "Grapevine",
      category: "Library / Education",
      signupLink: "https://www.grapevinetexas.gov/1692/Volunteens",
      contact: "Grapevine Public Library",
      ageRequirement: "Teen program; confirm age",
    },
    {
      id: 29,
      title: "GoGrapevine Volunteer Opportunities",
      description:
        "Help with parks, recreation events, sports programs, festivals, and community activities.",
      area: "Grapevine",
      category: "Parks / Recreation",
      signupLink: "https://gograpevine.com/get-involved/",
      contact: "Grapevine Parks & Recreation",
      ageRequirement: "Varies",
    },
    {
      id: 30,
      title: "Carrollton Public Library Teen Volunteers",
      description:
        "Help with library programs, children’s events, shelving, teen activities, and community learning support.",
      area: "Carrollton",
      category: "Library / Education",
      signupLink:
        "https://www.cityofcarrollton.com/departments/departments-g-p/library/i-want-to/volunteer-at-the-library",
      contact: "Carrollton Public Library",
      ageRequirement: "13–17",
    },
    {
      id: 31,
      title: "City of Carrollton Volunteer Opportunities",
      description:
        "Help with special events, libraries, environmental projects, animal services, and city programs.",
      area: "Carrollton",
      category: "City / Community",
      signupLink:
        "https://www.cityofcarrollton.com/residents/get-involved/volunteering-opportunities",
      contact: "City of Carrollton volunteer program",
      ageRequirement: "Varies by role",
    },
    {
      id: 32,
      title: "Carrollton Regional Medical Center Student Volunteers",
      description:
        "Help hospital staff with non-clinical support, guest services, and patient support tasks.",
      area: "Carrollton",
      category: "Hospital / Healthcare",
      signupLink: "https://crmc.health/contact-us/",
      contact: "Through CRMC volunteer program",
      ageRequirement: "16+ before application deadline",
    },
    {
      id: 33,
      title: "CFBISD Campus Volunteers",
      description:
        "Help with school events, classroom support, campus activities, and district programs.",
      area: "Carrollton / Farmers Branch",
      category: "School",
      signupLink: "https://www.cfbisd.edu/community/volunteer",
      contact: "CFBISD volunteer process",
      ageRequirement: "Mostly adult volunteers; background check required",
    },
    {
      id: 34,
      title: "Farmers Branch Teen Leadership Program",
      description:
        "Help with camps, recreation programs, leadership activities, and teen community service.",
      area: "Farmers Branch",
      category: "Leadership / Recreation",
      signupLink:
        "https://www.farmersbranchtx.gov/451/Teen-Camp---Teen-Leadership-Program",
      contact: "Farmers Branch Parks & Recreation",
      ageRequirement: "13–15",
    },
    {
      id: 35,
      title: "Plano Teen Volunteer Opportunities",
      description:
        "Help with city programs, libraries, recreation, camps, events, and community service projects.",
      area: "Plano",
      category: "City / Community",
      signupLink: "https://www.plano.gov/1271/Teen-Volunteer-Opportunities",
      contact: "City of Plano volunteer program",
      ageRequirement: "13–18",
    },
    {
      id: 36,
      title: "SPCA of Texas Youth Volunteers",
      description:
        "Help animals through shelter support, enrichment projects, supply drives, and youth/family service activities.",
      area: "Dallas / DFW",
      category: "Animals",
      signupLink: "https://spca.org/support-us/volunteer/ways-to-volunteer/",
      contact: "newvolunteer@spca.org",
      ageRequirement: "10–14 with adult; 15–17 youth program",
    },
    {
      id: 37,
      title: "Operation Kindness Junior Volunteer Night",
      description:
        "Take a shelter tour, complete hands-on service tasks, and interact with animals.",
      area: "Carrollton",
      category: "Animals",
      signupLink: "https://www.operationkindness.org/youth-volunteering/",
      contact: "Operation Kindness volunteer program",
      ageRequirement: "13–18",
    },
    {
      id: 38,
      title: "Dallas Area Habitat for Humanity Youth Volunteer",
      description:
        "Help with home builds, ReStore projects, repairs, and affordable housing support.",
      area: "Dallas / DFW",
      category: "Housing / Community",
      signupLink: "https://dallasareahabitat.org/volunteer/",
      contact: "Dallas Habitat volunteer program",
      ageRequirement: "Youth programs 14–18",
    },
    {
      id: 39,
      title: "Dallas Habitat Blue Hat Junior / ReStore",
      description:
        "Work at ReStore, learn retail operations, support donations, help customers, and build leadership skills.",
      area: "Dallas / DFW",
      category: "Housing / Retail Support",
      signupLink: "https://dallasareahabitat.org/youth/",
      contact: "Dallas Habitat volunteer program",
      ageRequirement: "14–18",
    },
    {
      id: 40,
      title: "Dallas Habitat School & College Chapters",
      description:
        "Organize school service projects, support ReStore, fundraise, advocate, and participate in Habitat projects.",
      area: "Dallas / DFW",
      category: "Housing / School Club",
      signupLink: "https://dallasareahabitat.org/school-college-chapters/",
      contact: "Dallas Habitat",
      ageRequirement: "ReStore 13+; construction 16+",
    },
    {
      id: 41,
      title: "Perot Museum Volunteers / Teen Programs",
      description:
        "Help with museum activities, science programs, guest engagement, exhibits, and teen leadership programs.",
      area: "Dallas",
      category: "STEM / Museum",
      signupLink: "https://www.perotmuseum.org/support/volunteer/",
      contact: "volunteers@perotmuseum.org",
      ageRequirement: "Teen program age varies",
    },
    {
      id: 42,
      title: "American Red Cross North Texas Youth Volunteers",
      description:
        "Help with preparedness education, blood drives, disaster support projects, and youth service programs.",
      area: "North Texas / DFW",
      category: "Health / Disaster Relief",
      signupLink:
        "https://www.redcross.org/local/texas/north-texas/volunteer/youth-programs.html",
      contact: "Red Cross North Texas",
      ageRequirement: "Under 18 with parent/guardian consent",
    },
    {
      id: 45,
      title: "Medical City Lewisville Summer Volunteers",
      description:
        "Support hospital departments, help visitors, assist staff, and perform non-medical volunteer duties.",
      area: "Lewisville",
      category: "Hospital / Healthcare",
      signupLink:
        "https://www.medicalcityhealthcare.com/locations/medical-city-lewisville-hospital/about-us/summer-volunteer-program",
      contact: "Medical City Lewisville",
      ageRequirement: "16+",
    },
    {
      id: 46,
      title: "Dallas Public Library Volunteers",
      description:
        "Help with library programs, events, shelving, tutoring support, and community learning activities.",
      area: "Dallas",
      category: "Library / Education",
      signupLink: "https://www.dallaslibrary.org/about/volunteer",
      contact: "libvolunteers@dallas.gov",
      ageRequirement: "Varies by role",
    },
    {
      id: 48,
      title: "Meals on Wheels Local Provider",
      description:
        "Help deliver meals, support seniors, write cards, organize drives, or assist local meal programs.",
      area: "DFW",
      category: "Senior Support / Hunger",
      signupLink: "https://www.mealsonwheelsamerica.org/volunteer/",
      contact: "Local provider",
      ageRequirement: "Usually adult driver; youth may help with parent",
    },
    {
      id: 50,
      title: "Humane Society of North Texas",
      description:
        "Help with animal care support, shelter tasks, adoption events, donation drives, and animal welfare programs.",
      area: "DFW / Keller / Fort Worth",
      category: "Animals",
      signupLink: "https://www.hsnt.org/volunteer",
      contact: "Through HSNT volunteer page",
      ageRequirement: "Varies by role",
    },
  ];

  const allCategories = [
    "All",
    ...new Set([
      ...communityOpportunities.map((opportunity) => opportunity.category),
      ...teacherOpportunities.map((opportunity) => opportunity.category),
    ]),
  ];

  const filteredTeacherOpportunities =
    selectedCategory === "All"
      ? teacherOpportunities
      : teacherOpportunities.filter((opportunity) => {
          return opportunity.category === selectedCategory;
        });

  const filteredCommunityOpportunities =
    selectedCategory === "All"
      ? communityOpportunities
      : communityOpportunities.filter((opportunity) => {
          return opportunity.category === selectedCategory;
        });

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <h2 style={logoStyle}>Vonnect</h2>

        <div style={navLinksStyle}>
          <a href="/" style={linkStyle}>
            Home
          </a>
          <a href="/opportunities" style={linkStyle}>
            Opportunities
          </a>
          <a href="/track-hours" style={linkStyle}>
            Track Hours
          </a>
          <a href="/leaderboard" style={linkStyle}>
            Leaderboard
          </a>
          <a href="/about" style={linkStyle}>
            About
          </a>
        </div>
      </nav>

      <section style={headerStyle}>
        <h1 style={titleStyle}>Volunteer Opportunities</h1>
        <p style={subtitleStyle}>
          Browse Coppell-area volunteer opportunities and teacher-created
          opportunities to make your search easy and find the perfect fit for
          your interests and schedule.
        </p>

        {currentUser ? (
          <p style={loginTextStyle}>
            Logged in as {currentUser.displayName} ({currentUser.role})
          </p>
        ) : (
          <p style={loginTextStyle}>
            <a href="/login" style={loginLinkStyle}>
              Log in
            </a>{" "}
            to sign up for teacher activities.
          </p>
        )}
      </section>

      <section style={filterSectionStyle}>
        <div>
          <label style={filterLabelStyle}>Your address:</label>
          <input
            style={selectStyle}
            placeholder="Example: 123 Main St, Coppell, TX"
            value={userAddress}
            onChange={(event) => setUserAddress(event.target.value)}
          />
        </div>

        <div>
          <label style={filterLabelStyle}>Choose category:</label>
          <select
            style={selectStyle}
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {allCategories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p style={resultsTextStyle}>
        Showing{" "}
        {filteredTeacherOpportunities.length +
          filteredCommunityOpportunities.length}{" "}
        opportunities
      </p>

      <section style={sectionBlockStyle}>
        <h2 style={sectionHeadingStyle}>Teacher Uploaded Opportunities</h2>

        {filteredTeacherOpportunities.length === 0 ? (
          <p style={emptyTextStyle}>
            No teacher-uploaded opportunities match this filter yet.
          </p>
        ) : (
          <div style={listStyle}>
            {filteredTeacherOpportunities.map((opportunity, index) => {
              const approvedStudents = getApprovedStudents(opportunity.title);
              const activeSignupCount = getActiveSignupCount(opportunity.title);
              const maxSpots = Number(opportunity.maxSpots);
              const isFull = maxSpots && activeSignupCount >= maxSpots;

              return (
                <div style={teacherCardStyle} key={opportunity.id || index}>
                  <p style={teacherBadgeStyle}>Teacher Uploaded</p>

                  <h3 style={cardTitleStyle}>{opportunity.title}</h3>

                  <p style={cardTextStyle}>{opportunity.description}</p>

                  <p style={cardTextStyle}>
                    <strong>Location:</strong> {opportunity.location}
                  </p>

                  <p style={cardTextStyle}>
                    <strong>Date:</strong>{" "}
                    {opportunity.eventDate || "No date listed"}
                  </p>

                  <p style={cardTextStyle}>
                    <strong>Time:</strong>{" "}
                    {opportunity.startTime && opportunity.endTime
                      ? `${opportunity.startTime} - ${opportunity.endTime}`
                      : "No time listed"}
                  </p>

                  <p style={cardTextStyle}>
                    <strong>Hours:</strong> {opportunity.hours} hours
                  </p>

                  <p style={cardTextStyle}>
                    <strong>Category:</strong> {opportunity.category}
                  </p>

                  <p style={cardTextStyle}>
                    <strong>Uploaded by:</strong>{" "}
                    {opportunity.teacherName || "Unknown Teacher"}
                  </p>

                  <p style={spotsStyle}>
                    <strong>Spots:</strong> {activeSignupCount}/
                    {opportunity.maxSpots || "No limit"} filled
                  </p>

                  <button
                    style={directionsButtonStyle}
                    onClick={() => openDirections(opportunity.location)}
                  >
                    Get Distance / Directions
                  </button>

                  {isFull ? (
                    <button style={fullButtonStyle} disabled>
                      Opportunity Full
                    </button>
                  ) : (
                    <button
                      style={signupButtonStyle}
                      onClick={() => signUpForTeacherOpportunity(opportunity)}
                    >
                      Sign Up for This Opportunity
                    </button>
                  )}

                  <details style={detailsStyle}>
                    <summary style={summaryStyle}>
                      Approved Students ({approvedStudents.length})
                    </summary>

                    {approvedStudents.length === 0 ? (
                      <p style={cardTextStyle}>No approved students yet.</p>
                    ) : (
                      <ul style={approvedListStyle}>
                        {approvedStudents.map((signup) => (
                          <li key={signup.id}>{signup.studentName}</li>
                        ))}
                      </ul>
                    )}
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={sectionBlockStyle}>
        <h2 style={sectionHeadingStyle}>Coppell-Area Community Opportunities</h2>

        <div style={listStyle}>
          {filteredCommunityOpportunities.map((opportunity) => (
            <div style={opportunityCardStyle} key={opportunity.id}>
              <p style={categoryStyle}>{opportunity.category}</p>

              <h3 style={cardTitleStyle}>{opportunity.title}</h3>

              <p style={cardTextStyle}>{opportunity.description}</p>

              <p style={cardTextStyle}>
                <strong>Area:</strong> {opportunity.area}
              </p>

              <p style={cardTextStyle}>
                <strong>Age:</strong> {opportunity.ageRequirement}
              </p>

              <p style={cardTextStyle}>
                <strong>Contact:</strong> {opportunity.contact}
              </p>

              <button
                style={directionsButtonStyle}
                onClick={() =>
                  openDirections(
                    `${opportunity.title}, ${opportunity.area}, Texas`
                  )
                }
              >
                Get Distance / Directions
              </button>

              <a
                href={opportunity.signupLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button style={buttonStyle}>Open Signup Link</button>
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  fontFamily: "Roboto,Segoe UI, Arial",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 40px",
  backgroundColor: "white",
  borderBottom: "1px solid #e5e7eb",
};

const logoStyle = {
  margin: 0,
  color: "#2563eb",
};

const navLinksStyle = {
  display: "flex",
  gap: "24px",
};

const linkStyle = {
  color: "#374151",
  fontSize: "16px",
  fontFamily: "Roboto,Segoe UI, Arial",
  cursor: "pointer",
  textDecoration: "none",
};

const headerStyle = {
  padding: "60px 40px",
  textAlign: "center",
  backgroundColor: "#c7ebfa",
};

const titleStyle = {
  fontSize: "42px",
  marginBottom: "16px",
  color: "#111827",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const subtitleStyle = {
  fontSize: "18px",
  color: "#374151",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const loginTextStyle = {
  marginTop: "16px",
  color: "#374151",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const loginLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
};

const filterSectionStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "24px",
  padding: "30px 40px 0",
  flexWrap: "wrap",
};

const filterLabelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
  color: "#111827",
};

const selectStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #9ca3af",
  fontSize: "16px",
  color: "#111827",
  backgroundColor: "white",
  fontFamily: "Roboto,Segoe UI, Arial",
  minWidth: "260px",
};

const resultsTextStyle = {
  textAlign: "center",
  marginTop: "24px",
  color: "#374151",
  fontWeight: 600,
};

const sectionBlockStyle = {
  padding: "30px 40px",
};

const sectionHeadingStyle = {
  fontSize: "28px",
  color: "#111827",
  marginBottom: "20px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const listStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
};

const opportunityCardStyle = {
  backgroundColor: "white",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const teacherCardStyle = {
  backgroundColor: "#fffbeb",
  padding: "28px",
  borderRadius: "16px",
  border: "2px solid #f59e0b",
  boxShadow: "0 4px 12px rgba(149, 216, 247, 0.31)",
};

const categoryStyle = {
  display: "inline-block",
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const teacherBadgeStyle = {
  display: "inline-block",
  backgroundColor: "#f59e0b",
  color: "#111827",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: 700,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const cardTitleStyle = {
  color: "#111827",
};

const cardTextStyle = {
  color: "#374151",
  lineHeight: "1.5",
};

const spotsStyle = {
  color: "#111827",
  backgroundColor: "#fef3c7",
  padding: "10px",
  borderRadius: "8px",
  lineHeight: "1.5",
};

const emptyTextStyle = {
  color: "#6b7280",
  fontSize: "16px",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const buttonStyle = {
  marginTop: "16px",
  padding: "10px 18px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const directionsButtonStyle = {
  marginTop: "16px",
  marginRight: "10px",
  padding: "10px 18px",
  backgroundColor: "#7c3aed",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const signupButtonStyle = {
  marginTop: "16px",
  padding: "10px 18px",
  backgroundColor: "#047857",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const fullButtonStyle = {
  marginTop: "16px",
  padding: "10px 18px",
  backgroundColor: "#9ca3af",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "not-allowed",
  fontWeight: 600,
  fontFamily: "Roboto,Segoe UI, Arial",
};

const detailsStyle = {
  marginTop: "18px",
  backgroundColor: "white",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
};

const summaryStyle = {
  cursor: "pointer",
  fontWeight: 700,
  color: "#111827",
  fontFamily: "Roboto,Segoe UI, Arial",
};

const approvedListStyle = {
  color: "#374151",
  lineHeight: "1.8",
};