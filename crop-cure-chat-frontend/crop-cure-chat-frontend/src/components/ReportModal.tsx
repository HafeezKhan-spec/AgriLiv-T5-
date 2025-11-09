import { useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Classification = {
  diseaseName?: string;
  confidence?: number;
  severity?: string;
  affectedArea?: number;
  recommendations?: string[];
  speciesName?: string;
  growthIndex?: number;
  soilCondition?: string;
  breed?: string;
  uploadId?: string;
  [key: string]: string | number | string[] | undefined;
};

type Message = {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  classification?: Classification;
  domain?: "plant" | "livestock" | "fish";
};

export default function ReportModal({
  isOpen,
  onClose,
  message,
  imageUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  imageUrl?: string | null;
}) {
  const classification = message?.classification;
  const domain = message?.domain;
  const captureRef = useRef<HTMLDivElement | null>(null);

  const confidenceColor = (val?: number) => {
    if (typeof val !== "number") return "text-muted-foreground";
    if (val <= 40) return "text-red-600"; // Low
    if (val <= 70) return "text-orange-500"; // Medium
    if (val <= 90) return "text-green-500"; // Good (light green)
    return "text-green-700"; // High (dark green)
  };

  const handleDownload = async () => {
    try {
      const el = captureRef.current;
      if (!el || !message) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const y = 10;
      const availableHeight = pageHeight - y - 10;
      const scaledHeight = imgHeight > availableHeight ? availableHeight : imgHeight;
      pdf.addImage(imgData, "PNG", 10, y, imgWidth, scaledHeight);
      const stamp = message.timestamp instanceof Date ? message.timestamp : new Date();
      pdf.save(`AgriClip_Report_${domain || "analysis"}_${stamp.toISOString().split("T")[0]}_${stamp.getTime()}.pdf`);
    } catch (e) {
      console.error("Error downloading modal report:", e);
    }
  };

  const barData = useMemo(() => {
    if (!classification) return [];
    const arr: { name: string; value: number }[] = [];
    if (typeof classification.confidence === "number") arr.push({ name: "Confidence", value: classification.confidence });
    if (typeof classification.affectedArea === "number") arr.push({ name: "Affected Area", value: classification.affectedArea });
    if (typeof classification.growthIndex === "number") arr.push({ name: "Growth Index", value: classification.growthIndex });
    return arr;
  }, [classification]);

  const pieData = useMemo(() => {
    // Only create pie if we have multiple numeric fields
    if (!classification) return [];
    const numerics: { name: string; value: number }[] = [];
    [
      ["Confidence", classification?.confidence],
      ["Affected Area", classification?.affectedArea],
      ["Growth Index", classification?.growthIndex],
    ].forEach(([name, val]) => {
      if (typeof val === "number") numerics.push({ name: name as string, value: val as number });
    });
    return numerics.length > 1 ? numerics : [];
  }, [classification]);

  const COLORS = ["#22c55e", "#10b981", "#84cc16", "#06b6d4", "#a78bfa"]; // Tailwind greens and accents

  // Domain-specific narratives for livestock and fish
  const livestockNarrative = useMemo(() => {
    if (!classification) return "";
    const name = classification.diseaseName || "a condition";
    const breed = classification.breed ? ` in ${classification.breed}` : "";
    const conf = typeof classification.confidence === "number" ? `${classification.confidence}%` : undefined;
    const parts: string[] = [];
    parts.push(`This livestock analysis suggests signs of ${name}${breed}.`);
    if (conf) parts.push(`Confidence: ${conf}.`);
    parts.push(
      "Recommended first steps: isolate affected animals, monitor temperature, appetite, and hydration, maintain clean housing and good ventilation, and consult a veterinarian for a definitive diagnosis and treatment."
    );
    parts.push(
      "Supportive care may include balanced feed, clean water, and reducing stress. If respiratory signs are present, reduce dust exposure and check for drafts."
    );
    return parts.join(" ");
  }, [classification]);

  const fishNarrative = useMemo(() => {
    if (!classification) return "";
    const name = classification.diseaseName || "a condition";
    const conf = typeof classification.confidence === "number" ? `${classification.confidence}%` : undefined;
    const parts: string[] = [];
    parts.push(`This fish analysis indicates possible ${name}.`);
    if (conf) parts.push(`Confidence: ${conf}.`);
    parts.push(
      "Check water quality (ammonia, nitrite, nitrate), temperature, and oxygenation. Perform a partial water change, ensure proper filtration, and quarantine affected fish if possible."
    );
    parts.push(
      "Consider appropriate treatments (e.g., salt baths where suitable) and seek aquatic veterinary guidance for a precise diagnosis and protocol."
    );
    return parts.join(" ");
  }, [classification]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] p-0 overflow-hidden bg-background flex flex-col">
        <div ref={captureRef} className="w-full max-w-[860px] mx-auto">
          <DialogHeader className="px-6 pt-6 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">
              {domain === "plant" && (classification?.speciesName || classification?.diseaseName) ? (
                <>Plant Report: {classification?.speciesName || classification?.diseaseName}</>
              ) : domain === "livestock" ? (
                <>Livestock Report: {classification?.diseaseName || "Unknown"}</>
              ) : domain === "fish" ? (
                <>Fish Report: {classification?.diseaseName || "Unknown"}</>
              ) : (
                <>Analysis Report</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border bg-card shadow-sm p-4"
          >
            {imageUrl ? (
              <img src={imageUrl} crossOrigin="anonymous" alt="Uploaded" className="w-full h-64 object-cover rounded-md" />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No image available</div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              {domain === "plant" && (
                <>
                  {classification?.speciesName && <p>Species: {classification.speciesName}</p>}
                  {classification?.diseaseName && <p>Disease: {classification.diseaseName}</p>}
                  {typeof classification?.confidence === "number" && (
                    <p>
                      Confidence: <span className={confidenceColor(classification.confidence)}>{classification.confidence}%</span>
                    </p>
                  )}
                  {classification?.severity && <p>Severity: {classification.severity}</p>}
                  {typeof classification?.affectedArea === "number" && <p>Affected Area: {classification.affectedArea}%</p>}
                  {typeof classification?.growthIndex === "number" && <p>Growth Index: {classification.growthIndex}</p>}
                  {classification?.soilCondition && <p>Soil Condition: {classification.soilCondition}</p>}
                  {classification?.recommendations?.length ? (
                    <div>
                      <p className="font-medium">Recommendations:</p>
                      <ul className="list-disc pl-6">
                        {classification.recommendations.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}

              {domain === "livestock" && (
                <>
                  {classification?.diseaseName && <p>Name: {classification.diseaseName}</p>}
                  {classification?.breed && <p>Breed: {classification.breed}</p>}
                  {typeof classification?.confidence === "number" && (
                    <p>
                      Confidence: <span className={confidenceColor(classification.confidence)}>{classification.confidence}%</span>
                    </p>
                  )}
                  {livestockNarrative && (
                    <div className="mt-3">
                      <p className="font-medium">Summary</p>
                      <p className="text-sm text-muted-foreground">{livestockNarrative}</p>
                    </div>
                  )}
                </>
              )}

              {domain === "fish" && (
                <>
                  {classification?.diseaseName && <p>Fish Name: {classification.diseaseName}</p>}
                  {typeof classification?.confidence === "number" && (
                    <p>
                      Confidence: <span className={confidenceColor(classification.confidence)}>{classification.confidence}%</span>
                    </p>
                  )}
                  {fishNarrative && (
                    <div className="mt-3">
                      <p className="font-medium">Summary</p>
                      <p className="text-sm text-muted-foreground">{fishNarrative}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="rounded-lg border bg-card shadow-sm p-4"
          >
            <div className="h-56">
              {barData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No numeric metrics</div>
              )}
            </div>
            <div className="h-64 mt-4">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Awaiting more metrics</div>
              )}
            </div>
          </motion.div>
        </div>
        </div>
        
        {/* Download Button - Fixed at bottom right */}
        <Button 
          onClick={handleDownload} 
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white shadow-lg z-50" 
          data-html2canvas-ignore="true"
          size="lg"
        >
          Download PDF
        </Button>
      </DialogContent>
    </Dialog>
  );
}