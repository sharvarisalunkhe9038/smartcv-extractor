import { useState, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, LayoutDashboard, FileText,
  Trash2, X, CheckCircle, Loader2, ChevronDown, ChevronUp, Users,
  Briefcase, GraduationCap, Building2, Calendar
} from "lucide-react";

const API = "http://127.0.0.1:8000";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Badge({ children, color = "cyan" }) {
  const colors = {
    cyan: "bg-cyan-900/60 text-cyan-300 border-cyan-700/50",
    green: "bg-green-900/60 text-green-300 border-green-700/50",
    purple: "bg-purple-900/60 text-purple-300 border-purple-700/50",
    orange: "bg-orange-900/60 text-orange-300 border-orange-700/50",
  };
  return (
    <span className={`inline-block text-xs font-mono px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }) {
  if (!value || value === "NA" || value === "") return null;
  return (
    <div>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  );
}

// ─── Resume Result Card ──────────────────────────────────────────────────────

function ResumeCard({ resume, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const d = resume.extracted_data || resume.data || resume;

  const hasInternships = Array.isArray(d.internships) && d.internships.length > 0;
  const hasCompanies = Array.isArray(d.previous_companies) && d.previous_companies.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/70 border border-slate-700 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <FileText size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="font-bold text-white">{d.name || "Unknown"}</p>
            <p className="text-slate-400 text-sm">{d.email || "—"}</p>
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {d.passout_year && d.passout_year !== "NA" && (
            <Badge color={d.passout_year === "Pursuing" ? "orange" : "green"}>
              {d.passout_year === "Pursuing" ? "🎓 Pursuing" : `Class of ${d.passout_year}`}
            </Badge>
          )}
          {d.years_of_experience && d.years_of_experience !== "NA" && (
            <Badge color="purple">⏱ {d.years_of_experience}</Badge>
          )}
          {resume._id && onDelete && (
            <button
              onClick={() => onDelete(resume._id)}
              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 transition"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Skills preview */}
      <div className="px-6 pb-3 flex flex-wrap gap-1">
        {Array.isArray(d.key_skills) && d.key_skills.slice(0, 6).map((s, i) => (
          <Badge key={i}>{s}</Badge>
        ))}
        {Array.isArray(d.key_skills) && d.key_skills.length > 6 && (
          <Badge>+{d.key_skills.length - 6} more</Badge>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-slate-700/50 space-y-5 mt-2">

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Phone" value={d.phone} />
                <InfoRow label="Experience" value={d.years_of_experience} />
                <InfoRow label="LinkedIn" value={d.linkedin} />
                <InfoRow label="GitHub" value={d.github} />
              </div>

              {/* Passout Year */}
              {d.passout_year && d.passout_year !== "NA" && (
                <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-4 py-3">
                  <GraduationCap size={18} className="text-cyan-400" />
                  <div>
                    <p className="text-slate-400 text-xs">Passout Year</p>
                    <p className="text-white font-semibold">
                      {d.passout_year === "Pursuing"
                        ? "Currently Pursuing Degree"
                        : d.passout_year}
                    </p>
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {Array.isArray(d.qualification) && d.qualification.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                    <GraduationCap size={12} /> Qualifications
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {d.qualification.map((q, i) => (
                      <Badge key={i} color="green">{q}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Companies */}
              {hasCompanies && (
                <div>
                  <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                    <Building2 size={12} /> Previous Companies
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {d.previous_companies.map((c, i) => (
                      <Badge key={i} color="purple">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Internships */}
              <div>
                <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
                  <Briefcase size={12} /> Internships
                </p>
                {hasInternships ? (
                  <div className="space-y-2">
                    {d.internships.map((intern, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-xl px-4 py-3">
                        <p className="text-white font-semibold text-sm">
                          {typeof intern === "object" ? intern.company : intern}
                        </p>
                        {typeof intern === "object" && (
                          <div className="flex gap-3 mt-1">
                            {intern.role && (
                              <span className="text-slate-400 text-xs">{intern.role}</span>
                            )}
                            {intern.duration && (
                              <span className="text-cyan-400 text-xs flex items-center gap-1">
                                <Calendar size={10} /> {intern.duration}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">NA</p>
                )}
              </div>

              {/* All Skills */}
              {Array.isArray(d.key_skills) && d.key_skills.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs mb-2">All Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {d.key_skills.map((s, i) => (
                      <Badge key={i}>{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {Array.isArray(d.projects) && d.projects.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs mb-2">Projects</p>
                  <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                    {d.projects.map((p, i) => (
                      <li key={i}>{typeof p === "object" ? JSON.stringify(p) : p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {resume.uploaded_at && (
                <p className="text-slate-600 text-xs">
                  Uploaded: {new Date(resume.uploaded_at).toLocaleString()}
                </p>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Upload Page ─────────────────────────────────────────────────────────────

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const ACCEPTED = ".pdf,.docx,.jpg,.jpeg,.png,.webp,.bmp";

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      /\.(pdf|docx|jpg|jpeg|png|webp|bmp)$/i.test(f.name)
    );
    setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select at least one resume");

    setResults([]);
    setStreaming(true);
    setProgress({ done: 0, total: files.length });

    const formData = new FormData();
    files.forEach(f => formData.append("files", f));

    try {
      const response = await fetch(`${API}/upload-resumes-stream/`, {
        method: "POST",
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (line.trim()) {
            const parsed = JSON.parse(line);
            setResults(prev => [...prev, parsed]);
            setProgress(prev => ({ ...prev, done: prev.done + 1 }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed. Is the backend running?");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-14 text-center transition-all duration-300 cursor-pointer
          ${dragging ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600 bg-slate-800/30 hover:border-cyan-600"}`}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <UploadCloud size={60} className="mx-auto mb-4 text-cyan-400" />
        <h2 className="text-2xl font-bold mb-2">Drag & Drop Resumes Here</h2>
        <p className="text-slate-400 mb-1">PDF, DOCX, JPG, PNG — upload multiple at once</p>
        <p className="text-slate-500 text-sm">Works for IT and Non-IT resumes • Supports image-based PDFs</p>
        <input
          id="fileInput"
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-2"
          >
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-cyan-400" />
                  <span className="text-sm text-slate-200">{f.name}</span>
                  <span className="text-xs text-slate-500">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition">
                  <X size={16} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {files.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleUpload}
          disabled={streaming}
          className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed
            py-4 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-3"
        >
          {streaming ? (
            <><Loader2 size={20} className="animate-spin" /> Processing {progress.done}/{progress.total} resumes...</>
          ) : (
            <><UploadCloud size={20} /> Extract {files.length} Resume{files.length > 1 ? "s" : ""}</>
          )}
        </motion.button>
      )}

      {/* Progress Bar */}
      {streaming && (
        <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-cyan-500 rounded-full"
            animate={{ width: `${(progress.done / progress.total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-400" />
            <h3 className="text-xl font-bold">
              {streaming ? "Extracting in real-time..." : `Extracted ${results.length} resume${results.length > 1 ? "s" : ""}`}
            </h3>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <ResumeCard key={i} resume={r} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function DashboardPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/resumes/`);
      setResumes(res.data.resumes);
      setLoaded(true);
    } catch {
      alert("Failed to load resumes. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id) => {
    try {
      await axios.delete(`${API}/resumes/${id}`);
      setResumes(prev => prev.filter(r => r._id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Resume Database</h2>
          <p className="text-slate-400 mt-1">All extracted resumes stored in MongoDB</p>
        </div>
        <button
          onClick={fetchResumes}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          {loaded ? "Refresh" : "Load All Resumes"}
        </button>
      </div>

      {loaded && (
        <div className="mb-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-3xl font-bold">{resumes.length}</p>
            <p className="text-slate-400 text-sm">Total Resumes</p>
          </div>
        </div>
      )}

      {!loaded && !loading && (
        <div className="text-center py-20 text-slate-500">
          <LayoutDashboard size={48} className="mx-auto mb-4 opacity-30" />
          <p>Click "Load All Resumes" to view your database</p>
        </div>
      )}

      <div className="space-y-3">
        {resumes.map((r, i) => (
          <ResumeCard
            key={r._id}
            resume={{ ...r.extracted_data, _id: r._id, uploaded_at: r.uploaded_at }}
            onDelete={deleteResume}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white font-sans">

      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            Smart<span className="text-cyan-400">CV</span>
          </h1>
        </div>

        <div className="flex bg-slate-800/80 rounded-xl p-1 gap-1">
          {[
            { id: "upload", icon: UploadCloud, label: "Upload" },
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
                ${page === id ? "bg-cyan-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </nav>

      {page === "upload" && (
        <div className="text-center pt-16 pb-6 px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold"
          >
            AI Powered <span className="text-cyan-400">Resume Extractor</span>
          </motion.h1>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Upload multiple resumes — IT or Non-IT, PDF or Image. Get structured data in real-time.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {page === "upload" ? <UploadPage /> : <DashboardPage />}
        </motion.div>
      </AnimatePresence>

      <div className="text-center py-8 text-slate-600 text-sm">
        SmartCV Extractor — Powered by Groq + MongoDB + FastAPI
      </div>
    </div>
  );
}