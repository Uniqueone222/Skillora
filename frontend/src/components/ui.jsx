export function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="page-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Notice({ children, tone = "info" }) {
  if (!children) return null;
  return <div className={`notice notice-${tone}`} role="status">{children}</div>;
}

export function Loading({ label = "Loading…" }) {
  return <div className="loading-state"><span className="spinner" />{label}</div>;
}

export function Empty({ title, children }) {
  return <div className="empty-state"><span className="empty-mark">✳</span><h3>{title}</h3><p>{children}</p></div>;
}

export function SkillCard({ skill }) {
  return (
    <a className="skill-card" href={`/skills/${encodeURIComponent(skill.slug)}`}>
      <span className="card-index">{skill.category || "Skill"}</span>
      <strong>{skill.name}</strong>
      <span className="card-copy">{skill.description || "Explore courses and educators who teach this skill."}</span>
      <span className="card-arrow">Explore <span aria-hidden="true">↗</span></span>
    </a>
  );
}

export function CourseCard({ course }) {
  return (
    <a className="course-card" href={`/courses/${course._id}`}>
      <div className="course-art">
        <span>{course.skillId?.name || "Skillora course"}</span>
        <b>{course.title?.slice(0, 1)?.toUpperCase() || "S"}</b>
      </div>
      <div className="course-card-body">
        <span className="eyebrow">{course.difficulty || "All levels"}</span>
        <strong>{course.title}</strong>
        <span className="muted">with {course.educatorId?.name || "Independent educator"}</span>
        <div className="course-card-foot"><span>{course.pricePaise === 0 ? "Free" : formatINR(course.pricePaise)}</span><span>View course ↗</span></div>
      </div>
    </a>
  );
}

export function formatINR(paise = 0) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    .format(paise / 100);
}
