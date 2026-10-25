import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { CourseCard, Loading, Notice, PageTitle } from "../components/ui.jsx";

export default function EducatorProfilePage() {
  const { educatorId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      request(`/educators/${educatorId}`),
      request(`/courses?educatorId=${encodeURIComponent(educatorId)}&limit=100`)
    ]).then(([profileResult, courseResult]) => {
      setProfile(profileResult.profile);
      setCourses(courseResult.courses);
    }).catch((reason) => setError(errorMessage(reason)));
  }, [educatorId]);

  if (!profile && !error) return <div className="container section"><Loading label="Opening educator profile…" /></div>;
  if (error) return <div className="container section"><Notice tone="error">{error}</Notice></div>;
  const isSelf = user?.id === educatorId;

  return (
    <div className="container section">
      <div className="profile-hero"><div className="profile-avatar">{profile.user?.name?.slice(0, 1).toUpperCase()}</div><div className="profile-info"><span className="eyebrow">Independent educator</span><h1>{profile.user?.name}</h1><p className="lead">{profile.headline || "Sharing practical skills with curious learners."}</p><div className="profile-actions">{profile.messagingEnabled && user && !isSelf && <Link className="button" to={`/messages?educatorId=${educatorId}`}>Message educator <span>↗</span></Link>}{isSelf && <Link className="button button-outline" to="/educator">Edit profile <span>↗</span></Link>}</div></div><span className="profile-star">✳</span></div>
      {profile.biography && <section className="profile-bio"><PageTitle eyebrow="About the educator" title="A little about their approach" /><p>{profile.biography}</p></section>}
      {profile.skills?.length > 0 && <section className="profile-bio"><span className="eyebrow">Skills taught</span><div className="tag-row">{profile.skills.map((skill) => <Link to={`/skills/${skill.slug}`} key={skill._id}>{skill.name}</Link>)}</div></section>}
      <section className="section section-compact"><div className="section-heading"><PageTitle eyebrow="Learn with this educator" title="Published courses" /></div>{courses.length ? <div className="course-grid">{courses.map((course) => <CourseCard course={course} key={course._id} />)}</div> : <p className="muted">No public courses yet.</p>}</section>
    </div>
  );
}
