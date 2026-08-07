"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import MediaUpload from "@/components/report/MediaUpload";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SeverityBadge, Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { compressImageToDataUrl } from "@/lib/image";
import { createIssue, findNearbyIssues } from "@/services/issues";
import type { VisionAnalysis, IssueCategory, Issue } from "@/types";
import { firebaseEnabled } from "@/lib/firebase";

const CATEGORIES: IssueCategory[] = [
  "Pothole",
  "Water Leakage",
  "Streetlight",
  "Waste Management",
  "Road Damage",
  "Drainage",
  "Public Safety",
  "Other",
];

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(reader.result?.toString().split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ReportPage() {
  const router = useRouter();
  const { user, isAuthed, signIn } = useAuth();
  const geo = useGeolocation();

  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Pothole");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<Issue[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const handleAnalyze = async () => {
    if (!file) return setError("Please upload a photo first.");
    if (file.type.startsWith("video")) {
      setError("AI analysis runs on photos. For video, pick a category below.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const base64 = await toBase64(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok || !data.analysis) {
        setError(data.error || "Analysis failed. Please try again.");
        return;
      }
      const a = data.analysis as VisionAnalysis;
      setAnalysis(a);
      setTitle(a.title);
      setDescription(a.description);
      setCategory(a.category);
    } catch {
      setError("Network error during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (skipDupCheck = false) => {
    if (!user) return signIn();
    if (!file) return setError("Please upload a photo.");
    if (!geo.coords) return setError("Please detect or set the location.");
    if (!title.trim()) return setError("Please add a title.");

    setError(null);
    setSubmitting(true);
    try {
      // duplicate detection within 120m of same category
      if (!skipDupCheck) {
        const nearby = await findNearbyIssues(
          geo.coords.lat,
          geo.coords.lng,
          120,
          category
        );
        if (nearby.length > 0) {
          setDuplicates(nearby);
          setSubmitting(false);
          return;
        }
      }

      // Store a compressed photo straight in Firestore (no Storage needed).
      // Videos can't fit a Firestore doc, so they're saved without media.
      const isImage = file.type.startsWith("image");
      const imageUrl = isImage
        ? await compressImageToDataUrl(file)
        : undefined;

      const id = await createIssue({
        title: title.trim(),
        description: description.trim(),
        category,
        severity: analysis?.severity ?? "Medium",
        department: analysis?.department,
        confidence: analysis?.confidence,
        riskScore: analysis?.risk_score,
        estimatedCost: analysis?.estimated_cost,
        estimatedFixTime: analysis?.estimated_fix_time,
        latitude: geo.coords.lat,
        longitude: geo.coords.lng,
        address: geo.address,
        imageUrl,
        mediaType: isImage ? "image" : "video",
        createdBy: user.id,
        createdByName: user.name,
        assignedTo: null,
      });
      router.push(`/issues/${id}`);
    } catch (e) {
      console.error(e);
      setError("Could not submit the report. Please try again.");
      setSubmitting(false);
    }
  };

  // ---- gates ----
  if (!firebaseEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          icon={<AlertTriangle />}
          title="Firebase not configured"
          description="Add your NEXT_PUBLIC_FIREBASE_* keys to .env.local to enable reporting, then restart the dev server."
        />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          icon={<ShieldCheck />}
          title="Sign in to report an issue"
          description="We attribute every report to a citizen for accountability and to award Hero Points."
          action={<Button onClick={signIn}>Sign in with Google</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
          <Sparkles size={14} /> AI Vision Agent
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Report a community issue
        </h1>
        <p className="mt-2 text-ink-soft">
          Upload a photo — our AI handles the rest.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {/* 1. media */}
        <Card>
          <CardContent className="p-5 sm:p-6">
            <Step n={1} label="Upload photo or video" />
            <div className="mt-4">
              <MediaUpload
                onSelect={(f) => {
                  setFile(f);
                  setAnalysis(null);
                }}
              />
            </div>
            {file && !file.type.startsWith("video") && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                loading={analyzing}
                onClick={handleAnalyze}
              >
                {!analyzing && <Sparkles size={16} />}
                {analysis ? "Re-analyze with AI" : "Analyze with AI"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* AI result */}
        {analyzing && (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-ink-soft">
              <Loader2 className="animate-spin text-primary" size={20} />
              The Vision Agent is inspecting your photo…
            </CardContent>
          </Card>
        )}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card glass>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">
                    <Sparkles size={12} /> AI analysis
                  </Badge>
                  <SeverityBadge severity={analysis.severity} />
                  <Badge tone="slate">{analysis.confidence}% confidence</Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-ink">
                  {analysis.title}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Mini label="Department" value={analysis.department} icon={<Building2 size={14} />} />
                  <Mini label="Risk score" value={`${analysis.risk_score}/10`} />
                  <Mini label="Est. cost" value={analysis.estimated_cost} />
                  <Mini label="Est. fix time" value={analysis.estimated_fix_time} />
                  <Mini label="Category" value={analysis.category} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2. location */}
        <Card>
          <CardContent className="p-5 sm:p-6">
            <Step n={2} label="Location" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant={geo.coords ? "outline" : "primary"}
                loading={geo.loading}
                onClick={geo.detect}
              >
                {!geo.loading && <MapPin size={16} />}
                {geo.coords ? "Re-detect location" : "Detect my location"}
              </Button>
              {geo.coords && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <CheckCircle2 size={16} />
                  <span className="tabular-nums">
                    {geo.coords.lat.toFixed(5)}, {geo.coords.lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>
            {geo.address && (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-ink-soft">
                {geo.address}
              </p>
            )}
            {geo.error && (
              <p className="mt-3 text-sm text-warning">{geo.error}</p>
            )}

            <button
              type="button"
              onClick={() => setManualOpen((o) => !o)}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              {manualOpen ? "Hide manual entry" : "Set location manually"}
            </button>

            {manualOpen && (
              <div className="mt-3 rounded-xl border border-line bg-slate-50 p-4">
                <p className="text-xs text-ink-soft">
                  Tip: open{" "}
                  <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Maps
                  </a>
                  , right-click the spot → click the coordinates to copy, then
                  paste them here.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    inputMode="decimal"
                    placeholder="Latitude (e.g. 23.0225)"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                  />
                  <Input
                    inputMode="decimal"
                    placeholder="Longitude (e.g. 72.5714)"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const lat = parseFloat(manualLat);
                      const lng = parseFloat(manualLng);
                      if (
                        Number.isFinite(lat) &&
                        Number.isFinite(lng) &&
                        Math.abs(lat) <= 90 &&
                        Math.abs(lng) <= 180
                      ) {
                        geo.setManual(lat, lng);
                      } else {
                        setError("Enter valid latitude and longitude values.");
                      }
                    }}
                  >
                    Use
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. details */}
        <Card>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <Step n={3} label="Confirm details" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Large pothole near the bus stop"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      category === c
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-white text-ink-soft hover:border-primary/40"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue…"
              />
            </div>
          </CardContent>
        </Card>

        {/* duplicate warning */}
        {duplicates.length > 0 && (
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle size={18} />
                <h3 className="font-semibold">
                  {duplicates.length} similar report
                  {duplicates.length > 1 ? "s" : ""} nearby
                </h3>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                Help avoid duplicates — you can open an existing report and verify
                it instead, or submit anyway if yours is different.
              </p>
              <div className="mt-3 space-y-2">
                {duplicates.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => router.push(`/issues/${d.id}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-left text-sm hover:border-primary/40"
                  >
                    <span className="font-medium text-ink">{d.title}</span>
                    <SeverityBadge severity={d.severity} />
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setDuplicates([])}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={submitting}
                  onClick={() => handleSubmit(true)}
                >
                  Submit anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {duplicates.length === 0 && (
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            onClick={() => handleSubmit(false)}
          >
            Submit report &amp; earn Hero Points
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
        {n}
      </span>
      <h2 className="font-semibold text-ink">{label}</h2>
    </div>
  );
}

function Mini({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value || "—"}</p>
    </div>
  );
}
