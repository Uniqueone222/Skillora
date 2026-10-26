import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, request } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { CourseCard, Empty, Loading, Notice, PageTitle, SkillCard } from "../components/ui.jsx";

export default function HomePage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [votingRequestId, setVotingRequestId] = useState("");
  const categories = useMemo(() => [...new Set(skills.map((skill) => skill.category))], [skills]);

  useEffect(() => {
    setLoading(true);
    const courseFilters = new URLSearchParams({ search: query, limit: "6", sort });
    if (category) courseFilters.set("category", category);
    if (difficulty) courseFilters.set("difficulty", difficulty);
    if (price) courseFilters.set("price", price);
    Promise.all([
      request(`/skills?${new URLSearchParams({ search: query, category, limit: "100" })}`),
      request(`/courses?${courseFilters}`),
      request("/skills/requests")
    ]).then(([skillResult, courseResult, requestResult]) => {
      setSkills(skillResult.skills);
      setCourses(courseResult.courses);
      setRequests(requestResult.requests.slice(0, 4));
      setError("");
    }).catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [query, category, difficulty, price, sort]);

  async function suggestSkill(event) {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await request("/skills/requests", {
        method: "POST",
        data: { name: skillName, description: skillDescription }
      });
      setSkillName("");
      setSkillDescription("");
      setNotice("Suggestion submitted. Your vote has been recorded.");
      const { requests: updated } = await request("/skills/requests");
      setRequests(updated.slice(0, 4));
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function vote(item) {
    setNotice("");
    setError("");
    setVotingRequestId(item._id);
    try {
      await request(`/skills/requests/${item._id}/vote`, {
        method: item.hasVoted ? "DELETE" : "POST"
      });
      setNotice(item.hasVoted ? "Your vote has been removed." : "Your vote has been added.");
      const { requests: updated } = await request("/skills/requests");
      setRequests(updated.slice(0, 4));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setVotingRequestId("");
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-dot" />A marketplace built around what you want to learn</div>
          <h1>Start with a skill.<br /><em>Go further.</em></h1>
          <p>Find independent educators, practical courses, and the support to turn curiosity into real capability.</p>
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); setCategory(""); setQuery(search.trim()); }}>
            <span className="search-icon">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What would you love to learn?" aria-label="Search skills and courses" />
            <button className="button" type="submit">Explore <span>↗</span></button>
          </form>
          <div className="hero-trust"><span className="avatar-stack"><i>A</i><i>M</i><i>J</i></span><span>Made for curious people and independent educators</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="hero-note note-top"><span className="note-icon violet">✳</span><span><b>Learn by doing</b><small>Skills that move you forward</small></span></div>
          <div className="hero-center"><span className="center-spark">✳</span><strong>learn<br />something<br /><em>that matters</em></strong><span className="center-line" /></div>
          <div className="hero-note note-bottom"><span className="note-icon mint">↗</span><span><b>Your next skill</b><small>Starts with one search</small></span></div>
          <span className="floating-tag">01 / discover</span>
        </div>
        <div className="hero-bottom"><span>Independent minds. Practical skills.</span><span>Scroll to explore <b>↓</b></span></div>
      </section>

      {error && <div className="container"><Notice tone="error">{error}</Notice></div>}
      {notice && <div className="container"><Notice tone="success">{notice}</Notice></div>}

      <section className="container section" id="skills">
        <div className="section-heading">
          <PageTitle eyebrow="Find your starting point" title={query ? `Results for “${query}”` : category ? `Explore ${category}` : "Skills worth exploring"}>
            Discover a subject first. Then find the educators and courses that fit you.
          </PageTitle>
          <Link className="text-link" to="/#skills" onClick={() => { setCategory(""); setQuery(""); setSearch(""); setShowAllSkills(true); }}>Browse all skills <span>↗</span></Link>
        </div>
        {loading ? <Loading label="Finding skills…" /> : skills.length
          ? <div className="skill-grid">{(showAllSkills ? skills : skills.slice(0, 9)).map((skill) => <SkillCard key={skill._id} skill={skill} />)}</div>
          : <Empty title="No skills found">Try another search or suggest a skill that is missing.</Empty>}
        {!showAllSkills && skills.length > 9 && <button className="button button-outline" onClick={() => setShowAllSkills(true)}>Show all {skills.length} skills</button>}
        {categories.length > 0 && <div className="category-row"><span>Browse by area</span>{categories.map((categoryName) => <button key={categoryName} onClick={() => { setQuery(""); setSearch(""); setCategory(categoryName); }}>{categoryName} <span>↗</span></button>)}</div>}
      </section>

      <section className="soft-section">
        <div className="container section">
          <div className="section-heading">
            <PageTitle eyebrow="Learn from people who do the work" title="Courses with a point of view">
              Small, focused learning experiences from independent educators.
            </PageTitle>
            <span className="muted">{courses.length} course{courses.length === 1 ? "" : "s"}</span>
          </div>
          <div className="discovery-filters" aria-label="Filter courses">
            <label>Level
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option value="">Any level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>Price
              <select value={price} onChange={(event) => setPrice(event.target.value)}>
                <option value="">Any price</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label>Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="rating">Highest rated</option>
                <option value="enrollments">Most learners</option>
              </select>
            </label>
          </div>
          {loading ? <Loading label="Finding courses…" /> : courses.length
            ? <div className="course-grid">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div>
            : <Empty title="Your next course is taking shape">Approved courses will appear here as educators publish them.</Empty>}
        </div>
      </section>

      <section className="container section demand-section" id="skill-requests">
        <div className="demand-copy">
          <span className="eyebrow">The catalogue grows with you</span>
          <h2>Can't find the skill<br />you're looking for?</h2>
        <p>Request a skill you want to learn. Educators can offer skills from their studio, and learners can vote on community requests.</p>
          {!user && <Link className="button" to="/login">Sign in to suggest a skill <span>↗</span></Link>}
          {user && <form className="stack-form" onSubmit={suggestSkill}>
            <label>Skill name<input value={skillName} onChange={(event) => setSkillName(event.target.value)} minLength="2" maxLength="100" required placeholder="e.g. Ceramic glazing" /></label>
            <label>What should learners know?<textarea value={skillDescription} onChange={(event) => setSkillDescription(event.target.value)} maxLength="500" rows="3" placeholder="A short description (optional)" /></label>
            <button className="button" type="submit">Suggest this skill <span>↗</span></button>
          </form>}
        </div>
        <div className="request-panel">
          <div className="request-panel-head"><span className="eyebrow">Community ideas</span><span className="live-mark"><i /> Pending review</span></div>
          {requests.length ? requests.map((item) => (
            <div className="request-row" key={item._id}>
              <span className="request-glyph">＋</span><span className="request-name"><b>{item.name}</b><small>{item.intent === "teach" ? "Educator offer" : "Learner request"} · {item.description || "No additional details"}</small></span><span className="vote-count">{item.voteCount || 0}<small>votes</small></span>
              {user && <button className="button button-outline button-small" disabled={votingRequestId === item._id} onClick={() => vote(item)}>{votingRequestId === item._id ? "Saving…" : item.hasVoted ? "Remove vote" : "Vote"}</button>}
            </div>
          )) : <Empty title="Be the first to suggest">New skill requests will show up here.</Empty>}
          {!user && requests.length > 0 && <p className="fine-print"><Link to="/login">Sign in</Link> to vote for a suggestion.</p>}
          <p className="fine-print">Suggestions are reviewed before appearing in the public skill catalogue.</p>
        </div>
      </section>

      <section className="join-banner container">
        <div><span className="eyebrow">Teach what you know</span><h2>Turn your skill into<br />someone else's starting point.</h2></div>
        <Link className="button button-light" to={user ? "/educator" : "/register"}>{user?.capabilities.includes("educator") ? "Open educator studio" : "Become an educator"} <span>↗</span></Link>
        <span className="banner-star" aria-hidden="true">✳</span>
      </section>
    </>
  );
}
