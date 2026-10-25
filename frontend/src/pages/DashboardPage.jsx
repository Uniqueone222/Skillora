import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Empty, Loading, Notice, PageTitle, formatINR } from "../components/ui.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/enrollments/my")
      .then(({ enrollments: result }) => setEnrollments(result))
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <div className="dashboard-welcome">
        <div><span className="eyebrow">Your learning space</span><h1>Welcome back, {user.name.split(" ")[0]}.</h1><p>Every skill starts with one small step. Pick up where you left off.</p></div>
        <Link className="button" to="/">Explore skills <span>↗</span></Link>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="section-heading"><PageTitle eyebrow="Your library" title="My courses" />{!loading && <span className="muted">{enrollments.length} enrolled</span>}</div>
      {loading ? <Loading label="Loading your learning…" /> : enrollments.length ? (
        <div className="enrollment-grid">{enrollments.map((enrollment) => {
          const course = enrollment.courseId;
          if (!course) return null;
          const lessonCount = course.modules?.reduce((count, module) => count + module.lessons.length, 0) || 0;
          const progress = lessonCount ? Math.round((enrollment.completedLessonIds.length / lessonCount) * 100) : 0;
          return <Link className="enrollment-card" key={enrollment._id} to={`/learn/${course._id}`}>
            <div className="enrollment-art"><span>{course.skillId?.name || "Course"}</span><b>{course.title.slice(0, 1).toUpperCase()}</b></div>
            <div className="enrollment-body"><span className="eyebrow">{course.skillId?.name}</span><h3>{course.title}</h3><p className="muted">with {course.educatorId?.name || "Independent educator"}</p><div className="progress-line"><i style={{ width: `${progress}%` }} /></div><span className="progress-caption">{progress}% complete · {lessonCount} lessons</span><span className="text-link">Continue learning ↗</span></div>
          </Link>;
        })}</div>
      ) : <Empty title="Your first course is waiting">Browse the skill catalogue and enroll in a course to see it here.</Empty>}
      <div className="dashboard-cta"><div><span className="eyebrow">Teach a skill of your own</span><h2>Share what you know.</h2><p>Your learner account can become an educator account at any time.</p></div><Link className="button button-outline" to="/educator">{user.capabilities.includes("educator") ? "Open educator studio" : "Activate educator mode"} <span>↗</span></Link></div>
    </div>
  );
}
