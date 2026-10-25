import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { CourseCard, Empty, Loading, Notice, PageTitle } from "../components/ui.jsx";

export default function SkillPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    Promise.all([request(`/skills/${encodeURIComponent(slug)}`), request(`/skills/${encodeURIComponent(slug)}/courses`), request("/skills/requests")])
      .then(([skillResult, courseResult, requestResult]) => {
        setData({ skill: skillResult.skill, courses: courseResult.courses });
        setRequests(requestResult.requests);
      })
      .catch((reason) => setError(errorMessage(reason)));
  }, [slug]);

  async function vote(requestId) {
    setNotice("");
    setError("");
    try {
      await request(`/skills/requests/${requestId}/vote`, { method: "POST" });
      setNotice("Your vote has been added.");
      const { requests: updated } = await request("/skills/requests");
      setRequests(updated);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  if (!data && !error) return <div className="container section"><Loading label="Opening skill…" /></div>;
  if (error && !data) return <div className="container section"><Notice tone="error">{error}</Notice></div>;
  const { skill, courses } = data;

  return (
    <div className="container section">
      <div className="breadcrumbs"><Link to="/">Explore</Link><span>/</span><span>{skill.category}</span></div>
      <div className="skill-hero">
        <div><span className="eyebrow">{skill.category} · Skill guide</span><h1>{skill.name}</h1><p>{skill.description || "A practical skill, taught by independent educators. Compare the learning experiences available and choose a path that works for you."}</p><a className="button" href="#courses">Explore courses <span>↓</span></a></div>
        <div className="skill-stamp"><span>SKILL<br />FIRST</span><b>✳</b></div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}
      <section className="section section-compact" id="courses">
        <div className="section-heading"><PageTitle eyebrow="Learn from people who teach it" title={`Courses in ${skill.name}`} />{courses.length > 0 && <span className="muted">{courses.length} published</span>}</div>
        {courses.length ? <div className="course-grid">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div> : <Empty title="No published courses yet">Educators can build courses for this approved skill.</Empty>}
      </section>
      <section className="section section-compact">
        <div className="section-heading"><PageTitle eyebrow="Learner demand" title="Skills people are asking for" /></div>
        <div className="request-list">
          {requests.slice(0, 8).map((item) => <div className="request-row" key={item._id}><span className="request-glyph">＋</span><span className="request-name"><b>{item.name}</b><small>{item.description || "Suggested by a learner"}</small></span><span className="vote-count">{item.voteCount || 0}<small>votes</small></span>{user && <button className="button button-outline button-small" onClick={() => vote(item._id)}>Vote</button>}</div>)}
        </div>
        {!user && <p className="muted"> <Link to="/login">Sign in</Link> to vote for a skill suggestion.</p>}
      </section>
    </div>
  );
}
