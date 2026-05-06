import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileText,
  HeartPulse,
  Library,
  Lock,
  MessageCircle,
  Network,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";

const STORAGE_KEY = "scwis_platform_state_v1";

const initialStudents = [
  { id: "S1001", name: "Alex Chen", consent: true, lms: 92, library: 6, dining: 14, gym: 5, stress: 2, sleep: 7.4, social: 8 },
  { id: "S1002", name: "Maya Lee", consent: true, lms: 43, library: 0, dining: 4, gym: 0, stress: 4, sleep: 4.2, social: 2 },
  { id: "S1003", name: "Daniel Wong", consent: false, lms: 76, library: 3, dining: 9, gym: 2, stress: 3, sleep: 6.1, social: 5 },
  { id: "S1004", name: "Sara Patel", consent: true, lms: 38, library: 1, dining: 5, gym: 1, stress: 5, sleep: 3.8, social: 1 },
  { id: "S1005", name: "Ryan Smith", consent: true, lms: 81, library: 4, dining: 10, gym: 3, stress: 2, sleep: 6.9, social: 6 },
  { id: "S1006", name: "Olivia Brown", consent: true, lms: 67, library: 2, dining: 8, gym: 1, stress: 3, sleep: 5.8, social: 4 },
];

const csvTemplate = `student_id,name,consent,lms_activity,library_visits,dining_count,gym_visits,self_report_stress,sleep_hours,social_activity
S2001,Jamie Lin,true,86,5,12,3,2,7.1,7
S2002,Chris Zhao,true,41,0,3,0,5,4.0,1
S2003,Nina Park,false,77,4,10,2,3,6.5,5`;

const trendData = [
  { week: "W1", wellbeing: 78, stress: 44 },
  { week: "W2", wellbeing: 74, stress: 49 },
  { week: "W3", wellbeing: 69, stress: 55 },
  { week: "W4", wellbeing: 71, stress: 52 },
  { week: "W5", wellbeing: 76, stress: 46 },
  { week: "W6", wellbeing: 80, stress: 39 },
];

function riskOf(student) {
  if (!student.consent) {
    return {
      score: null,
      level: "Blocked",
      tone: "blocked",
      reasons: ["No student consent. This record is excluded before analysis."],
    };
  }

  let score = 0;
  const reasons = [];

  if (student.lms < 50) {
    score += 22;
    reasons.push("Sharp LMS activity decline");
  }
  if (student.dining < 6) {
    score += 18;
    reasons.push("Irregular dining pattern");
  }
  if (student.gym === 0) {
    score += 8;
    reasons.push("No recent physical activity record");
  }
  if (student.library <= 1) {
    score += 10;
    reasons.push("Low academic-space engagement");
  }
  if (student.stress >= 4) {
    score += 22;
    reasons.push("High voluntary stress check-in");
  }
  if (student.sleep < 5) {
    score += 18;
    reasons.push("Sleep below healthy range");
  }
  if (student.social <= 2) {
    score += 15;
    reasons.push("Possible social isolation pattern");
  }

  score = Math.min(100, score);

  if (score >= 80) return { score, level: "High", tone: "high", reasons };
  if (score >= 55) return { score, level: "Medium", tone: "medium", reasons };
  if (score >= 30) return { score, level: "Low", tone: "low", reasons };
  return {
    score,
    level: "Balanced",
    tone: "balanced",
    reasons: ["No major risk pattern detected"],
  };
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];

  const headers = rows[0].split(",").map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((v) => v.trim());
    const obj = Object.fromEntries(headers.map((h, i) => [h, values[i]]));

    return {
      id: obj.student_id || obj.id || "Unknown",
      name: obj.name || "Unnamed Student",
      consent: ["true", "yes", "1"].includes(String(obj.consent).toLowerCase()),
      lms: Number(obj.lms_activity || obj.lms || 0),
      library: Number(obj.library_visits || obj.library || 0),
      dining: Number(obj.dining_count || obj.dining || 0),
      gym: Number(obj.gym_visits || obj.gym || 0),
      stress: Number(obj.self_report_stress || obj.stress || 0),
      sleep: Number(obj.sleep_hours || obj.sleep || 0),
      social: Number(obj.social_activity || obj.social || 0),
    };
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Badge({ children, tone = "dark" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function StatCard({ icon: Icon, value, label, tone = "blue" }) {
  return (
    <Card className="stat-card">
      <div className={`icon-box ${tone}`}>
        <Icon size={24} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </Card>
  );
}

function SectionHeader({ badge, title, description }) {
  return (
    <div className="section-header">
      <Badge tone="indigo">{badge}</Badge>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function BarChart({ items }) {
  const max = Math.max(100, ...items.map((i) => i.value));
  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-item" key={item.label}>
          <div className="bar-track">
            <div
              className={`bar-fill ${item.tone}`}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span>{item.label}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}

function TrendChart() {
  return (
    <div>
      <div className="trend-chart">
        {trendData.map((item) => (
          <div className="trend-col" key={item.week}>
            <div className="trend-bars">
              <div className="trend-bar stress" style={{ height: `${item.stress * 1.5}px` }} />
              <div className="trend-bar wellbeing" style={{ height: `${item.wellbeing * 1.5}px` }} />
            </div>
            <span>{item.week}</span>
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i className="legend-stress" /> Stress</span>
        <span><i className="legend-wellbeing" /> Wellbeing</span>
      </div>
    </div>
  );
}

function PieChart({ values }) {
  const total = values.reduce((sum, v) => sum + v.value, 0) || 1;
  let start = 0;
  const gradient = values.map((v) => {
    const end = start + (v.value / total) * 100;
    const segment = `${v.color} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ");

  return (
    <div className="pie-layout">
      <div className="pie" style={{ background: `conic-gradient(${gradient})` }}>
        <span>{total}</span>
      </div>
      <div className="pie-legend">
        {values.map((v) => (
          <div key={v.label}>
            <i style={{ background: v.color }} /> {v.label}: <b>{v.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ student }) {
  const metrics = [
    { label: "LMS", value: Math.min(100, student.lms) },
    { label: "Sleep", value: Math.min(100, student.sleep * 12) },
    { label: "Social", value: Math.min(100, student.social * 12) },
    { label: "Dining", value: Math.min(100, student.dining * 7) },
    { label: "Library", value: Math.min(100, student.library * 14) },
    { label: "Stress", value: Math.max(0, 100 - student.stress * 18) },
  ];

  const points = metrics.map((m, index) => {
    const angle = -90 + (360 / metrics.length) * index;
    const radius = (m.value / 100) * 86;
    const x = 110 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 110 + radius * Math.sin((angle * Math.PI) / 180);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="radar" viewBox="0 0 220 220">
      {[40, 65, 90].map((r) => (
        <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="#dbeafe" strokeWidth="1.5" />
      ))}
      {metrics.map((m, index) => {
        const angle = -90 + (360 / metrics.length) * index;
        const x = 110 + 96 * Math.cos((angle * Math.PI) / 180);
        const y = 110 + 96 * Math.sin((angle * Math.PI) / 180);
        return <line key={m.label} x1="110" y1="110" x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <polygon points={points} fill="rgba(79,70,229,0.24)" stroke="#4f46e5" strokeWidth="3" />
      {metrics.map((m, index) => {
        const angle = -90 + (360 / metrics.length) * index;
        const x = 110 + 105 * Math.cos((angle * Math.PI) / 180);
        const y = 110 + 105 * Math.sin((angle * Math.PI) / 180);
        return (
          <text
            key={m.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="800"
            fill="#475569"
          >
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function App() {
  const saved = loadState();
  const [students, setStudents] = useState(saved?.students || initialStudents);
  const [cases, setCases] = useState(saved?.cases || []);
  const [selectedStudentId, setSelectedStudentId] = useState(saved?.selectedStudentId || initialStudents[0].id);
  const [logs, setLogs] = useState(saved?.logs || [
    "Consent filter initialized",
    "Audit logging enabled",
    "Offline resource package ready",
  ]);
  const [query, setQuery] = useState("");

  const analyzed = useMemo(() => students.map((s) => ({ ...s, risk: riskOf(s) })), [students]);
  const selectedStudent = analyzed.find((s) => s.id === selectedStudentId) || analyzed[0];
  const filteredStudents = analyzed.filter((s) => `${s.id} ${s.name}`.toLowerCase().includes(query.toLowerCase()));
  const consented = students.filter((s) => s.consent).length;
  const flagged = analyzed.filter((s) => s.risk.score !== null && s.risk.score >= 55);
  const highRisk = analyzed.filter((s) => s.risk.level === "High").length;
  const reviewed = cases.filter((c) => c.decision !== "Pending").length;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, cases, selectedStudentId, logs }));
  }, [students, cases, selectedStudentId, logs]);

  function addLog(message) {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} — ${message}`, ...prev.slice(0, 10)]);
  }

  function runAI() {
    const generated = flagged.map((s, index) => ({
      caseId: `CASE-${3100 + index}`,
      studentId: s.id,
      name: s.name,
      score: s.risk.score,
      level: s.risk.level,
      reasons: s.risk.reasons,
      decision: "Pending",
      intervention: "Waiting for counselor review",
    }));
    setCases(generated);
    addLog(`${generated.length} explainable risk signal(s) generated for counselor review`);
  }

  function handleDecision(caseId, decision) {
    setCases((prev) =>
      prev.map((c) =>
        c.caseId === caseId
          ? {
              ...c,
              decision,
              intervention:
                decision === "Approve Support"
                  ? "Resource recommendation + counselor outreach"
                  : "Monitor only, no direct outreach",
            }
          : c
      )
    );
    addLog(`Counselor decision recorded for ${caseId}: ${decision}`);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imported = parseCSV(String(e.target?.result || ""));
      if (imported.length) {
        setStudents(imported);
        setCases([]);
        setSelectedStudentId(imported[0].id);
        addLog(`${imported.length} CSV records imported; consent filter applied`);
      }
    };
    reader.readAsText(file);
  }

  function downloadCSVTemplate() {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scwis_student_data_template.csv";
    a.click();
  }

  function downloadStudentData() {
    const blob = new Blob([JSON.stringify(selectedStudent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStudent.id}_scwis_data.json`;
    a.click();
    addLog(`${selectedStudent.id} downloaded personal data copy`);
  }

  function toggleConsent() {
    setStudents((prev) =>
      prev.map((s) => (s.id === selectedStudent.id ? { ...s, consent: !s.consent } : s))
    );
    addLog(`${selectedStudent.id} ${selectedStudent.consent ? "withdrew" : "granted"} analytics consent`);
  }

  function deleteStudentData() {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudent.id
          ? { ...s, lms: 0, library: 0, dining: 0, gym: 0, stress: 0, sleep: 0, social: 0, consent: false }
          : s
      )
    );
    addLog(`${selectedStudent.id} deleted optional wellness data`);
  }

  function resetLocalDatabase() {
    setStudents(initialStudents);
    setCases([]);
    setSelectedStudentId(initialStudents[0].id);
    setLogs(["Local database reset", "Consent filter initialized", "Audit logging enabled"]);
  }

  const riskBars = analyzed.map((s) => ({
    label: s.id.replace("S", ""),
    value: s.risk.score || 0,
    tone:
      s.risk.level === "High"
        ? "red"
        : s.risk.level === "Medium"
        ? "amber"
        : s.risk.level === "Low"
        ? "blue"
        : "green",
  }));

  const riskDistribution = [
    { label: "High", value: analyzed.filter((s) => s.risk.level === "High").length, color: "#f43f5e" },
    { label: "Medium", value: analyzed.filter((s) => s.risk.level === "Medium").length, color: "#f59e0b" },
    { label: "Low", value: analyzed.filter((s) => s.risk.level === "Low").length, color: "#0ea5e9" },
    { label: "Balanced", value: analyzed.filter((s) => s.risk.level === "Balanced").length, color: "#10b981" },
    { label: "Blocked", value: analyzed.filter((s) => s.risk.level === "Blocked").length, color: "#94a3b8" },
  ];

  const interventionStatus = [
    { label: "Pending", value: cases.filter((c) => c.decision === "Pending").length, color: "#f59e0b" },
    { label: "Support", value: cases.filter((c) => c.decision === "Approve Support").length, color: "#10b981" },
    { label: "Monitor", value: cases.filter((c) => c.decision === "Monitor Only").length, color: "#0ea5e9" },
  ];

  return (
    <div className="site">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />

      <header className="navbar">
        <a href="#top" className="brand">
          <div className="brand-icon"><HeartPulse /></div>
          <div>
            <strong>SCWIS</strong>
            <span>Smart Campus Wellness</span>
          </div>
        </a>

        <nav>
          <a href="#solution">Solution</a>
          <a href="#architecture">Architecture</a>
          <a href="#analytics">AI Analytics</a>
          <a href="#student">Student Portal</a>
          <a href="#counselor">Counselor Dashboard</a>
          <a href="#demo">Demo</a>
        </nav>

        <a href="#demo" className="nav-cta">Try Demo</a>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <Badge tone="indigo"><ShieldCheck size={14} /> Functional Prototype</Badge>
            <h1>Privacy-first wellness intelligence for proactive student support.</h1>
            <p>
              SCWIS converts consented campus behavior data into explainable risk signals,
              while keeping final decisions in the hands of trained counselors.
            </p>
            <div className="hero-actions">
              <a href="#demo" className="button primary">Launch Interactive Demo</a>
              <a href="#analytics" className="button secondary">View AI Analytics</a>
            </div>

            <div className="hero-stats">
              <StatCard icon={ShieldCheck} value={`${consented}/${students.length}`} label="Consented records" tone="green" />
              <StatCard icon={AlertTriangle} value={flagged.length} label="AI risk signals" tone="orange" />
              <StatCard icon={UserCheck} value={reviewed} label="Human decisions" tone="purple" />
            </div>
          </div>

          <Card className="hero-preview">
            <div className="preview-header">
              <div>
                <span>Enterprise Live Preview</span>
                <h2>SCWIS Command Center</h2>
              </div>
              <Badge tone="white"><WifiOff size={14} /> Offline-ready</Badge>
            </div>
            <div className="preview-body">
              <aside>
                {[
                  [Activity, "Overview"],
                  [Brain, "AI Analytics"],
                  [UserCheck, "Counselor Review"],
                  [ShieldCheck, "Student Privacy"],
                  [Database, "Local DB"],
                ].map(([Icon, label], index) => (
                  <div className={index === 0 ? "active" : ""} key={label}>
                    <Icon size={18} /> {label}
                  </div>
                ))}
              </aside>

              <div className="preview-main">
                <div className="mini-stats">
                  <div><span>Records</span><b>{students.length}</b></div>
                  <div><span>High Risk</span><b className="danger">{highRisk}</b></div>
                  <div><span>Pending Cases</span><b className="warning">{cases.filter((c) => c.decision === "Pending").length}</b></div>
                </div>

                <div className="queue">
                  <div className="queue-title">
                    <h3>Risk Signal Queue</h3>
                    <button onClick={runAI}>Run AI</button>
                  </div>
                  {analyzed.slice(0, 4).map((student) => (
                    <div className="queue-row" key={student.id}>
                      <div className="avatar">{student.name[0]}</div>
                      <div>
                        <strong>{student.name}</strong>
                        <span>{student.id} · consent {student.consent ? "yes" : "no"}</span>
                      </div>
                      <Badge tone={student.risk.tone}>
                        {student.risk.level}{student.risk.score !== null ? ` · ${student.risk.score}` : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section id="solution" className="section">
          <SectionHeader
            badge="Solution Focus"
            title="Designed for care, privacy, and operational feasibility."
            description="SCWIS balances proactive wellness support, privacy autonomy, human-centered intervention, and resilient campus integration."
          />

          <div className="three-grid">
            <Card>
              <div className="icon green"><ShieldCheck /></div>
              <h3>Consent-first data use</h3>
              <p>Student authorization is checked before storage, analytics, or counselor review.</p>
            </Card>
            <Card>
              <div className="icon purple"><Brain /></div>
              <h3>Explainable AI</h3>
              <p>Risk signals include transparent reasons such as sleep decline, isolation patterns, or stress check-ins.</p>
            </Card>
            <Card>
              <div className="icon orange"><UserCheck /></div>
              <h3>Human-in-the-loop</h3>
              <p>Counselors validate every case before any support message or intervention occurs.</p>
            </Card>
          </div>
        </section>

        <section id="architecture" className="section architecture">
          <div>
            <Badge tone="sky"><Network size={14} /> Proposed Solution Architecture</Badge>
            <h2>Five-layer architecture with a controlled data pipeline.</h2>
            <p>
              SCWIS connects campus systems, consent enforcement, privacy-separated storage,
              AI analysis, and role-based applications into one deployable architecture.
            </p>

            <div className="architecture-list">
              {[
                [Library, "Data Sources", "LMS, dining card, library, gym access, voluntary check-ins"],
                [ShieldCheck, "Consent Filter", "Authorization checked before processing"],
                [Database, "Local Prototype DB", "localStorage simulates persistent system data"],
                [Brain, "Intelligence Layer", "Rule-based AI detection and dashboard analytics"],
                [Users, "Application Layer", "Student portal, counselor dashboard, admin analytics"],
              ].map(([Icon, title, text]) => (
                <div className="architecture-item" key={title}>
                  <div><Icon size={22} /></div>
                  <span><strong>{title}</strong><small>{text}</small></span>
                </div>
              ))}
            </div>
          </div>

          <Card className="layer-card">
            {["Multi-source Campus Data", "Consent Filter", "Persistent Local Database", "Explainable Intelligence", "Role-based Applications"].map((layer, index) => (
              <div className="layer" key={layer}>
                <b>0{index + 1}</b>
                <span>{layer}</span>
              </div>
            ))}
          </Card>
        </section>

        <section id="analytics" className="section">
          <SectionHeader
            badge="AI Detection Analytics"
            title="Visual risk intelligence for decision support."
            description="The AI module does not diagnose students. It visualizes consented behavioral patterns and flags cases for professional review."
          />

          <div className="analytics-grid">
            <Card className="chart-card">
              <div className="card-head">
                <h3>Risk Score by Student</h3>
                <Badge>AI Output</Badge>
              </div>
              <BarChart items={riskBars} />
            </Card>

            <Card className="chart-card">
              <div className="card-head">
                <h3>Risk Distribution</h3>
                <Badge tone="sky">Portfolio</Badge>
              </div>
              <PieChart values={riskDistribution} />
            </Card>

            <Card className="chart-card wide">
              <div className="card-head">
                <h3>Campus Stress and Wellbeing Trend</h3>
                <Badge tone="indigo">6-week view</Badge>
              </div>
              <TrendChart />
            </Card>
          </div>
        </section>

        <section id="student" className="section">
          <SectionHeader
            badge="Student Privacy Portal"
            title="Students can view, control, download, or delete their data."
            description="This portal demonstrates privacy autonomy and makes consent management visible."
          />

          <div className="student-portal">
            <Card>
              <h3>Student Profile</h3>
              <p>Select a student record to simulate a privacy portal.</p>

              <div className="student-list">
                {analyzed.map((student) => (
                  <button
                    key={student.id}
                    className={selectedStudent.id === student.id ? "selected" : ""}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    {student.name}
                  </button>
                ))}
              </div>

              <div className="privacy-actions">
                <button className={selectedStudent.consent ? "danger-action" : "safe-action"} onClick={toggleConsent}>
                  {selectedStudent.consent ? "Withdraw Analytics Consent" : "Grant Analytics Consent"}
                </button>
                <button onClick={downloadStudentData}><Download size={16} /> Download My Data</button>
                <button className="danger-outline" onClick={deleteStudentData}><Trash2 size={16} /> Delete Optional Data</button>
              </div>
            </Card>

            <Card>
              <div className="student-detail-head">
                <div className="avatar large">{selectedStudent.name[0]}</div>
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p>{selectedStudent.id} · Consent {selectedStudent.consent ? "Granted" : "Blocked"}</p>
                </div>
                <Badge tone={selectedStudent.risk.tone}>
                  {selectedStudent.risk.level}{selectedStudent.risk.score !== null ? ` · ${selectedStudent.risk.score}` : ""}
                </Badge>
              </div>

              <div className="data-grid">
                {[
                  ["LMS", selectedStudent.lms],
                  ["Library", selectedStudent.library],
                  ["Dining", selectedStudent.dining],
                  ["Gym", selectedStudent.gym],
                  ["Stress", selectedStudent.stress],
                  ["Sleep", selectedStudent.sleep],
                ].map(([label, value]) => (
                  <div key={label}><span>{label}</span><b>{value}</b></div>
                ))}
              </div>

              <div className="radar-wrap">
                <RadarChart student={selectedStudent} />
              </div>

              <div className="privacy-note">
                This system is for support, not surveillance. Optional data can be withdrawn or deleted by the student.
              </div>
            </Card>
          </div>
        </section>

        <section id="counselor" className="section">
          <SectionHeader
            badge="Counselor Enterprise Dashboard"
            title="Case prioritization with human validation."
            description="Counselors review explainable AI alerts, approve support actions, and maintain a complete audit trail."
          />

          <div className="dashboard-grid">
            <StatCard icon={AlertTriangle} value={flagged.length} label="Students needing review" tone="orange" />
            <StatCard icon={Users} value={cases.filter((c) => c.decision === "Pending").length} label="Pending cases" tone="purple" />
            <StatCard icon={CheckCircle2} value={reviewed} label="Reviewed decisions" tone="green" />
            <StatCard icon={MessageCircle} value={cases.filter((c) => c.decision === "Approve Support").length} label="Support outreach" tone="blue" />
          </div>

          <div className="counselor-layout">
            <Card>
              <div className="card-head">
                <h3>Review Queue</h3>
                <button className="small-button" onClick={runAI}>Refresh AI Queue</button>
              </div>

              <div className="case-grid">
                {cases.length === 0 && (
                  <div className="empty-case">
                    <FileText size={42} />
                    <strong>No active cases</strong>
                    <span>Run AI detection first.</span>
                  </div>
                )}

                {cases.map((item) => (
                  <div className="case-card" key={item.caseId}>
                    <small>{item.caseId}</small>
                    <h4>{item.name}</h4>
                    <Badge tone={item.level === "High" ? "high" : "medium"}>{item.level} · {item.score}</Badge>
                    {item.reasons.slice(0, 3).map((reason) => <p key={reason}>• {reason}</p>)}
                    <div className="case-actions">
                      <button onClick={() => handleDecision(item.caseId, "Approve Support")}><CheckCircle2 size={16} /> Support</button>
                      <button onClick={() => handleDecision(item.caseId, "Monitor Only")}><Eye size={16} /> Monitor</button>
                    </div>
                    <span className="decision">Decision: {item.decision}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="chart-card">
              <div className="card-head">
                <h3>Intervention Status</h3>
                <Badge tone="sky">Live</Badge>
              </div>
              <PieChart values={interventionStatus} />
            </Card>
          </div>
        </section>

        <section id="demo" className="section">
          <SectionHeader
            badge="Interactive Demo & Local Database"
            title="Upload data, run AI, review cases, and persist changes."
            description="This prototype uses browser localStorage as a front-end database. Refreshing the page keeps imported data, cases, consent changes, and audit logs."
          />

          <div className="demo-grid">
            <Card>
              <h3>Data Import</h3>
              <p>Upload student records using CSV. Consent is enforced immediately after import.</p>

              <label className="upload-box">
                <Upload size={42} />
                <strong>Select CSV File</strong>
                <span>Records without consent are blocked</span>
                <input type="file" accept=".csv" onChange={handleUpload} />
              </label>

              <button className="wide-button dark" onClick={downloadCSVTemplate}><Download size={18} /> Download CSV Template</button>
              <button className="wide-button purple" onClick={runAI}><Brain size={18} /> Run AI Detection</button>
              <button className="wide-button light" onClick={resetLocalDatabase}><Database size={18} /> Reset Local Database</button>
            </Card>

            <Card>
              <div className="records-head">
                <div>
                  <h3>Student Records & Risk Signals</h3>
                  <p>Search imported records and inspect AI explanations.</p>
                </div>
                <div className="search-box">
                  <Search size={18} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student or ID" />
                </div>
              </div>

              <div className="records-list">
                {filteredStudents.map((student) => (
                  <div className="record-row" key={student.id}>
                    <div className="avatar dark">{student.name[0]}</div>
                    <div>
                      <strong>{student.name}</strong>
                      <span>{student.id} · Consent {student.consent ? "Granted" : "Blocked"}</span>
                    </div>
                    <Badge tone={student.risk.tone}>
                      {student.risk.level}{student.risk.score !== null ? ` · ${student.risk.score}` : ""}
                    </Badge>
                    <p>{student.risk.reasons.slice(0, 2).join("; ")}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="audit-card">
            <h3>Audit Log</h3>
            <p>Every import, consent change, data deletion, AI detection, and counselor decision is traceable.</p>
            <div className="log-list">
              {logs.map((log, index) => <div key={index}>{log}</div>)}
            </div>
          </Card>
        </section>
      </main>

      <footer className="footer">
        <div className="brand">
          <div className="brand-icon"><HeartPulse /></div>
          <div>
            <strong>SCWIS</strong>
            <span>No automatic intervention · Consent-first · Human-in-the-loop</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
