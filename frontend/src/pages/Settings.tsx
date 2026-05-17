import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

type LoggedInUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  skills?: string[] | string;
  updatedAt?: string;
  lastLogin?: string;
};

type StatusMessage = {
  tone: "success" | "error" | "info";
  text: string;
};

const defaultSkills = [
  "React",
  "TypeScript",
  "Tailwind CSS",
  "REST APIs",
  "Resume Parsing",
];

export default function Settings() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("loggedInUser");
  let parsedUser: LoggedInUser = {};
  if (storedUser) {
    try {
      parsedUser = JSON.parse(storedUser) as LoggedInUser;
    } catch {
      parsedUser = {};
    }
  }

  const initialSkills = useMemo(() => {
    if (Array.isArray(parsedUser.skills)) {
      return parsedUser.skills;
    }
    if (typeof parsedUser.skills === "string") {
      return parsedUser.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
    return defaultSkills;
  }, [parsedUser.skills]);

  const [activeTab, setActiveTab] = useState<
    "profile" | "contact" | "education" | "skills" | "privacy"
  >("profile");
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const [profile, setProfile] = useState({
    firstName: parsedUser.firstName ?? "",
    lastName: parsedUser.lastName ?? "",
    headline: "",
    location: "",
    experience: "",
    industry: "",
    summary: "",
  });

  const [contact, setContact] = useState({
    email: parsedUser.email ?? "",
    mobile: parsedUser.mobile ?? "",
  });

  const [emailDraft, setEmailDraft] = useState(contact.email);
  const [mobileDraft, setMobileDraft] = useState(contact.mobile);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [skillDraft, setSkillDraft] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [searchable, setSearchable] = useState(true);
  const [metadata, setMetadata] = useState({
    updatedAt: "",
    lastLogin: "",
  });

  const [education, setEducation] = useState<any[]>([]);
  const [eduDraft, setEduDraft] = useState({
    degree: "",
    institution: "",
    year: "",
  });

  // --- REUSABLE FETCH FUNCTION ---
  const loadProfileData = async () => {
    try {
      const response = await api.get("/users/me/semantic");
      const realData = response.data;
      const parsed = realData.resumeParsed || {};

      const latestRole =
        parsed.experience && parsed.experience.length > 0
          ? parsed.experience[0].role
          : "";

      setProfile((prev) => ({
        ...prev,
        firstName: realData.firstName || prev.firstName,
        lastName: realData.lastName || prev.lastName,
        headline: parsed.current_role || latestRole || "",
        location: parsed.location || "",
        experience: parsed.experience ? `${parsed.experience.length} Roles` : "",
        industry: parsed.industry || "",
        summary: parsed.objective || "",
      }));

      setContact((prev) => ({
        ...prev,
        email: realData.email || prev.email,
        mobile:
          parsed.phones && parsed.phones.length > 0
            ? parsed.phones[0]
            : prev.mobile,
      }));

      setEmailDraft(realData.email || emailDraft);
      setMobileDraft(
        parsed.phones && parsed.phones.length > 0
          ? parsed.phones[0]
          : mobileDraft
      );

      if (
        parsed.skills &&
        Array.isArray(parsed.skills) &&
        parsed.skills.length > 0
      ) {
        setSkills(parsed.skills);
      }

      setMetadata({
        updatedAt: realData.updatedAt || "",
        lastLogin: realData.lastLogin || "",
      });

      if (parsed.education && Array.isArray(parsed.education)) {
        setEducation(parsed.education);
      }
    } catch (error) {
      console.error("Failed to load real profile data", error);
    }
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- RESUME UPLOAD LOGIC ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("info", "Uploading and parsing your new resume...");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await api.post("/users/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("success", "Resume parsed! Profile updated.");
      loadProfileData();
    } catch (error) {
      console.error("Upload failed", error);
      setMessage("error", "Failed to upload resume. Try again.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const setMessage = (tone: StatusMessage["tone"], text: string) => {
    setStatus({ tone, text });
    setTimeout(() => setStatus(null), 3500);
  };

  // --- PROFILE LOGIC ---
  const handleProfileSave = async () => {
    try {
      await api.post("/users/update-profile", {
        firstName: profile.firstName,
        lastName: profile.lastName,
        headline: profile.headline,
        location: profile.location,
        experience: profile.experience,
        industry: profile.industry,
        summary: profile.summary,
      });
      setMessage("success", "Profile details updated securely in database.");
      loadProfileData();
    } catch (error) {
      console.error("Failed to save profile", error);
      setMessage("error", "Failed to save profile. Please try again.");
    }
  };

  const handleDiscardChanges = () => {
    loadProfileData();
    setMessage("info", "Changes discarded. Original data restored.");
  };

  // --- CONTACT LOGIC ---
  const handleEmailSave = () => {
    if (!emailDraft.includes("@")) {
      setMessage("error", "Enter a valid email address.");
      return;
    }
    setContact((prev) => ({ ...prev, email: emailDraft }));
    setMessage("success", "Email updated successfully.");
  };

  const handleSendOtp = async () => {
    if (mobileDraft.trim().length < 8) {
      setMessage("error", "Enter a valid mobile number.");
      return;
    }

    try {
      await api.post("/users/send-otp", { phone: mobileDraft });
      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setMessage("info", "OTP sent! Check your backend terminal for the code.");
    } catch (error) {
      console.error("OTP Error:", error);
      setMessage("error", "Failed to send OTP. Is the backend running?");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) {
      setMessage("error", "Enter the 4 digit OTP.");
      return;
    }

    try {
      await api.post("/users/verify-otp", { phone: mobileDraft, otp: otp });
      setOtpVerified(true);
      setMessage("success", "Mobile number verified.");
    } catch (error) {
      console.error("Verify Error:", error);
      setMessage("error", "Invalid OTP code. Try again.");
    }
  };

  const handleUpdateMobile = async () => {
    if (!otpVerified) {
      setMessage("error", "Please verify OTP before updating.");
      return;
    }

    try {
      await api.post("/users/update-profile", {
        ...profile,
        phone: mobileDraft,
      });

      setContact((prev) => ({ ...prev, mobile: mobileDraft }));
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setMessage("success", "Mobile number updated securely in database.");
      loadProfileData();
    } catch (error) {
      console.error("Update Error:", error);
      setMessage("error", "Failed to save new mobile number.");
    }
  };


  // --- SKILLS LOGIC ---
  const handleAddSkill = async () => {
    const normalized = skillDraft.trim();
    if (!normalized) return;
    if (skills.includes(normalized)) {
      setMessage("info", "Skill already added.");
      return;
    }

    const updatedSkills = [...skills, normalized];
    setSkills(updatedSkills);
    setSkillDraft("");

    try {
      await api.post("/users/update-profile", {
        ...profile,
        skills: updatedSkills,
      });
      setMessage("success", "Skill added and saved.");
      loadProfileData();
    } catch (error) {
      console.error("Failed to save skill", error);
      setMessage("error", "Skill added locally, but failed to save to server.");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(updatedSkills);

    try {
      await api.post("/users/update-profile", {
        ...profile,
        skills: updatedSkills,
      });
      setMessage("success", "Skill removed.");
      loadProfileData();
    } catch (error) {
      console.error("Failed to remove skill", error);
      setMessage("error", "Failed to sync deletion with server.");
    }
  };

  // --- EDUCATION LOGIC ---
  const handleAddEducation = async () => {
    if (!eduDraft.degree || !eduDraft.institution) {
      setMessage("error", "Degree and Institution are required.");
      return;
    }

    const updatedEdu = [...education, eduDraft];
    setEducation(updatedEdu);
    setEduDraft({ degree: "", institution: "", year: "" });

    try {
      await api.post("/users/update-profile", {
        ...profile,
        education: updatedEdu,
      });
      setMessage("success", "Education added and saved.");
      loadProfileData();
    } catch (error) {
      console.error("Failed to save education", error);
      setMessage("error", "Failed to sync education with server.");
    }
  };

  const handleRemoveEducation = async (index: number) => {
    const updatedEdu = education.filter((_, i) => i !== index);
    setEducation(updatedEdu);

    try {
      await api.post("/users/update-profile", {
        ...profile,
        education: updatedEdu,
      });
      setMessage("success", "Education entry removed.");
      loadProfileData();
    } catch (error) {
      console.error("Failed to remove education", error);
      setMessage("error", "Failed to sync deletion with server.");
    }
  };

  const renderToast = () => {
    if (!status) return null;
    
    const icons = {
      success: (
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      info: (
        <svg className="w-5 h-5 text-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    return (
      <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom duration-500">
        <div className="glass flex items-center gap-3 rounded-2xl border border-outline-variant p-4 shadow-soft min-w-[320px] max-w-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high/50">
            {icons[status.tone]}
          </div>
          <div className="flex-1 pr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/50 mb-0.5">
              Notification
            </p>
            <p className="text-sm font-medium text-on-surface leading-tight">
              {status.text}
            </p>
          </div>
          <button 
            onClick={() => setStatus(null)}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface_variant/40 hover:text-on-surface_variant"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      const parts = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).formatToParts(date);
      
      const day = parts.find(p => p.type === "day")?.value;
      const month = parts.find(p => p.type === "month")?.value;
      const year = parts.find(p => p.type === "year")?.value;
      const hour = parts.find(p => p.type === "hour")?.value;
      const minute = parts.find(p => p.type === "minute")?.value;
      
      return `${day} ${month}, ${year} ${hour}:${minute}`;
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface px-4 py-10 selection:bg-primary-container/30">
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
        
        <header className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-soft relative overflow-hidden">
          {/* Subtle lab decoration */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <div className="w-32 h-32 border-b border-l border-on-surface rounded-bl-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex py-1 px-3 rounded bg-primary-container/10 text-primary-container text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
              Settings
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-space font-bold text-on-surface">My Profile Settings</h1>
                    <p className="text-sm text-on-surface_variant font-light mt-1">
                      Manage your profile details, contact information, and skills.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end text-right gap-1 md:mt-0 mt-2">
                    <div className="flex items-center gap-2 text-on-surface_variant/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Profile last updated</span>
                      <span className="text-xs font-space font-bold text-on-surface">
                        {formatDate(metadata.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface_variant/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Last login</span>
                      <span className="text-xs font-space font-medium">
                        {formatDate(metadata.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/resume")}
                  className="rounded-md border border-outline-variant bg-surface-container-highest/30 px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-on-surface_variant hover:bg-surface-container-highest/50 transition opacity-70 hover:opacity-100"
                >
                  Back to resume
                </button>

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md btn-gradient px-5 py-2.5 text-xs font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Upload New Resume
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 relative overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface_variant/60">
                Menu
              </p>
              <nav className="mt-4 space-y-2 relative z-10">
                {[
                  { id: "profile", label: "Profile Details" },
                  { id: "contact", label: "Email & Mobile" },
                  { id: "education", label: "Education Details" },
                  { id: "skills", label: "Skills Parsing" },
                  { id: "privacy", label: "Privacy & Visibility" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        item.id as "profile" | "contact" | "education" | "skills" | "privacy"
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                      activeTab === item.id
                        ? "bg-primary-container/10 text-primary-container border-l-2 border-primary-container pl-4"
                        : "border border-transparent text-on-surface_variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.id === "skills" && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary font-bold">
                        Alpha
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
              {/* Subtle background glow */}
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/8 transition-all duration-500" />
              
              <div className="flex items-center gap-2 relative z-10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface_variant/60">
                  Profile Completion
                </p>
              </div>
              
              <div className="mt-4 space-y-3 relative z-10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface font-semibold">Completeness</span>
                  <div className="flex items-center gap-1">
                    <span className="text-primary font-space font-bold">78%</span>
                  </div>
                </div>
                
                <div className="h-2 rounded-full bg-surface-container-highest/50 overflow-hidden p-[1px] border border-outline-variant/30">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_12px_rgba(0,108,73,0.4)] transition-all duration-1000 ease-out" 
                    style={{ width: '78%' }}
                  />
                </div>
                
                <div className="flex items-start gap-1.5 mt-2">
                  <svg className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-on-surface_variant/80 font-light leading-relaxed">
                    Add more details to increase visibility and unlock matchmaking options.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-5">
            {renderToast()}

            {activeTab === "profile" && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 relative overflow-hidden">
                <div className="flex flex-col gap-1 relative z-10">
                  <h2 className="text-xl font-space font-bold text-on-surface">Profile Details</h2>
                  <p className="text-sm text-on-surface_variant font-light leading-relaxed max-w-xl">
                    Configure your foundational details for better matchmaking.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">First Name</label>
                    <input
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Last Name</label>
                    <input
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Professional Headline</label>
                    <input
                      value={profile.headline}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          headline: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Location</label>
                    <input
                      value={profile.location}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Years of Experience</label>
                    <input
                      value={profile.experience}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          experience: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Industry</label>
                    <input
                      value={profile.industry}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          industry: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Professional Summary</label>
                    <textarea
                      rows={4}
                      value={profile.summary}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 relative z-10">
                  <button
                    type="button"
                    onClick={handleProfileSave}
                    className="rounded-md btn-gradient px-6 py-3 text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
                  >
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    className="rounded-md border border-outline-variant bg-surface-container-highest/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface_variant hover:bg-surface-container-highest/50 transition-all opacity-70 hover:opacity-100"
                  >
                    Discard Changes
                  </button>
                </div>
              </section>
            )}

            {activeTab === "contact" && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 relative overflow-hidden">
                <div className="flex flex-col gap-1 relative z-10">
                  <h2 className="text-xl font-space font-bold text-on-surface">Email & Mobile</h2>
                  <p className="text-sm text-on-surface_variant font-light leading-relaxed max-w-xl">
                    Manage your contact details to ensure you receive system alerts and messages.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Primary Email</label>
                      <input
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                      />
                      <p className="text-xs text-on-surface_variant/60 font-mono">
                        Active: {contact.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEmailSave}
                      className="rounded-md border border-outline-variant bg-surface-container-highest/30 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-on-surface_variant hover:bg-surface-container-highest/50 transition opacity-80 hover:opacity-100"
                    >
                      Update Email
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60">Mobile Number</label>
                      <input
                        value={mobileDraft}
                        onChange={(e) => setMobileDraft(e.target.value)}
                        className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                      />
                      <p className="text-xs text-on-surface_variant/60 font-mono">
                        Active: {contact.mobile || "None"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="rounded-md border border-outline-variant bg-surface-container-highest/30 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-on-surface_variant hover:bg-surface-container-highest/50 transition opacity-80 hover:opacity-100"
                      >
                        Send OTP
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateMobile}
                        className="rounded-md btn-gradient px-5 py-2.5 text-xs font-bold tracking-wide shadow-sm active:scale-[0.98] transition-all"
                      >
                        Save Number
                      </button>
                    </div>
                  </div>
                </div>

                {otpSent && (
                  <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 relative z-10 animate-in fade-in">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Enter 4-Digit OTP</label>
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full rounded-md bg-surface-bright px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-primary/30 focus:border-primary-container focus:ring-4 focus:ring-primary-container/10 font-mono tracking-widest"
                          placeholder="0 0 0 0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="rounded-md border border-primary/30 bg-primary/10 text-primary px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                      >
                        Verify
                      </button>
                      {otpVerified && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 py-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === "education" && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 relative overflow-hidden">
                <div className="flex flex-col gap-1 relative z-10">
                  <h2 className="text-xl font-space font-bold text-on-surface">Education Details</h2>
                  <p className="text-sm text-on-surface_variant font-light leading-relaxed max-w-xl">
                    Add your academic background to strengthen your profile.
                  </p>
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                  {education.map((edu, index) => (
                    <div
                      key={index}
                      className="group flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-4 transition-all hover:bg-surface-container-high relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(index)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface_variant/40 hover:text-red-500 hover:bg-red-500/5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      <div className="pr-10">
                        <p className="text-sm font-bold text-on-surface">{edu.degree}</p>
                        <p className="text-xs text-on-surface_variant mt-0.5">{edu.institution}</p>
                        {edu.year && (
                          <p className="text-[10px] font-mono text-primary mt-1 uppercase tracking-wider">{edu.year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {education.length === 0 && (
                    <p className="text-sm text-on-surface_variant font-light italic text-center py-6 bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant">
                      No education details added yet.
                    </p>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-outline-variant relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/60 mb-4">Add New Education</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/40 pl-1">Degree / Certification</label>
                      <input
                        value={eduDraft.degree}
                        onChange={(e) => setEduDraft(prev => ({ ...prev, degree: e.target.value }))}
                        placeholder="e.g. B.Tech Computer Science"
                        className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/40 pl-1">Institution</label>
                      <input
                        value={eduDraft.institution}
                        onChange={(e) => setEduDraft(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="e.g. Stanford University"
                        className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface_variant/40 pl-1">Year (Optional)</label>
                      <input
                        value={eduDraft.year}
                        onChange={(e) => setEduDraft(prev => ({ ...prev, year: e.target.value }))}
                        placeholder="e.g. 2018 - 2022"
                        className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="mt-6 w-full rounded-md btn-gradient px-6 py-3 text-sm font-bold tracking-wide shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
                  >
                    Add Education Entry
                  </button>
                </div>
              </section>
            )}

            {activeTab === "skills" && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 relative overflow-hidden">
                <div className="flex flex-col gap-1 relative z-10">
                  <h2 className="text-xl font-space font-bold text-on-surface">Skill Tags</h2>
                  <p className="text-sm text-on-surface_variant font-light leading-relaxed max-w-xl">
                    Add your key skills below to match with the best opportunities. Fine-tune your list for better discovery.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-2.5 relative z-10">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="group flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container-low py-1.5 pl-3 pr-2 text-xs font-semibold text-on-surface transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 text-on-surface_variant opacity-40 hover:opacity-100 focus:outline-none transition-opacity"
                        title={`Remove ${skill}`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                     <p className="text-xs text-on-surface_variant font-light italic">No skills added yet.</p>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto] relative z-10">
                  <input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    placeholder="Add new skill..."
                    className="w-full rounded-md bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder:text-on-surface_variant/30 outline-none transition-all duration-300 border-2 border-transparent focus:border-primary-container focus:bg-surface-bright focus:ring-4 focus:ring-primary-container/10"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-md border border-outline-variant bg-surface-container-highest/30 px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface_variant hover:bg-surface-container-highest/50 transition-all opacity-80 hover:opacity-100"
                  >
                    Add Skill
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md btn-gradient px-6 py-3 text-xs font-bold tracking-wide shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Parse from Resume
                  </button>
                </div>
              </section>
            )}

            {activeTab === "privacy" && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 relative overflow-hidden">
                 <div className="flex flex-col gap-1 relative z-10">
                  <h2 className="text-xl font-space font-bold text-on-surface">Privacy & Visibility</h2>
                  <p className="text-sm text-on-surface_variant font-light leading-relaxed max-w-xl">
                    Configure your profile visibility to govern who can see your resume and contact you.
                  </p>
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 transition-all hover:bg-surface-container-high">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Profile Visibility</p>
                      <p className="text-xs text-on-surface_variant mt-1">
                        Allow recruiters to view your full profile and resume metrics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVisibility((prev) => !prev)}
                      className={`rounded px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        visibility
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,108,73,0.1)]"
                          : "bg-surface-container-highest border border-outline-variant text-on-surface_variant opacity-70"
                      }`}
                    >
                      {visibility ? "Public" : "Private"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-5 py-4 transition-all hover:bg-surface-container-high">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Allow Matchmaking</p>
                      <p className="text-xs text-on-surface_variant mt-1">
                        Allow parameter-based synchronization via deep searches.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchable((prev) => !prev)}
                      className={`rounded px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        searchable
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,108,73,0.1)]"
                          : "bg-surface-container-highest border border-outline-variant text-on-surface_variant opacity-70"
                      }`}
                    >
                      {searchable ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}