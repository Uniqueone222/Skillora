import { useEffect, useState } from "react";
import { errorMessage, request } from "../api.js";
import { Loading, Notice, PageTitle } from "../components/ui.jsx";

export default function AdminPage() {
  const [skillRequests, setSkillRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    const [skills, courseResult] = await Promise.all([
      request("/admin/skill-requests"),
      request("/admin/courses/pending")
    ]);
    setSkillRequests(skills.requests);
    setCourses(courseResult.courses);
  }

  useEffect(() => {
    loadQueue().catch((reason) => setError(errorMessage(reason))).finally(() => setLoading(false));
  }, []);

  async function reviewSkill(requestId, status) {
    if (status === "rejected" && !window.confirm("Reject this skill suggestion?")) return;
    try {
      await request(`/admin/skill-requests/${requestId}`, {
        method: "PATCH",
        data: { status, category: "Other" }
      });
      await loadQueue();
      setNotice(`Skill suggestion ${status}.`);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function reviewCourse(courseId, status) {
    let rejectionReason;
    if (status === "rejected") {
      rejectionReason = window.prompt("Share a clear reason so the educator can revise the course.");
      if (!rejectionReason?.trim()) return;
    }
    try {
      await request(`/admin/courses/${courseId}`, {
        method: "PATCH",
        data: { status, ...(rejectionReason ? { rejectionReason } : {}) }
      });
      await loadQueue();
      setNotice(`Course ${status}.`);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  if (loading) return <div className="container section"><Loading label="Opening moderation queue…" /></div>;

  return (
    <div className="container section">
      <div className="dashboard-welcome"><div><span className="eyebrow">Platform operations</span><h1>Review what comes next.</h1><p>Approve catalogue suggestions and review educator courses before public release.</p></div><span className="studio-emblem">⌘</span></div>
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <section className="section section-compact">
        <div className="section-heading">
          <PageTitle eyebrow="Learner demand" title="Skill suggestions" />
          {skillRequests.length > 0 && <span className="status-pill status-submitted">{skillRequests.length} pending</span>}
        </div>
        {skillRequests.length ? (
          <div className="moderation-list">
            {skillRequests.map((item) => (
              <article className="moderation-card" key={item._id}>
                <div>
                  <span className="eyebrow">{item.voteCount || 0} learner votes</span>
                  <h3>{item.name}</h3>
                  <p>{item.description || "No additional description."}</p>
                  <small>Suggested {new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="moderation-actions">
                  <button className="button button-small" onClick={() => reviewSkill(item._id, "approved")}>Approve</button>
                  <button className="button button-outline button-small" onClick={() => reviewSkill(item._id, "rejected")}>Reject</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><h3>No skill suggestions waiting</h3><p>New learner requests will appear here.</p></div>}
      </section>
      <section className="section section-compact">
        <div className="section-heading">
          <PageTitle eyebrow="Publication review" title="Courses awaiting approval" />
          {courses.length > 0 && <span className="status-pill status-submitted">{courses.length} pending</span>}
        </div>
        {courses.length ? (
          <div className="moderation-list">
            {courses.map((course) => (
              <article className="moderation-card" key={course._id}>
                <div>
                  <span className="eyebrow">{course.skillId?.name} · {course.difficulty}</span>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <small>By {course.educatorId?.name} · Submitted {new Date(course.updatedAt).toLocaleDateString()}</small>
                  <div className="moderation-modules">
                    {course.modules.map((module) => <span key={module._id}>{module.title} · {module.lessons.length} lessons</span>)}
                  </div>
                </div>
                <div className="moderation-actions">
                  <button className="button button-small" onClick={() => reviewCourse(course._id, "published")}>Publish</button>
                  <button className="button button-outline button-small" onClick={() => reviewCourse(course._id, "rejected")}>Request changes</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><h3>No courses waiting</h3><p>Submitted educator courses appear here for moderation.</p></div>}
      </section>
    </div>
  );
}
