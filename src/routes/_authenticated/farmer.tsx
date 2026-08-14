import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createBookingHold, getBooking, confirmPayment, getVehicleCapacity, cancelBooking } from "@/lib/krishi/booking.server";
import { PaymentModal } from "@/components/agnivega/PaymentModal";

import { BrandHeader } from "@/components/agnivega/BrandHeader";
import { CropSelector } from "@/components/agnivega/CropSelector";
import { ExplainabilityCard } from "@/components/agnivega/ExplainabilityCard";
import { DataLabel } from "@/components/agnivega/DataLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Scale,
  MapPin,
  Truck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  ShieldCheck,
  Leaf,
  Globe,
  Lock,
  Edit2,
  AlertTriangle
} from "lucide-react";

import { getReferenceData, calculateOptions } from "@/lib/krishi/krishi.functions";
import { DEMO_FARMER } from "@/lib/krishi/canonical-demo";
import { rupees } from "@/lib/krishi/constants";
import type { CalculationResult, MandiOption } from "@/lib/krishi/types";

// New Components
import { QualityForm, type QualityData } from "@/components/agnivega/QualityForm";
import { AIUploadMock, type AIResult } from "@/components/agnivega/AIUploadMock";
import { SupportTicketModal } from "@/components/agnivega/SupportTicketModal";

export const Route = createFileRoute("/_authenticated/farmer")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "farmer" && context.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Farmer Dispatch — Smart Krishi-Yatra AI" },
      {
        name: "description",
        content: "Select your crop and quantity to get an AI-powered dispatch recommendation.",
      },
    ],
  }),
  component: FarmerFlow,
});

const SPOILAGE_STYLES: Record<string, { bg: string; text: string }> = {
  safe: { bg: "bg-green-100 text-green-800", text: "text-green-700" },
  watch: { bg: "bg-yellow-100 text-yellow-800", text: "text-yellow-700" },
  critical: { bg: "bg-red-100 text-red-800", text: "text-red-700" },
};

type FlowState = "DRAFT" | "ANALYZING" | "OPTIONS_READY" | "CONFIRMED_EDITABLE" | "LOCKED";

const DICT = {
  en: {
    langToggle: "मराठी",
    step1: "Load & Quality",
    step2: "AI Decision",
    step3: "Dispatch",
    consent: "I confirm the declared quality is accurate. Significant physical deviation may lead to rejection/deduction.",
    analyzeBtn: "Analyze Markets & Vehicles",
    backBtn: "Back",
    confirmBtn: "Confirm Dispatch",
    lockedMsg: "Your booking is locked because the vehicle allocation is finalized.",
    editBtn: "Edit Booking",
    countdown: "Time to edit:",
    rebookBtn: "Request Rebooking",
  },
  mr: {
    langToggle: "English",
    step1: "लोड आणि गुणवत्ता",
    step2: "AI निर्णय",
    step3: "डिस्पॅच",
    consent: "मी खात्री देतो की घोषित गुणवत्ता अचूक आहे. मालात तफावत आढळल्यास कपात होऊ शकते.",
    analyzeBtn: "बाजार आणि वाहनांचे विश्लेषण करा",
    backBtn: "मागे",
    confirmBtn: "डिस्पॅच निश्चित करा",
    lockedMsg: "तुमचे बुकिंग लॉक झाले आहे कारण वाहन वाटप अंतिम झाले आहे.",
    editBtn: "बुकिंग बदला",
    countdown: "बदलण्यासाठी वेळ:",
    rebookBtn: "पुन्हा बुकिंगची विनंती करा",
  }
};

function FarmerFlow() {
  const refFn = useServerFn(getReferenceData);
  const calcFn = useServerFn(calculateOptions);

  const reference = useQuery({
    queryKey: ["krishi-reference"],
    queryFn: () => refFn({}),
  });

  const [lang, setLang] = useState<"en" | "mr">("en");
  const t = DICT[lang];

  const [flowState, setFlowState] = useState<FlowState>("DRAFT");
  const [countdown, setCountdown] = useState<number>(0);
  const [bookingRecord, setBookingRecord] = useState<any>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [vehicleCap, setVehicleCap] = useState<{total: number, booked: number} | null>(null);
  const createHoldFn = useServerFn(createBookingHold);
  const confirmPaymentFn = useServerFn(confirmPayment);
  const cancelBookingFn = useServerFn(cancelBooking);
  const getCapacityFn = useServerFn(getVehicleCapacity);

  // Form State
  const [selectedCropId, setSelectedCropId] = useState("crop-1");
  const [quantity, setQuantity] = useState("10");
  const [inputError, setInputError] = useState<string | null>(null);
  
  const [quality, setQuality] = useState<QualityData>({ moisture: "medium", grade: "good", damage: "low" });
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Results State
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedMandiId, setSelectedMandiId] = useState<string | null>(null);

  // Countdown effect
  useEffect(() => {
    if (flowState === "CONFIRMED_EDITABLE" && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (flowState === "CONFIRMED_EDITABLE" && countdown === 0) {
      setFlowState("LOCKED");
    }
    return undefined;
  }, [flowState, countdown]);

  const handleCalculate = async () => {
    const q = Number(quantity);
    if (isNaN(q) || q <= 0) {
      setInputError(lang === "en" ? "Quantity must be greater than 0" : "प्रमाण 0 पेक्षा जास्त असणे आवश्यक आहे");
      return;
    }
    if (q > 200) {
      setInputError(lang === "en" ? "Max 200 quintals" : "कमाल २०० क्विंटल");
      return;
    }
    setInputError(null);
    setFlowState("ANALYZING");
    try {
      const res = await refFn();
      if (!res.crops.find((c: any) => c.id === selectedCropId)) throw new Error("Invalid crop");
      const data = await calcFn({
        data: {
          cropId: selectedCropId,
          weightKg: Number(quantity) * 100,
          villageName: DEMO_FARMER.village,
          lat: DEMO_FARMER.lat,
          lng: DEMO_FARMER.lng,
          demoMode: true,
          emergency: false,
          delayMinutes: 0,
        },
      });
      setResult(data);
      setSelectedMandiId(data.best.mandiId);
      setFlowState("OPTIONS_READY");
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
      setFlowState("DRAFT");
    }
  };

  const crops = (reference.data?.crops ?? []) as any[];
  const selectedCrop = crops.find((c: any) => c.id === selectedCropId);

  // The active selection might override AI
  const activeOption = result?.options.find(o => o.mandiId === selectedMandiId) || result?.best;
  const isOverride = activeOption?.mandiId !== result?.best.mandiId;

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader active="Farmer" />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-24">
        {/* Top Bar: Lang toggle */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "mr" : "en")}>
            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
            {t.langToggle}
          </Button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center justify-between mb-8">
          {[
            { stateReq: ["DRAFT", "ANALYZING"], label: t.step1 },
            { stateReq: ["OPTIONS_READY"], label: t.step2 },
            { stateReq: ["CONFIRMED_EDITABLE", "LOCKED"], label: t.step3 },
          ].map((s, i) => {
            const isActive = s.stateReq.includes(flowState);
            const isPast = ["OPTIONS_READY", "CONFIRMED_EDITABLE", "LOCKED"].includes(flowState) && i < 2;
            const highlighted = isActive || isPast;
            return (
              <div key={i} className="contents">
                {i > 0 && <div className={`h-1 flex-1 mx-4 ${highlighted ? "bg-primary" : "bg-muted"}`} />}
                <div className={`flex items-center gap-2 ${highlighted ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${highlighted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {i + 1}
                  </div>
                  <span className="font-semibold hidden sm:inline">{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ══════════ STEP 1: DRAFT ══════════ */}
        {flowState === "DRAFT" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-accent shadow-md">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{lang === "en" ? "New Dispatch" : "नवीन डिस्पॅच"}</CardTitle>
                    <CardDescription>
                      {lang === "en" 
                        ? "Provide crop details and upload a photo for AI quality estimation." 
                        : "पिकाचा तपशील द्या आणि AI गुणवत्ता अंदाजासाठी फोटो अपलोड करा."}
                    </CardDescription>
                  </div>
                  <DataLabel status="SIMULATED" />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Crop & Quantity Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">{lang === "en" ? "Select Crop" : "पीक निवडा"}</Label>
                    {crops.length > 0 ? (
                      <CropSelector crops={crops} selectedId={selectedCropId} onChange={setSelectedCropId} lang={lang} />
                    ) : (
                      <div className="h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">{lang === "en" ? "Quantity (Quintals)" : "प्रमाण (क्विंटल)"}</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="number" min={1} max={200}
                        value={quantity}
                        onChange={(e) => { setQuantity(e.target.value); setInputError(null); }}
                        className="pl-10 text-lg py-6"
                      />
                    </div>
                    <div className="flex justify-between items-start text-xs">
                      <span className="text-muted-foreground">= {(Number(quantity) * 100 || 0).toLocaleString("en-IN")} kg</span>
                      {inputError && <span className="text-destructive font-medium">{inputError}</span>}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 grid md:grid-cols-2 gap-8">
                  {/* Quality Form */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{lang === "en" ? "Declare Quality" : "गुणवत्ता घोषित करा"}</h3>
                    <QualityForm value={quality} onChange={setQuality} lang={lang} />
                  </div>
                  
                  {/* AI Upload */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{lang === "en" ? "AI Image Analysis" : "AI फोटो विश्लेषण"}</h3>
                    <AIUploadMock onComplete={setAiResult} lang={lang} />
                  </div>
                </div>

                {/* Consent & Submit */}
                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-start space-x-3 bg-muted/50 p-4 rounded-lg">
                    <Checkbox id="consent" checked={consentGiven} onCheckedChange={(c) => setConsentGiven(!!c)} />
                    <Label htmlFor="consent" className="text-sm leading-snug cursor-pointer">
                      {t.consent}
                    </Label>
                  </div>

                  <Button
                    size="lg" className="w-full text-lg h-14"
                    onClick={handleCalculate}
                    disabled={!selectedCropId || !quantity || !consentGiven}
                  >
                    {t.analyzeBtn} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════ ANALYZING ══════════ */}
        {flowState === "ANALYZING" && (
          <div className="py-24 text-center space-y-6 animate-in fade-in">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
              {lang === "en" ? "AI Engine Optimizing..." : "AI इंजिन ऑप्टिमाइझ करत आहे..."}
              <Badge variant="outline" className="bg-blue-50 text-blue-700">AI Estimate</Badge>
            </h2>
            <p className="text-muted-foreground">
              {lang === "en" 
                ? "Calculating distances, transport costs, and spoilage risks across multiple markets."
                : "अनेक बाजारपेठांमध्ये अंतर, वाहतूक खर्च आणि नुकसानीची जोखीम मोजत आहे."}
            </p>
          </div>
        )}

        {/* ══════════ STEP 2: OPTIONS READY ══════════ */}
        {flowState === "OPTIONS_READY" && result && activeOption && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Override Banner */}
            {isOverride && (
              <div className="flex items-center gap-3 bg-yellow-50 text-yellow-900 p-4 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-medium">
                    {lang === "en" 
                      ? `You selected ${activeOption.mandiName} instead of the AI recommendation.`
                      : `तुम्ही AI च्या शिफारसीऐवजी ${activeOption.mandiName} निवडले आहे.`}
                  </p>
                  <p className="text-sm mt-1">
                    {lang === "en"
                      ? "Vehicle capacity and logistics have been recalculated for this destination."
                      : "या ठिकाणासाठी वाहन क्षमता आणि लॉजिस्टिक पुन्हा मोजले गेले आहे."}
                  </p>
                </div>
              </div>
            )}

            {/* ── Multi-market comparison ── */}
            <h2 className="text-xl font-bold flex items-center gap-3">
              {lang === "en" ? "Market Comparison" : "बाजारपेठ तुलना"}
              <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">DEMO DATA</Badge>
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {result.options.map((option) => {
                const isBest = option.mandiId === result.best.mandiId;
                const isSelected = option.mandiId === selectedMandiId;
                const spoilStyle = option.spoilage.level ? SPOILAGE_STYLES[option.spoilage.level] ?? SPOILAGE_STYLES["safe"] : SPOILAGE_STYLES["safe"];
                
                return (
                  <Card
                    key={option.mandiId}
                    onClick={() => setSelectedMandiId(option.mandiId)}
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      isSelected ? "border-primary shadow-lg ring-2 ring-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {isBest && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg z-10 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {lang === "en" ? "Best ENR" : "सर्वोत्तम ENR"}
                      </div>
                    )}
                    <CardHeader className={`${isSelected ? "bg-primary/5" : "bg-muted/30"} pb-3 border-b`}>
                      <CardTitle className="text-base flex items-center justify-between">
                        {option.mandiName}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
                        <span>{option.distanceKm} km</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {option.arrivalWindow}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross (₹{option.pricePerKg}/kg)</span>
                        <span className="font-medium tabular-nums">{rupees(option.grossPayout)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>− Freight</span>
                        <span className="tabular-nums">− {rupees(option.pooled.freightShare)}</span>
                      </div>
                      {option.pooled.spoilageLoss > 0 && (
                        <div className="flex justify-between text-amber-600">
                          <span>− Spoilage risk</span>
                          <span className="tabular-nums">− {rupees(option.pooled.spoilageLoss)}</span>
                        </div>
                      )}
                      <div className={`pt-3 mt-2 border-t flex justify-between font-bold ${isSelected ? "text-xl text-primary" : "text-lg"}`}>
                        <span>ENR</span>
                        <span className="tabular-nums">{rupees(option.pooled.netPayout)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ── Explainability (only show if looking at AI best, or highlight tradeoff) ── */}
            <ExplainabilityCard winner={result.best} allOptions={result.options} weightKg={result.weightKg} />

            {/* ── Vehicle pooling detailed view ── */}
            <h2 className="text-xl font-bold">{lang === "en" ? "Vehicle Allocation & Pooling" : "वाहन वाटप आणि पूलिंग"}</h2>
            <Card className="border-accent shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-primary/10 p-4 rounded-xl shrink-0">
                    <Truck className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <h3 className="text-xl font-bold">{activeOption.pooled.vehicle}</h3>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                          {lang === "en" ? `Pooled with ${activeOption.pooled.poolPartners} nearby farmers` : `${activeOption.pooled.poolPartners} शेतकऱ्यांसोबत पूलिंग`}
                        </p>
                      </div>
                    </div>

                    {/* Explicit Capacity breakdown requested by user */}
                    <div className="bg-muted p-4 rounded-lg space-y-3 border">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Vehicle Capacity</p>
                          <p className="font-semibold text-base">{vehicleCap ? vehicleCap.total.toLocaleString() : "..."} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Current Pool Load</p>
                          <p className="font-semibold text-base">{vehicleCap ? vehicleCap.booked.toLocaleString() : result.nearbyPool.totalWeightKg.toLocaleString()} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Your Request</p>
                          <p className="font-semibold text-primary text-base">{result.weightKg.toLocaleString()} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Final Utilisation</p>
                          <p className={`font-semibold text-base ${activeOption.pooled.utilisationPercent > 100 ? 'text-red-600' : 'text-green-600'}`}>
                            {activeOption.pooled.utilisationPercent}%
                          </p>
                        </div>
                      </div>
                      
                      {activeOption.pooled.utilisationPercent > 100 && (
                        <div className="bg-red-50 text-red-800 p-3 rounded text-sm font-medium border border-red-200">
                          {lang === "en" ? "Warning: Full load exceeds vehicle capacity. System will split load or dispatch next available vehicle." : "चेतावणी: पूर्ण लोड वाहन क्षमतेपेक्षा जास्त आहे. सिस्टम लोड विभाजित करेल."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 pt-6">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setFlowState("DRAFT")}>
                {t.backBtn}
              </Button>
              <Button size="lg" className="flex-1" onClick={async () => {
                try {
                  toast.loading(lang === "en" ? "Reserving vehicle..." : "वाहन राखून ठेवत आहे...", { id: 'hold' });
                  const hold = await createHoldFn({
                    data: {
                      farmerId: "FARMER-123",
                      crop: cropName,
                      quantityKg: Number(weight),
                      quality: { moisture, visualGrade },
                      destination: activeOption.mandiName,
                      vehicleId: activeOption.pooled.vehicle,
                      platformFee: Math.round(activeOption.pooled.freightShare * 0.05), // 5% fee for demo
                      expectedNetRealization: activeOption.pooled.netPayout,
                    }
                  });
                  setBookingRecord(hold);
                  const remaining = Math.max(0, Math.floor((hold.expiresAt - Date.now()) / 1000));
                  setCountdown(remaining);
                  setFlowState("CONFIRMED_EDITABLE");
                  toast.success(lang === "en" ? "Vehicle reserved!" : "वाहन राखीव!", { id: 'hold' });
                } catch (e) {
                  toast.error("Failed to hold booking", { id: 'hold' });
                }
              }}>
                {lang === "en" ? "Hold Booking" : "बुकिंग होल्ड"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: CONFIRMATION / LOCKED ══════════ */}
        {(flowState === "CONFIRMED_EDITABLE" || flowState === "LOCKED") && result && activeOption && (
          <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 fade-in duration-500 py-6">
            
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-900">
                {lang === "en" ? "Dispatch Booked" : "डिस्पॅच बुक केले"}
              </h1>
            </div>

            {/* 30 minute edit window */}
            {flowState === "CONFIRMED_EDITABLE" ? (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{t.countdown}</p>
                  <p className="text-2xl font-mono text-blue-700 font-bold">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={async () => {
                    if (bookingRecord) {
                      try { await cancelBookingFn({ data: { bookingId: bookingRecord.bookingId } }); } catch(e) {}
                    }
                    setFlowState("OPTIONS_READY");
                  }}>
                    <Edit2 className="mr-2 h-4 w-4" /> {t.editBtn}
                  </Button>
                  <Button onClick={() => setPaymentOpen(true)}>
                    {lang === "en" ? "Pay & Confirm" : "पेमेंट आणि पुष्टी करा"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border p-4 rounded-lg flex items-center gap-3 text-gray-700">
                <Lock className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{t.lockedMsg}</p>
              </div>
            )}

            <Card className="shadow-md">
              <CardContent className="p-0">
                <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Tracking ID</span>
                  <span className="font-mono font-bold text-lg">{bookingRecord?.bookingId ? bookingRecord.bookingId.split('-')[1] : 'PENDING'}</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-semibold text-right">{activeOption.mandiName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Vehicle Assigned</span>
                    <span className="font-semibold text-right">{activeOption.pooled.vehicle}</span>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Est. Arrival Window</span>
                    <span className="font-semibold text-right flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {activeOption.arrivalWindow}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Net Realization</span>
                    <span className="font-bold text-green-700 text-right text-xl">
                      {rupees(activeOption.pooled.netPayout)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-2">
              <SupportTicketModal bookingId={`KY-${activeOption.mandiCode}`} lang={lang} />
            </div>

            {flowState === "LOCKED" && (
              <Button variant="link" className="w-full text-muted-foreground" onClick={() => setFlowState("DRAFT")}>
                {t.rebookBtn}
              </Button>
            )}
          </div>
        )}
      <PaymentModal 
        isOpen={paymentOpen}
        onOpenChange={setPaymentOpen}
        lang={lang}
        platformFee={bookingRecord?.platformFee || 0}
        expectedNetRealization={bookingRecord?.expectedNetRealization || 0}
        onConfirmPayment={async (method) => {
          if (!bookingRecord) return;
          try {
            const confirmed = await confirmPaymentFn({ data: { bookingId: bookingRecord.bookingId, paymentMethod: method }});
            setBookingRecord(confirmed);
            setFlowState("LOCKED");
            toast.success(lang === "en" ? "Booking Confirmed!" : "बुकिंग निश्चित झाली!");
          } catch (e: any) {
            toast.error(e.message || "Payment Failed");
          }
        }}
      />
      </main>
    </div>
  );
}
