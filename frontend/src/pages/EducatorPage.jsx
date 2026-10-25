import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { formatINR, Loading, Notice, PageTitle } from "../components/ui.jsx";

export default function EducatorPage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [courseForm, setCourseForm] = useState({ title: "", description: "", skillId: "", price: "0", difficulty: "beginner" });
  const [profileForm, setProfileForm] = useState({ headline: "", biography: "", messagingEnabled: false });

  async function loadStudio() {
    const result = await Promise.all([
      request("/educators/me/courses"),
      request("/skills?limit=100")
    ]);
    setCourses(result[0].courses);
    setSkills(result[1].skills);
    const { profile: educatorProfile } = await request(`/educators/${user.id}`);
    setProfile(educatorProfile);
    setProfileForm({
      headline: educatorProfile.headline || "",
      biography: educatorProfile.biography || "",
      messagingEnabled: educatorProfile.messagingEnabled || false
    });
    setCourseForm((current) => ({ ...current, skillId: current.skillId || result[1].skills[0]?._id || "" }));
  }

  useEffect(() => {
    if (!user.capabilities.includes("educator")) return;
    loadStudio().catch((reason) => setError(errorMessage(reason)));
  }, [user.id, user.capabilities]);

  async function activate() {
    setBusy(true);
    setError("");
    try {
      await request("/educators/activate", { method: "POST" });
      await refresh();
      setNotice("Educator capabilities are active. Start by completing your profile.");
      await loadStudio();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const { profile: updated } = await request("/educators/me", {
        method: "PATCH",
        data: profileForm
      });
      setProfile(updated);
      setNotice("Your educator profile has been saved.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function createCourse(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/courses", {
        method: "POST",
        data: {
          title: courseForm.title,
          description: courseForm.description,
          skillId: courseForm.skillId,
          difficulty: courseForm.difficulty,
          pricePaise: Math.round(Number(courseForm.price) * 100)
        }
      });
      setCourseForm((current) => ({ ...current, title: "", description: "", price: "0" }));
      setNotice("Draft created. Add at least one module and lesson before submitting for review.");
      await loadStudio();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function addModule(courseId, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request(`/courses/${courseId}/modules`, {
        method: "POST",
        data: { title: form.get("title"), description: form.get("description") || "" }
      });
      event.currentTarget.reset();
      await loadStudio();
      setNotice("Module added.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function addLesson(courseId, moduleId, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request(`/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: "POST",
        data: {
          title: form.get("title"),
          description: form.get("description") || "",
          videoAssetId: form.get("videoAssetId") || "",
          isPreview: form.get("isPreview") === "on"
        }
      });
      event.currentTarget.reset();
      await loadStudio();
      setNotice("Lesson added.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function submitCourse(courseId) {
    try {
      await request(`/courses/${courseId}/submit`, { method: "POST" });
      await loadStudio();
      setNotice("Course submitted for admin review.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  if (!user.capabilities.includes("educator")) {
    return <div className="container section activate-panel"><span className="eyebrow">One account, two ways to grow</span><h1>Teach what you know.</h1><p>Activate educator capabilities to create a public profile and build courses. Your account remains a learner account too.</p>{error && <Notice tone="error">{error}</Notice>}<button className="button" onClick={activate} disabled={busy}>{busy ? "Activating…" : "Activate educator mode"} <span>↗</span></button></div>;
  }

  if (!profile && !error) return <div className="container section"><Loading label="Opening educator studio…" /></div>;

  return (
    <div className="container section">
      <div className="dashboard-welcome"><div><span className="eyebrow">Educator studio</span><h1>Build a learning experience.</h1><p>Draft your course, add lessons, and submit it for moderation before it goes public.</p></div><span className="studio-emblem">✳</span></div>
      {error && <Notice tone="error">{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
      <div className="studio-grid">
        <section className="form-panel">
          <PageTitle eyebrow="Your public identity" title="Educator profile" />
          <form className="stack-form" onSubmit={saveProfile}>
            <label>Headline<input value={profileForm.headline} onChange={(event) => setProfileForm({ ...profileForm, headline: event.target.value })} maxLength="120" placeholder="e.g. Illustrator & visual storyteller" /></label>
            <label>About you<textarea value={profileForm.biography} onChange={(event) => setProfileForm({ ...profileForm, biography: event.target.value })} maxLength="3000" rows="4" placeholder="Tell learners what you teach and how you teach it." /></label>
            <label className="toggle-row"><span><b>Accept direct messages</b><small>Learners can start a conversation when enabled.</small></span><input type="checkbox" checked={profileForm.messagingEnabled} onChange={(event) => setProfileForm({ ...profileForm, messagingEnabled: event.target.checked })} /></label>
            <button className="button button-outline">Save profile</button>
            {profile && <Link className="text-link" to={`/educators/${profile.userId}`}>Preview public profile ↗</Link>}
          </form>
        </section>
        <section className="form-panel">
          <PageTitle eyebrow="Add to the catalogue" title="Create a course draft" />
          <form className="stack-form" onSubmit={createCourse}>
            <label>Course title<input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} minLength="3" maxLength="160" required /></label>
            <label>Approved skill<select value={courseForm.skillId} onChange={(event) => setCourseForm({ ...courseForm, skillId: event.target.value })} required><option value="">Choose a skill</option>{skills.map((skill) => <option value={skill._id} key={skill._id}>{skill.name}</option>)}</select></label>
            <label>Description<textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} minLength="10" maxLength="5000" rows="4" required /></label>
            <div className="form-row"><label>Level<select value={courseForm.difficulty} onChange={(event) => setCourseForm({ ...courseForm, difficulty: event.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>Price in INR<input type="number" min="0" step="0.01" value={courseForm.price} onChange={(event) => setCourseForm({ ...courseForm, price: event.target.value })} required /></label></div>
            <button className="button" disabled={busy || !skills.length}>{busy ? "Creating…" : "Create draft"} <span>↗</span></button>
            {!skills.length && <small>Courses require an approved skill. Add or approve one before creating a draft.</small>}
          </form>
        </section>
      </div>
      <section className="section section-compact">
        <div className="section-heading"><PageTitle eyebrow="Your teaching" title="Courses & drafts" />{courses.length > 0 && <span className="muted">{courses.length} total</span>}</div>
        {courses.length ? <div className="studio-course-list">{courses.map((course) => <article className="studio-course" key={course._id}>
          <div className="studio-course-head"><div><span className={`status-pill status-${course.status}`}>{course.status}</span><h3>{course.title}</h3><span className="muted">{course.skillId?.name} · {formatINR(course.pricePaise)}</span></div>{course.status === "published" && <Link className="text-link" to={`/courses/${course._id}`}>View course ↗</Link>}</div>
          {["draft", "rejected"].includes(course.status) && <div className="course-builder">
            {course.status === "rejected" && <Notice tone="error">Admin feedback: {course.rejectionReason || "Please review your course."}</Notice>}
            {course.modules.map((module) => <div className="module-box" key={module._id}><h4>{module.title}</h4>{module.lessons.map((lesson) => <span className="lesson-chip" key={lesson._id}>{lesson.title}{lesson.isPreview && " · preview"}</span>)}<form className="inline-builder" onSubmit={(event) => addLesson(course._id, module._id, event)}><input name="title" required placeholder="Lesson title" /><input name="description" placeholder="Short description" /><input name="videoAssetId" placeholder="Optional media asset ID" /><label className="check-label"><input type="checkbox" name="isPreview" /> Preview</label><button className="button button-small">Add lesson</button></form></div>)}
            <form className="inline-builder module-builder" onSubmit={(event) => addModule(course._id, event)}><input name="title" required placeholder="New module title" /><input name="description" placeholder="Short description" /><button className="button button-outline button-small">Add module</button></form>
            <div className="builder-actions"><span className="fine-print">Media hosting/playback setup is deferred; course text and access rules are ready.</span><button className="button button-small" onClick={() => submitCourse(course._id)} disabled={!course.modules.length || !course.modules.some((module) => module.lessons.length)}>Submit for review <span>↗</span></button></div>
          </div>}
          {course.status === "submitted" && <p className="muted">This course is in the admin review queue. It will not appear in public discovery until approved.</p>}
        </article>)}</div> : <div className="empty-state"><span className="empty-mark">✳</span><h3>Your first course begins with a skill</h3><p>Create a course draft above, then add modules and lessons.</p></div>}
      </section>
    </div>
  );
}
