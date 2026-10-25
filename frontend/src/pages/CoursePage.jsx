import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage, loadRazorpay, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { formatINR, Loading, Notice } from "../components/ui.jsx";

export default function CoursePage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [community, setCommunity] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request(`/courses/${courseId}`)
      .then(({ course: result }) => setCourse(result))
      .catch((reason) => setError(errorMessage(reason)));
  }, [courseId]);

  useEffect(() => {
    if (!user) return;
    request(`/communities?scope=course&courseId=${encodeURIComponent(courseId)}`)
      .then(({ community: result }) => setCommunity(result))
      .catch(() => setCommunity(null));
  }, [courseId, user]);

  async function enroll() {
    setBusy(true);
    setError("");
    try {
      if (course.pricePaise === 0) {
        await request(`/courses/${course._id}/enroll`, { method: "POST" });
        navigate(`/learn/${course._id}`);
        return;
      }

      const { order } = await request("/payments/order", {
        method: "POST",
        data: { courseId: course._id }
      });
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Skillora",
        description: course.title,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#7268ef" },
        handler: async (response) => {
          try {
            await request("/payments/verify", { method: "POST", data: response });
            navigate(`/learn/${course._id}`);
          } catch (reason) {
            setError(errorMessage(reason));
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      checkout.open();
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }

  if (!course && !error) return <div className="container section"><Loading label="Opening course…" /></div>;
  if (error && !course) return <div className="container section"><Notice tone="error">{error}</Notice></div>;

  return (
    <div className="container section">
      <div className="breadcrumbs"><Link to="/">Explore</Link><span>/</span><Link to={`/skills/${course.skillId?.slug}`}>{course.skillId?.name}</Link><span>/</span><span>Course</span></div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="course-detail-grid">
        <div className="course-main">
          <div className="detail-art"><span className="eyebrow">{course.skillId?.name} · {course.difficulty}</span><span className="detail-art-letter">{course.title.slice(0, 1).toUpperCase()}</span><span className="detail-art-caption">A focused learning experience</span></div>
          <span className="eyebrow">{course.difficulty} level</span>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
          <div className="educator-strip">
            <span className="avatar avatar-large">{course.educatorId?.name?.slice(0, 1).toUpperCase()}</span>
            <div><span className="muted">Taught by</span><Link to={`/educators/${course.educatorId?._id}`}>{course.educatorId?.name || "Independent educator"}</Link></div>
            <Link className="text-link" to={`/educators/${course.educatorId?._id}`}>Educator profile ↗</Link>
          </div>
          <div className="detail-info">
            <div><span className="eyebrow">Course access</span><strong>Learn at your own pace</strong></div>
            <div><span className="eyebrow">Skill</span><strong>{course.skillId?.name}</strong></div>
            <div><span className="eyebrow">Content status</span><strong>Reviewed and published</strong></div>
          </div>
          <div className="detail-note"><span>✳</span><p>Course video hosting is not connected yet. Lessons can be authored and protected; configure a media provider before adding playable video.</p></div>
        </div>
        <aside className="purchase-card">
          <span className="eyebrow">Start learning</span>
          <div className="price-large">{course.pricePaise === 0 ? "Free" : formatINR(course.pricePaise)}</div>
          <p>One-time course access. The backend calculates the price and grants access only after payment verification.</p>
          {user ? <button className="button button-full" onClick={enroll} disabled={busy}>{busy ? "Preparing secure checkout…" : course.pricePaise === 0 ? "Enroll for free" : "Get course access"} <span>↗</span></button>
            : <Link className="button button-full" to="/login">Sign in to enroll <span>↗</span></Link>}
          <ul className="purchase-checks"><li>Structured lessons</li><li>Progress saved to your account</li><li>Community access follows educator settings</li></ul>
          {community && <Link className="button button-outline button-full" to={`/community?scope=course&courseId=${course._id}`}>Open course community <span>↗</span></Link>}
          {course.educatorId?._id && <Link className="text-link purchase-message" to={`/educators/${course.educatorId._id}`}>View educator profile ↗</Link>}
          <span className="fine-print">Payments are currently restricted to Razorpay test mode.</span>
        </aside>
      </div>
    </div>
  );
}
