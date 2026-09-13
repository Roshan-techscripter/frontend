import React from "react";
const { useState } = React;

const starterPolls = [
  { id: 1, title: "Where should we host the team offsite?", type: "Multiple choice", end: "Sep 18", options: ["Goa", "Jaipur", "Bengaluru"], responses: 186, complete: 76 },
  { id: 2, title: "How satisfied are you with our new app?", type: "Rating scale", end: "Sep 21", options: ["Very satisfied", "Satisfied", "Needs improvement"], responses: 342, complete: 54 },
  { id: 3, title: "Which feature should we build next?", type: "Multiple choice", end: "Sep 14", options: ["Team chat", "Dark mode", "Mobile app"], responses: 517, complete: 89 }
];

function App() {
  const [polls, setPolls] = useState(starterPolls);
  const [view, setView] = useState("Overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [votePoll, setVotePoll] = useState(null);
  const [resultPoll, setResultPoll] = useState(null);
  const [votes, setVotes] = useState(() => JSON.parse(localStorage.getItem("pulseboardVotes") || "{}"));

  const totalResponses = 2847 + Object.keys(votes).length;
  const exportCsv = () => {
    const data = ["Poll,Responses,Status", ...polls.map(p => `"${p.title.replaceAll('"', '""')}",${p.responses},Active`)].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
    link.download = "pulseboard-responses.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const submitVote = (choice) => {
    const updatedVotes = { ...votes, [votePoll.id]: choice };
    setVotes(updatedVotes);
    localStorage.setItem("pulseboardVotes", JSON.stringify(updatedVotes));
    const updatedPoll = { ...votePoll, responses: votePoll.responses + 1 };
    setPolls(polls.map(p => p.id === votePoll.id ? updatedPoll : p));
    setVotePoll(null);
    setResultPoll(updatedPoll);
  };
  const createPoll = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const type = form.get("type");
    const newPoll = {
      id: Date.now(), title: form.get("title"), type,
      end: new Date(form.get("deadline")).toLocaleDateString("en", { month: "short", day: "numeric" }),
      options: type === "Yes / No" ? ["Yes", "No"] : ["Option A", "Option B", "Option C"],
      responses: 0, complete: 0
    };
    setPolls([newPoll, ...polls]);
    setCreateOpen(false);
  };
  const nav = ["Overview", "My Polls", "Responses", "Analytics", "Exports", "Settings"];
  const isPollView = view === "Overview" || view === "My Polls";
  return <div className="layout">
    <aside className="sidebar"><div className="logo"><b>◔</b>Pulseboard</div>{nav.map(item => <button key={item} onClick={() => setView(item)} className={`nav ${view === item ? "active" : ""}`}>{item}</button>)}</aside>
    <main className="main">
      <header className="top"><div>Workspace / <h2>{view}</h2></div><div className="avatar">AM</div></header>
      <section className="hero"><div><h1>{view === "Overview" ? "Make every opinion count." : view}</h1><p>Create engaging polls, collect responses, and get actionable insights in minutes.</p></div><button className="primary" onClick={() => setCreateOpen(true)}>＋ Create new poll</button></section>
      {isPollView ? <>
        {view === "Overview" && <Dashboard polls={polls} total={totalResponses} />}
        <section className="section"><div className="sectionHead"><h2>Active polls</h2><button onClick={exportCsv} className="link">⇩ Export responses</button></div><div className="grid">{polls.map(poll => <Poll key={poll.id} poll={poll} voted={votes[poll.id] !== undefined} onVote={() => votes[poll.id] !== undefined ? setResultPoll(poll) : setVotePoll(poll)} />)}</div></section>
        {view === "Overview" && <Recent polls={polls} />}
      </> : <div className="empty"><h2>{view}</h2><p>This workspace area will show data as your survey program grows.</p></div>}
    </main>
    {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onSubmit={createPoll} />}
    {votePoll && <VoteModal poll={votePoll} onClose={() => setVotePoll(null)} onSubmit={submitVote} />}
    {resultPoll && <ResultsModal poll={resultPoll} picked={votes[resultPoll.id]} onClose={() => setResultPoll(null)} />}
  </div>;
}

function Dashboard({ polls, total }) { return <section className="cards"><div className="card"><h3>Your workspace at a glance</h3><div className="stats"><Metric value={polls.length} label="Active polls"/><Metric value={total.toLocaleString()} label="Total responses"/><Metric value="68%" label="Avg. completion rate"/></div></div><div className="card"><h3>Response activity</h3><div className="bars">{[39,66,48,80,100,59,43].map((height, index) => <div className="bar" style={{height: `${height}%`}} key={index}><span>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}</span></div>)}</div></div></section> }
function Metric({ value, label }) { return <div className="stat"><div className="number">{value}</div><div className="muted">{label}</div><div className="up">↑ 14% from last month</div></div> }
function Poll({ poll, voted, onVote }) { return <article className="poll"><div className="pollTop"><span className="badge">● Live</span><span>•••</span></div><h3>{poll.title}</h3><div className="muted">{poll.type} · Ends {poll.end}</div><div className="progress"><i style={{width: `${poll.complete}%`}} /></div><div className="pollFoot"><span>{poll.responses} responses</span><span>{poll.complete ? `${poll.complete}% complete` : "New"}</span></div><button className="vote" onClick={onVote}>{voted ? "View results" : "Vote now"}</button></article> }
function Recent({ polls }) { return <section className="section"><div className="sectionHead"><h2>Recent responses</h2></div><div className="table"><div className="row head"><div>Poll</div><div>Participant</div><div>Submitted</div><div>Status</div></div>{polls.slice(0,3).map((poll,index) => <div className="row" key={poll.id}><div>{poll.title}</div><div>{index === 1 ? "Priya Shah" : "Anonymous"}</div><div>{index === 0 ? "2 minutes ago" : "18 minutes ago"}</div><div><span className="done">Complete</span></div></div>)}</div></section> }
function CreateModal({ onClose, onSubmit }) { return <div className="backdrop"><form className="modal" onSubmit={onSubmit}><h2>Create a new poll</h2><p>Share a question and collect opinions from your audience.</p><label>Question</label><input name="title" required placeholder="What should we ask?"/><label>Question type</label><select name="type"><option>Multiple choice</option><option>Yes / No</option><option>Rating scale</option></select><label>Response deadline</label><input name="deadline" type="date" required/><div className="actions"><button type="button" className="cancel" onClick={onClose}>Cancel</button><button className="submit">Create poll</button></div></form></div> }
function VoteModal({ poll, onClose, onSubmit }) { const [choice, setChoice] = useState(""); return <div className="backdrop"><form className="modal" onSubmit={event => { event.preventDefault(); onSubmit(Number(choice)); }}><h2>{poll.title}</h2><p>Choose one option. Your response is anonymous.</p>{poll.options.map((option, index) => <label className="choice" key={option}><input required type="radio" name="choice" value={index} checked={choice == index} onChange={event => setChoice(event.target.value)}/>{option}</label>)}<div className="actions"><button type="button" className="cancel" onClick={onClose}>Cancel</button><button className="submit">Submit vote</button></div></form></div> }
function ResultsModal({ poll, picked, onClose }) { return <div className="backdrop"><div className="modal"><h2>Live results</h2><p>{poll.responses} responses collected. Results update as new votes arrive.</p>{poll.options.map((option, index) => { const percent = index === picked ? 55 : Math.max(14, 33 - index * 7); return <div className="result" key={option}><div><span>{option}</span><b>{percent}%</b></div><i style={{width: `${percent}%`}} /></div>; })}<div className="actions"><button className="submit" onClick={onClose}>Close</button></div></div></div> }

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
export default App;