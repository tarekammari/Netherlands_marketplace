"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Plus,
  Trash,

  X,
  FileText,
  Image as ImageIcon,
  Database,
  FileArchive,
  UploadCloud,
  Loader2,

} from "lucide-react";
import { TaskCategory } from "@prisma/client";

interface MilestoneInput {
  title: string;
  description: string;
  dueDate: string;
  amountEur: string;
}

export interface AttachmentItem {
  name: string;
  url: string;
  size: number;
  type: string;
}

// ── Categorized Default Skills ───────────────────────────────────────────────
const PREDEFINED_SKILL_CATEGORIES = [
  {
    name: "Design & Creative",
    skills: ["Figma", "UI/UX Design", "Brand Identity", "Adobe Illustrator", "Graphic Design", "Wireframing", "Prototyping"],
  },
  {
    name: "Development & Tech",
    skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Database Design", "Web Development", "API Integration", "Next.js"],
  },
  {
    name: "Research & Data",
    skills: ["Market Research", "Data Analysis", "Data Visualization", "Excel", "Survey Design", "Statistics", "Power BI"],
  },
  {
    name: "Marketing & Content",
    skills: ["SEO", "Copywriting", "Social Media", "Content Strategy", "Growth Marketing", "Email Marketing"],
  },
  {
    name: "Business & Finance",
    skills: ["Financial Modeling", "Business Strategy", "Pitch Deck", "Dutch Tax Law", "Market Entry"],
  },
];

export function CreateTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("RESEARCH");

  // Skills management state
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Market Research"]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [budgetEur, setBudgetEur] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverables, setDeliverables] = useState("");

  // Start with one default milestone
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", dueDate: "", amountEur: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Skill selection handlers ─────────────────────────────────────────────
  const togglePredefinedSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      if (selectedSkills.length >= 10) {
        setError("Maximum 10 skills allowed.");
        return;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    if (selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkillInput("");
      return;
    }

    if (selectedSkills.length >= 10) {
      setError("Maximum 10 skills allowed.");
      return;
    }

    setSelectedSkills([...selectedSkills, trimmed]);
    setCustomSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillToRemove));
  };

  // ── File upload handler ──────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploadingFile(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        if (file.size > 25 * 1024 * 1024) {
          setUploadError(`File "${file.name}" exceeds 25MB limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to upload ${file.name}`);
        }

        const data: AttachmentItem = await res.json();
        setAttachments((prev) => [...prev, data]);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Helper function to format file sizes cleanly
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper for attachment icon
  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (fileType.includes("image") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (["csv", "json", "sql", "xlsx", "xls", "db"].includes(ext || "") || fileType.includes("json") || fileType.includes("csv")) {
      return <Database className="h-5 w-5 text-emerald-500" />;
    }
    if (["zip", "tar", "gz", "7z", "rar"].includes(ext || "")) {
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    }
    return <FileText className="h-5 w-5 text-rose-500" />;
  };

  // ── Milestone handlers ───────────────────────────────────────────────────
  const addMilestone = () => {
    setMilestones([...milestones, { title: "", description: "", dueDate: "", amountEur: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length === 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    const ms = updated[index];
    if (ms) {
      ms[field] = value;
      setMilestones(updated);
    }
  };

  const distributeBudgetEqually = () => {
    if (!budgetEur || parseFloat(budgetEur) <= 0) return;
    const total = parseFloat(budgetEur);
    const count = milestones.length;
    const equalShare = (total / count).toFixed(2);

    const updated = milestones.map((ms, idx) => {
      if (idx === count - 1) {
        const sumOfPrev = parseFloat(equalShare) * (count - 1);
        const lastShare = (total - sumOfPrev).toFixed(2);
        return { ...ms, amountEur: lastShare };
      }
      return { ...ms, amountEur: equalShare };
    });
    setMilestones(updated);
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.length < 10) {
      setError("Title must be at least 10 characters.");
      return;
    }
    if (description.length < 50) {
      setError("Description must be at least 50 characters.");
      return;
    }
    if (deliverables.length < 20) {
      setError("Deliverables details must be at least 20 characters.");
      return;
    }

    const budgetCents = Math.round(parseFloat(budgetEur) * 100);
    if (isNaN(budgetCents) || budgetCents < 1000) {
      setError("Minimum budget is €10.00.");
      return;
    }

    if (!deadline) {
      setError("Deadline date is required.");
      return;
    }

    if (selectedSkills.length === 0) {
      setError("Please select or add at least one required skill.");
      return;
    }

    // Milestones check
    let milestoneSumCents = 0;
    const formattedMilestones = [];

    for (let i = 0; i < milestones.length; i++) {
      const ms = milestones[i];
      if (!ms) continue;
      if (ms.title.length < 3) {
        setError(`Milestone ${i + 1} title must be at least 3 characters.`);
        return;
      }
      if (ms.description.length < 10) {
        setError(`Milestone ${i + 1} description must be at least 10 characters.`);
        return;
      }
      if (!ms.dueDate) {
        setError(`Milestone ${i + 1} due date is required.`);
        return;
      }

      const amountCents = Math.round(parseFloat(ms.amountEur) * 100);
      if (isNaN(amountCents) || amountCents < 100) {
        setError(`Milestone ${i + 1} amount must be at least €1.00.`);
        return;
      }

      milestoneSumCents += amountCents;
      formattedMilestones.push({
        title: ms.title,
        description: ms.description,
        dueDate: new Date(ms.dueDate).toISOString(),
        amountCents,
        sortOrder: i,
      });
    }

    if (milestoneSumCents !== budgetCents) {
      setError(
        `Sum of milestone payments (€${(milestoneSumCents / 100).toFixed(
          2
        )}) must exactly equal the total budget (€${(budgetCents / 100).toFixed(2)}).`
      );
      return;
    }

    setLoading(true);

    try {
      // Serialize attachments into stringified JSON format for storage
      const attachmentsPayload = attachments.map((att) => JSON.stringify(att));

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          skillsRequired: selectedSkills,
          attachments: attachmentsPayload,
          budgetCents,
          deadline: new Date(deadline).toISOString(),
          deliverables,
          milestones: formattedMilestones,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create task.");
      }

      router.push("/enterprise/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* ── 1. Task Specifications ── */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2">
          1. Task Specifications
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-neutral-800">
              Task Title *
            </label>
            <Input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct Market Research on EV Charging Stations in Utrecht"
              className="rounded-2xl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-semibold text-neutral-800">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full h-10 rounded-2xl border border-neutral-200 px-4 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-[#f9f9fb] transition-all"
            >
              {Object.values(TaskCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* ── Skills Selection with Default Lists & Custom Addition ── */}
          <div className="space-y-3 p-4 bg-[#f9f9fb] rounded-2xl border border-neutral-200/80">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-800">
                Skills Required * ({selectedSkills.length}/10 selected)
              </label>
            </div>

            {/* Selected Skills Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white rounded-xl border border-neutral-200">
              {selectedSkills.length === 0 ? (
                <span className="text-xs text-neutral-400 self-center">
                  Select skills from the predefined list below or type custom ones...
                </span>
              ) : (
                selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="skill"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-neutral-900 text-white rounded-lg"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-300 transition-colors"
                      title="Remove skill"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {/* Add Custom Skill Input */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
                placeholder="Add a custom skill (e.g. SPSS, Rust, Power BI)..."
                className="rounded-xl h-9 text-xs flex-1 bg-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomSkill}
                className="h-9 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Skill
              </Button>
            </div>

            {/* Predefined Recommended Skills Categories */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-neutral-500">Popular & Predefined Skills:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {PREDEFINED_SKILL_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {cat.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.skills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => togglePredefinedSkill(skill)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${isSelected
                              ? "bg-brand-700 text-white border-brand-700 shadow-sm font-medium"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                              }`}
                          >
                            {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="budget" className="text-sm font-semibold text-neutral-800">
                Total Budget (&euro;) *
              </label>
              <Input
                id="budget"
                type="number"
                min="10"
                step="0.01"
                required
                value={budgetEur}
                onChange={(e) => setBudgetEur(e.target.value)}
                placeholder="e.g. 500.00"
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="text-sm font-semibold text-neutral-800">
                Final Project Deadline *
              </label>
              <Input
                id="deadline"
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-neutral-800">
              Detailed Description (Scope, requirements, context) *
            </label>
            <textarea
              id="description"
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed breakdown of the task..."
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-[#f9f9fb] transition-all min-h-[140px]"
            />
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <label htmlFor="deliverables" className="text-sm font-semibold text-neutral-800">
              Expected Deliverables *
            </label>
            <textarea
              id="deliverables"
              rows={3}
              required
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g. 1. Excel datasheet, 2. Summary PDF presentation (10 pages)"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-[#f9f9fb] transition-all min-h-[90px]"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Attach Context Files (PDFs, Images, Databases) ── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center justify-between">
          <span>2. Context & Information Files (Optional)</span>
          <span className="text-xs font-normal text-neutral-500">PDFs, Images, Datasets (CSV/JSON/SQL)</span>
        </h2>

        <div className="p-4 bg-[#f9f9fb] rounded-2xl border border-neutral-200 space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Attach reference files, design specifications, datasets, or codebases so student applicants have complete information to work on your task.
          </p>

          {/* File Upload Drop Area */}
          <div className="relative border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-neutral-400 bg-white transition-all cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.json,.sql,.xlsx,.xls,.zip,.doc,.docx,.txt"
              onChange={handleFileUpload}
              disabled={isUploadingFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              {isUploadingFile ? (
                <>
                  <Loader2 className="h-8 w-8 text-neutral-600 animate-spin" />
                  <p className="text-sm font-semibold text-neutral-700">Uploading context files...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="h-8 w-8 text-neutral-400" />
                  <div className="text-sm font-semibold text-neutral-800">
                    Click or drag & drop files here to attach
                  </div>
                  <p className="text-xs text-neutral-400">
                    Supports PDFs, PNG/JPG images, CSV/JSON/SQL databases, XLSX spreadsheets & ZIP archives (Up to 25MB each)
                  </p>
                </>
              )}
            </div>
          </div>

          {uploadError && (
            <p className="text-xs text-red-600 font-medium">{uploadError}</p>
          )}

          {/* Uploaded Attachments List */}
          {attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-neutral-700">Attached Files ({attachments.length}):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white border border-neutral-200 rounded-xl shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(att.type, att.name)}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-800 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-neutral-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove file"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Payment Milestones ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h2 className="text-base font-bold text-neutral-900">
            3. Payment Milestones & Escrow Allocation
          </h2>
          <button
            type="button"
            onClick={distributeBudgetEqually}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Distribute Budget Equally
          </button>
        </div>

        <div className="space-y-4">
          {milestones.map((ms, index) => (
            <Card key={index} className="border-neutral-200 shadow-sm relative overflow-visible">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">MILESTONE {index + 1}</span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-neutral-700">Milestone Title</label>
                    <Input
                      type="text"
                      required
                      value={ms.title}
                      onChange={(e) => handleMilestoneChange(index, "title", e.target.value)}
                      placeholder="e.g. Draft Report Submission"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-700">Payment Amount (&euro;)</label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={ms.amountEur}
                      onChange={(e) => handleMilestoneChange(index, "amountEur", e.target.value)}
                      placeholder="e.g. 250.00"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-neutral-700">Deliverable Details</label>
                    <Input
                      type="text"
                      required
                      value={ms.description}
                      onChange={(e) => handleMilestoneChange(index, "description", e.target.value)}
                      placeholder="Describe the deliverable to verify..."
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-700">Milestone Due Date</label>
                    <Input
                      type="date"
                      required
                      value={ms.dueDate}
                      onChange={(e) => handleMilestoneChange(index, "dueDate", e.target.value)}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addMilestone}
            className="w-full flex items-center justify-center gap-1 text-xs border-dashed border-neutral-300"
          >
            <Plus size={14} /> Add Another Payment Milestone
          </Button>
        </div>
      </div>

      {/* ── Submit / Controls ── */}
      <div className="pt-6 border-t border-neutral-100 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading || isUploadingFile}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          Publish Task
        </Button>
      </div>
    </form>
  );
}
