import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Loading, Notice } from "../components/ui.jsx";

export default function LearningPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lessons = useMemo(() => data?.course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title }))) || [], [data]);

  useEffect(() => {
    request(`/courses/${courseId}/learning-content`)
      .then((result) => {
        setData(result);
        const firstLesson = result.course.modules.flatMap((module) => module.lessons)[0];
        setSelected(firstLesson?.id || null);
      })
      .catch((reason) => setError(errorMessage(reason)));
  }, [courseId]);

  async function markComplete(lesson) {
    setBusy(true);
    setError("");
    try {
      await request(`/courses/${courseId}/progress`, {
        method: "PATCH",
        data: { lessonId: lesson.id, completed: true }
      });
      setData((current) => ({ ...current, completedLessonIds: [...(current.completedLessonIds || []), lesson.id] }));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) return <div className="container section"><Loading label="Opening your learning space…" /></div>;
  if (error && !data) return <div className="container section"><Notice tone="error">{error}</Notice><Link to="/dashboard">Back to my courses</Link></div>;
  const lesson = lessons.find((item) => item.id === selected);
  const completed = data.completedLessonIds || [];

  return (
    <div className="learning-layout">
      <aside className="learning-sidebar">
        <Link className="back-link" to="/dashboard">← My courses</Link>
        <span className="eyebrow">Your learning path</span><h2>{data.course.title}</h2>
        <div className="learning-progress">{completed.length} of {lessons.length} lessons complete<div className="progress-line"><i style={{ width: `${lessons.length ? completed.length / lessons.length * 100 : 0}%` }} /></div></div>
        {data.course.modules.map((module) => <div className="lesson-module" key={module.id}><span>{module.title}</span>{module.lessons.map((item) => (
          <button className={`lesson-nav ${selected === item.id ? "active" : ""}`} key={item.id} onClick={() => setSelected(item.id)}>
            <span className={`lesson-check ${completed.includes(item.id) ? "done" : ""}`}>{completed.includes(item.id) ? "✓" : "▶"}</span>
            <span>{item.title}{item.isPreview && !data.enrolled && <small>Preview</small>}</span>
          </button>
        ))}</div>)}
      </aside>
      <section className="lesson-view">
        {error && <Notice tone="error">{error}</Notice>}
        <div className="lesson-video-placeholder"><span className="player-mark">▶</span><span className="eyebrow">{lesson?.moduleTitle}</span><h1>{lesson?.title || "No lessons available"}</h1><p>{data.enrolled ? "You have access to this lesson. Video playback is waiting for a media-provider integration." : "Preview lesson. Enroll in the course to access the full learning content."}</p><small>Video hosting and signed playback URLs are a deferred integration.</small></div>
        <div className="lesson-toolbar"><div><span className="eyebrow">Your progress</span><p>{data.enrolled ? "Progress is saved to your enrollment." : "This course has not been purchased on this account."}</p></div>{data.enrolled && lesson && <button className="button" disabled={busy || completed.includes(lesson.id)} onClick={() => markComplete(lesson)}>{completed.includes(lesson.id) ? "Completed ✓" : busy ? "Saving…" : "Mark complete"} <span>↗</span></button>}{!data.enrolled && <Link className="button" to={`/courses/${courseId}`}>View course access <span>↗</span></Link>}</div>
        {lesson?.description && <div className="lesson-description"><h3>About this lesson</h3><p>{lesson.description}</p></div>}
        {lesson?.resources?.length > 0 && <div className="resource-list"><h3>Resources</h3>{lesson.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.title} ↗</a>)}</div>}
      </section>
    </div>
  );
}
