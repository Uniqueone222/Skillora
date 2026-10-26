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
  const [reviewData, setReviewData] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [community, setCommunity] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    request(`/courses/${courseId}`)
      .then(({ course: result }) => setCourse(result))
      .catch((reason) => setError(errorMessage(reason)));
  }, [courseId]);

  async function loadReviews() {
    const result = await request(`/courses/${courseId}/reviews`);
    setReviewData(result);
    if (result.userReview) {
      setReviewRating(result.userReview.rating);
      setReviewBody(result.userReview.body);
    } else {
      setReviewRating(5);
      setReviewBody("");
    }
  }

  useEffect(() => {
    setReviewData(null);
    setReviewError("");
    loadReviews().catch((reason) => setReviewError(errorMessage(reason)));
  }, [courseId, user?._id]);

  useEffect(() => {
    if (!user) return;
    request(`/communities?scope=course&courseId=${encodeURIComponent(courseId)}`)
      .then(({ community: result }) => setCommunity(result))
      .catch(() => setCommunity(null));
  }, [courseId, user]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");
    try {
      await request(`/courses/${courseId}/reviews`, {
        method: reviewData?.userReview ? "PUT" : "POST",
        data: { rating: Number(reviewRating), body: reviewBody }
      });
      await loadReviews();
      setReviewNotice(reviewData?.userReview ? "Your review has been updated." : "Thanks for reviewing this course.");
    } catch (reason) {
      setReviewError(errorMessage(reason));
    } finally {
      setReviewBusy(false);
    }
  }

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
            <div><span className="eyebrow">Learner rating</span><strong>★ {Number(course.ratingAverage || 0).toFixed(1)} ({course.reviewCount || 0} reviews)</strong></div>
            <div><span className="eyebrow">Skill</span><strong>{course.skillId?.name}</strong></div>
            <div><span className="eyebrow">Learners</span><strong>{course.enrollmentCount || 0} enrolled</strong></div>
          </div>
          <div className="detail-note"><span>✳</span><p>Course videos use authenticated Cloudinary storage. Free-tier signed playback links can be shared by anyone who receives them.</p></div>
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
      <section className="course-reviews" aria-labelledby="reviews-title">
        <div className="section-heading">
          <div><span className="eyebrow">Learner feedback</span><h2 id="reviews-title">Reviews and ratings</h2></div>
          <span className="course-review-summary">★ {Number(reviewData?.ratingAverage ?? course.ratingAverage ?? 0).toFixed(1)} · {reviewData?.reviewCount ?? course.reviewCount ?? 0} reviews</span>
        </div>
        {reviewError && <Notice tone="error">{reviewError}</Notice>}
        {reviewNotice && <Notice tone="success">{reviewNotice}</Notice>}
        {reviewData?.canReview && <form className="review-form" onSubmit={submitReview}>
          <h3>{reviewData.userReview ? "Edit your review" : "Share your experience"}</h3>
          <label>Rating
            <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Great</option>
              <option value={3}>3 - Good</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </select>
          </label>
          <label>Your review
            <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} minLength={10} maxLength={2000} rows={4} required placeholder="What was useful about this course?" />
          </label>
          <button className="button" type="submit" disabled={reviewBusy}>{reviewBusy ? "Saving…" : reviewData.userReview ? "Update review" : "Submit review"}</button>
        </form>}
        {!user && <p className="fine-print"><Link to="/login">Sign in and enroll</Link> to leave a review. Reviews are limited to enrolled learners.</p>}
        {user && !reviewData?.canReview && <p className="fine-print">Only enrolled learners can review a course. Educators cannot review their own courses.</p>}
        {reviewData?.reviews?.length ? <div className="review-list">
          {reviewData.reviews.map((review) => <article className="review-card" key={review._id}>
            <div className="review-card-heading"><strong>{review.learnerId?.name || "Learner"}</strong><span>★ {review.rating}/5</span></div>
            <p>{review.body}</p>
            <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
          </article>)}
        </div> : reviewData && <p className="muted">No reviews yet. Enroll and be the first to share feedback.</p>}
      </section>
    </div>
  );
}
