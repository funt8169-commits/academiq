import { useState, useRef, useEffect } from "react";

const SECTIONS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "ielts", label: "IELTS", icon: "📝" },
  { id: "toefl", label: "TOEFL", icon: "🎓" },
  { id: "writing", label: "Academic Writing", icon: "✍️" },
  { id: "vocab", label: "Vocabulary", icon: "📚" },
];

const IELTS_TOPICS = [
  { id: "reading", label: "Reading", desc: "Practice passages & questions" },
  { id: "writing_task1", label: "Writing Task 1", desc: "Describe charts & graphs" },
  { id: "writing_task2", label: "Writing Task 2", desc: "Essay writing practice" },
  { id: "listening", label: "Listening Tips", desc: "Strategies & exercises" },
  { id: "speaking", label: "Speaking", desc: "Part 1, 2, 3 practice" },
];

const TOEFL_TOPICS = [
  { id: "integrated_writing", label: "Integrated Writing", desc: "Read + Listen + Write" },
  { id: "independent_writing", label: "Independent Writing", desc: "Opinion essay practice" },
  { id: "reading_comp", label: "Reading Comprehension", desc: "Academic texts practice" },
  { id: "speaking_tasks", label: "Speaking Tasks", desc: "Independent & integrated" },
];

const WRITING_TOPICS = [
  { id: "email", label: "Academic Email", desc: "Write to professors & supervisors" },
  { id: "abstract", label: "Research Abstract", desc: "Summarize your research" },
  { id: "literature", label: "Literature Review", desc: "Cite & synthesize sources" },
  { id: "sop", label: "Statement of Purpose", desc: "PhD application SOP help" },
  { id: "cv", label: "Academic CV", desc: "Phrases & structure help" },
];

const SYSTEM_PROMPTS = {
  ielts_reading: `You are an IELTS expert tutor for Arabic-speaking students. Help with IELTS Reading. 
Give a short academic passage (150 words) followed by 3 questions (True/False/Not Given or multiple choice).
After the student answers, give detailed feedback and explain the correct answers.
Use simple clear English. Add Arabic tips when needed.`,

  ielts_writing_task1: `You are an IELTS Writing Task 1 tutor for Arabic speakers. 
Describe a chart type (bar, line, pie, table) scenario and ask the student to write a Task 1 response.
Then evaluate their response on: Task Achievement, Coherence, Lexical Resource, Grammar (each out of 9).
Give specific improvement tips. Add a model answer.`,

  ielts_writing_task2: `You are an IELTS Writing Task 2 tutor for Arabic speakers.
Give an essay question on a common IELTS topic. Ask the student to write their response.
Evaluate on all 4 IELTS criteria (each out of 9). Give band score estimate.
Highlight good phrases used and suggest better academic alternatives for weak phrases.
Give a brief model paragraph for the introduction.`,

  ielts_listening: `You are an IELTS Listening strategies tutor for Arabic speakers.
Share one key listening strategy with a practice exercise (fill in the blank from a described audio scenario).
Give tips specific to Arabic speakers' common mistakes. Keep it practical and encouraging.`,

  ielts_speaking: `You are an IELTS Speaking tutor for Arabic speakers.
Give a Part 2 cue card topic. Ask the student to write what they would say.
Evaluate their response: fluency ideas, vocabulary, grammar, pronunciation tips.
Give a model answer and highlight useful phrases for that topic.
Band score estimate out of 9.`,

  toefl_integrated_writing: `You are a TOEFL Integrated Writing tutor for Arabic speakers.
Describe a reading passage topic (3 main points) and a lecture that contradicts it.
Ask the student to write a 150-225 word response explaining how the lecture relates to the reading.
Evaluate: Development, Organization, Language Use. Give score estimate (0-5 scale).`,

  toefl_independent_writing: `You are a TOEFL Independent Writing tutor for Arabic speakers.
Give an opinion question. Ask student to write 300-350 word essay.
Evaluate on TOEFL rubric: Development/Support, Organization, Language Use (0-5).
Give specific feedback on academic vocabulary and sentence variety.`,

  toefl_reading_comp: `You are a TOEFL Reading tutor for Arabic speakers.
Give a short academic passage (200 words) on a science or social topic.
Ask 4 TOEFL-style questions (multiple choice, vocab in context, inference).
After answers, explain each correct answer with reference to the text.`,

  toefl_speaking_tasks: `You are a TOEFL Speaking tutor for Arabic speakers.
Give a Task 1 (independent) speaking prompt. Ask student to write what they would say in 45 seconds.
Evaluate: Delivery, Language Use, Topic Development (0-4 scale each).
Give model response and pronunciation tips for Arabic speakers.`,

  writing_email: `You are an academic English writing tutor for Arabic-speaking PhD/Masters students.
Help write professional academic emails in English (to professors, supervisors, conference organizers).
Ask for the purpose of the email, then draft a professional version.
Explain key phrases used and why they are appropriate in academic culture.`,

  writing_abstract: `You are an academic writing tutor for Arabic-speaking researchers.
Help write or improve research abstracts. Ask for: title, background, method, results, conclusion.
Then write a polished abstract (150-250 words) following IMRaD structure.
Highlight key academic phrases used.`,

  writing_literature: `You are an academic writing tutor for Arabic-speaking researchers.
Help with literature review writing. Teach citation language, synthesis phrases, and critical evaluation.
Give example sentences for: agreeing with a source, disagreeing, comparing sources, identifying gaps.
Arabic speakers often over-describe without analysis — address this specifically.`,

  writing_sop: `You are a PhD application Statement of Purpose advisor for Arabic-speaking students.
Help write a compelling, authentic SOP. Ask: field of study, research interests, past experience, target university.
Write a strong opening paragraph and give structure advice for the full SOP.
Avoid generic phrases — make it specific and genuine.`,

  writing_cv: `You are an academic CV writing tutor for Arabic-speaking students.
Help improve academic CV language for PhD applications. 
Provide strong action verbs, phrases for describing research experience, publications, and skills.
Review the student's descriptions and suggest more impactful academic English phrasing.`,

  vocab: `You are a vocabulary tutor specializing in academic English for Arabic-speaking students.
Teach words from the Academic Word List (AWL) that are useful for IELTS, TOEFL, and academic writing.
For each word provide: definition, pronunciation, example in academic context, Arabic translation, 
a common mistake Arabic speakers make with this word, and 2 synonyms.
Make it engaging and memorable. Test the student with a fill-in-the-blank exercise after.`,
};

const getSystemPrompt = (section, topic) => {
  const key = topic ? `${section}_${topic}` : section;
  return SYSTEM_PROMPTS[key] || SYSTEM_PROMPTS[section] || 
    `You are a helpful academic English tutor for Arabic-speaking students preparing for IELTS/TOEFL and academic writing. Be encouraging, clear, and give practical advice.`;
};

export default function AcademiQ() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async (section, topic) => {
    setActiveSection(section);
    setActiveTopic(topic);
    setMessages([]);
    setChatStarted(true);
    setLoading(true);

    const starters = {
      ielts_reading: "Give me a reading practice passage with questions.",
      ielts_writing_task1: "Give me a Writing Task 1 practice question.",
      ielts_writing_task2: "Give me a Writing Task 2 essay question.",
      ielts_listening: "Teach me a key listening strategy.",
      ielts_speaking: "Give me a Part 2 cue card to practice.",
      toefl_integrated_writing: "Give me an Integrated Writing task.",
      toefl_independent_writing: "Give me an Independent Writing question.",
      toefl_reading_comp: "Give me a reading comprehension passage.",
      toefl_speaking_tasks: "Give me a Speaking Task 1 prompt.",
      writing_email: "Help me write an academic email.",
      writing_abstract: "Help me write a research abstract.",
      writing_literature: "Teach me literature review phrases.",
      writing_sop: "Help me write my Statement of Purpose.",
      writing_cv: "Help me improve my academic CV language.",
      vocab: "Teach me an important academic vocabulary word.",
    };

    const key = topic ? `${section}_${topic}` : section;
    const starter = starters[key] || "Let's start practicing!";
    await callAPI(starter, section, topic, []);
  };

  const callAPI = async (userMsg, section, topic, history) => {
    const newHistory = [...history, { role: "user", content: userMsg }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: getSystemPrompt(section, topic),
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, an error occurred.";
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);
    const updated = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    await callAPI(msg, activeSection, activeTopic, messages);
  };

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  const goBack = () => {
    setChatStarted(false);
    setMessages([]);
    setActiveTopic(null);
  };

  // Colors per section
  const sectionColors = {
    home: "#2563EB",
    ielts: "#7C3AED",
    toefl: "#0891B2",
    writing: "#059669",
    vocab: "#D97706",
  };
  const color = sectionColors[activeSection] || "#2563EB";

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E5E3DC", padding: "0 20px", display: "flex", alignItems: "center", gap: 8, height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginRight: 16, letterSpacing: -0.5 }}>
          Academi<span style={{ color: "#2563EB" }}>Q</span>
        </div>
        {SECTIONS.filter(s => s.id !== "home").map(s => (
          <button key={s.id}
            onClick={() => { setActiveSection(s.id); setChatStarted(false); setMessages([]); setActiveTopic(null); }}
            style={{
              background: activeSection === s.id ? `${sectionColors[s.id]}15` : "transparent",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeSection === s.id ? 600 : 400,
              color: activeSection === s.id ? sectionColors[s.id] : "#666",
              display: "flex", alignItems: "center", gap: 5,
            }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, maxWidth: 780, width: "100%", margin: "0 auto", padding: "24px 20px" }}>

        {/* HOME */}
        {activeSection === "home" && !chatStarted && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px", letterSpacing: -1 }}>
                Master Academic English
              </h1>
              <p style={{ color: "#666", fontSize: 16, margin: 0 }}>
                AI-powered IELTS & TOEFL prep for Arabic-speaking students
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              {[
                { id: "ielts", title: "IELTS Preparation", desc: "Reading, Writing, Listening, Speaking practice with band score feedback", color: "#7C3AED", icon: "📝" },
                { id: "toefl", title: "TOEFL Preparation", desc: "Integrated & Independent tasks, Reading comprehension, Speaking practice", color: "#0891B2", icon: "🎓" },
                { id: "writing", title: "Academic Writing", desc: "Emails, abstracts, literature reviews, SOP for PhD applications", color: "#059669", icon: "✍️" },
                { id: "vocab", title: "Academic Vocabulary", desc: "AWL words with Arabic translation, examples and practice exercises", color: "#D97706", icon: "📚" },
              ].map(card => (
                <div key={card.id}
                  onClick={() => setActiveSection(card.id)}
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E3DC",
                    borderRadius: 14,
                    padding: "20px",
                    cursor: "pointer",
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${card.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: card.color, marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{card.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 14, color: "#1D4ED8" }}>
                🤖 Powered by Claude AI — Get personalized feedback like having a private tutor
              </p>
            </div>
          </div>
        )}

        {/* IELTS Topics */}
        {activeSection === "ielts" && !chatStarted && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#1a1a1a", marginBottom: 6 }}>📝 IELTS Preparation</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Choose a skill to practice with AI feedback</p>
            <div style={{ display: "grid", gap: 12 }}>
              {IELTS_TOPICS.map(t => (
                <div key={t.id} onClick={() => startChat("ielts", t.id)}
                  style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#7C3AED"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#E5E3DC"}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#7C3AED", marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{t.desc}</div>
                  </div>
                  <span style={{ color: "#7C3AED", fontSize: 18 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOEFL Topics */}
        {activeSection === "toefl" && !chatStarted && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#1a1a1a", marginBottom: 6 }}>🎓 TOEFL Preparation</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Practice TOEFL tasks with detailed scoring</p>
            <div style={{ display: "grid", gap: 12 }}>
              {TOEFL_TOPICS.map(t => (
                <div key={t.id} onClick={() => startChat("toefl", t.id)}
                  style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#0891B2"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#E5E3DC"}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#0891B2", marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{t.desc}</div>
                  </div>
                  <span style={{ color: "#0891B2", fontSize: 18 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Writing Topics */}
        {activeSection === "writing" && !chatStarted && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#1a1a1a", marginBottom: 6 }}>✍️ Academic Writing</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Professional academic English for your research & applications</p>
            <div style={{ display: "grid", gap: 12 }}>
              {WRITING_TOPICS.map(t => (
                <div key={t.id} onClick={() => startChat("writing", t.id)}
                  style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#059669"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#E5E3DC"}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#059669", marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{t.desc}</div>
                  </div>
                  <span style={{ color: "#059669", fontSize: 18 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary */}
        {activeSection === "vocab" && !chatStarted && (
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#1a1a1a", marginBottom: 6 }}>📚 Academic Vocabulary</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Build your AWL vocabulary with Arabic support</p>
            <div style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 14, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
              <p style={{ color: "#666", marginBottom: 20, fontSize: 15 }}>
                Learn Academic Word List (AWL) vocabulary essential for IELTS, TOEFL, and research writing — with Arabic translations and practice exercises.
              </p>
              <button onClick={() => startChat("vocab", null)}
                style={{ background: "#D97706", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Start Learning Words →
              </button>
            </div>
          </div>
        )}

        {/* CHAT INTERFACE */}
        {chatStarted && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={goBack}
                style={{ background: "none", border: `1px solid ${color}`, borderRadius: 8, color, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                ← Back
              </button>
              <button onClick={() => startChat(activeSection, activeTopic)}
                style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, color, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                🔄 New Practice
              </button>
            </div>

            {/* Messages */}
            <div style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 16, padding: 16, minHeight: 380, maxHeight: 460, overflowY: "auto", marginBottom: 14 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 16, display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: msg.role === "user" ? color : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, border: msg.role === "user" ? "none" : "1px solid #E5E3DC" }}>
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div style={{
                    background: msg.role === "user" ? `${color}12` : "#F9F8F5",
                    border: `1px solid ${msg.role === "user" ? color + "30" : "#E5E3DC"}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    maxWidth: "80%",
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#1a1a1a",
                  }}
                    dangerouslySetInnerHTML={{ __html: `<p style="margin:0">${fmt(msg.content)}</p>` }}
                  />
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, border: "1px solid #E5E3DC" }}>🤖</div>
                  <div style={{ background: "#F9F8F5", border: "1px solid #E5E3DC", borderRadius: 12, padding: "12px 16px" }}>
                    <span style={{ display: "inline-flex", gap: 4 }}>
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", animation: `bounce 1s ${d}s infinite` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your answer or question..."
                disabled={loading}
                style={{ flex: 1, border: `1px solid ${loading ? "#E5E3DC" : color + "60"}`, borderRadius: 10, padding: "11px 16px", fontSize: 14, outline: "none", color: "#1a1a1a", background: loading ? "#fafafa" : "#fff" }}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                style={{ background: loading || !input.trim() ? "#E5E3DC" : color, border: "none", borderRadius: 10, width: 46, cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: 18, color: "#fff", transition: "background 0.2s" }}>
                ↑
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>
    </div>
  );
}
