import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Empty, Loading, Notice, PageTitle } from "../components/ui.jsx";

const accessOptions = [
  ["public", "Public"],
  ["enrolled", "Enrolled learners"],
  ["educator_responses_only", "Educator responses only"],
  ["disabled", "Disabled"]
];

export default function CommunityPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const scope = searchParams.get("scope");
  const courseId = searchParams.get("courseId");
  const educatorId = searchParams.get("educatorId");
  const [community, setCommunity] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCommunity() {
    const params = new URLSearchParams({ scope, ...(courseId ? { courseId } : {}), ...(educatorId ? { educatorId } : {}) });
    const { community: result } = await request(`/communities?${params}`);
    const { discussions: threads } = await request(`/communities/${result._id}/discussions`);
    setCommunity(result);
    setDiscussions(threads);
  }

  useEffect(() => {
    if (!["course", "educator"].includes(scope) || (scope === "course" && !courseId) || (scope === "educator" && !educatorId)) {
      setError("Choose a course or educator community to continue.");
      setLoading(false);
      return;
    }
    loadCommunity().catch((reason) => setError(errorMessage(reason))).finally(() => setLoading(false));
  }, [scope, courseId, educatorId]);

  async function createPost(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request(`/communities/${community._id}/discussions`, {
        method: "POST",
        data: { type: form.get("type"), title: form.get("title"), body: form.get("body") }
      });
      event.currentTarget.reset();
      await loadCommunity();
      setNotice("Your post has been shared.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function answer(discussionId, event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request(`/communities/discussions/${discussionId}/answers`, {
        method: "POST",
        data: { body: form.get("body") }
      });
      event.currentTarget.reset();
      await loadCommunity();
      setNotice("Your response has been added.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function resolve(discussionId, answerId) {
    try {
      await request(`/communities/discussions/${discussionId}/resolve`, {
        method: "PATCH",
        data: { answerId }
      });
      await loadCommunity();
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function changeAccess(accessMode) {
    try {
      const { community: updated } = await request(`/communities/${community._id}/settings`, {
        method: "PATCH",
        data: { accessMode }
      });
      setCommunity(updated);
      setNotice("Community access settings updated.");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  if (loading) return <div className="container section"><Loading label="Opening the community…" /></div>;

  const isOwner = community?.educatorId?.toString() === user.id;
  return (
    <div className="container section community-page">
      <div className="breadcrumbs"><Link to="/">Explore</Link><span>/</span><span>Community</span></div>
      <div className="community-heading"><PageTitle eyebrow={`${scope === "course" ? "Course" : "Educator"} community`} title={scope === "course" ? "Learn together." : "A place to share and ask."}>{community?.accessMode === "educator_responses_only" ? "Learner questions are welcome; only the educator can respond." : "Ask thoughtful questions, share resources, and learn alongside others."}</PageTitle>{isOwner && <label className="access-setting"><span className="eyebrow">Access setting</span><select value={community.accessMode} onChange={(event) => changeAccess(event.target.value)}>{accessOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}</div>
      {error && <Notice tone="error">{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
      {community?.accessMode === "disabled" ? <Empty title="This community is disabled">The educator has turned off access to this community.</Empty> : (
        <div className="community-layout">
          <section className="community-feed">
            {discussions.length ? discussions.map((discussion) => <article className="discussion-card" key={discussion._id}>
              <div className="discussion-meta"><span className="avatar">{discussion.authorId?.name?.slice(0, 1).toUpperCase() || "?"}</span><span><b>{discussion.authorId?.name || "Learner"}</b><small>{new Date(discussion.createdAt).toLocaleString()}</small></span><span className="discussion-type">{discussion.type}</span></div>
              <h3>{discussion.title}</h3><p>{discussion.body}</p>
              <div className="answer-list">{discussion.answers.map((item) => <div className="answer-item" key={item._id}><span className="answer-line" /><div><b>{item.authorId?.name || "Community member"}</b>{item._id === discussion.acceptedAnswerId && <span className="accepted-label">Accepted answer</span>}<p>{item.body}</p>{isOwner && !discussion.resolvedAt && <button className="link-button" onClick={() => resolve(discussion._id, item._id)}>Mark as accepted</button>}</div></div>)}</div>
              {(!community || community.accessMode !== "educator_responses_only" || isOwner) && <form className="reply-form" onSubmit={(event) => answer(discussion._id, event)}><input name="body" required maxLength="5000" placeholder="Write a helpful response…" /><button className="button button-small">Reply</button></form>}
            </article>) : <Empty title="Start the conversation">Ask a question or share a resource with the community.</Empty>}
          </section>
          <aside className="post-panel"><span className="eyebrow">Contribute</span><h2>Start a conversation.</h2><form className="stack-form" onSubmit={createPost}><label>Post type<select name="type"><option value="question">Question</option><option value="discussion">Discussion</option><option value="resource">Resource</option></select></label><label>Title<input name="title" minLength="3" maxLength="180" required /></label><label>Your post<textarea name="body" rows="5" maxLength="10000" required /></label><button className="button">Post to community <span>↗</span></button>{community?.accessMode === "educator_responses_only" && <small>Questions only. The educator is the only person who can answer.</small>}</form></aside>
        </div>
      )}
    </div>
  );
}
