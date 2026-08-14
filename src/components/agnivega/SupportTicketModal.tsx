import { useState } from "react";
import { HeadphonesIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SupportTicketModalProps {
  bookingId?: string;
  lang: "en" | "mr";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DICT = {
  en: {
    btn: "Contact AgniVega Support",
    title: "Create Support Ticket",
    desc: "For your privacy and security, all driver communication is handled by our platform.",
    issueLabel: "Issue Category",
    detailsLabel: "Description",
    placeholder: "Explain the issue here...",
    submit: "Submit Ticket",
    success: "Ticket submitted successfully. Support will contact you shortly.",
    issues: {
      vehicle_delay: "Vehicle not arrived",
      qty_issue: "Quantity / load issue",
      route_issue: "Route issue",
      payment: "Payment issue",
      other: "Other"
    }
  },
  mr: {
    btn: "AgniVega सपोर्टशी संपर्क साधा",
    title: "सपोर्ट तिकीट तयार करा",
    desc: "तुमच्या गोपनीयतेसाठी आणि सुरक्षिततेसाठी, ड्रायव्हरशी सर्व संवाद आमच्या प्लॅटफॉर्मद्वारे हाताळला जातो.",
    issueLabel: "समस्येचा प्रकार",
    detailsLabel: "तपशील",
    placeholder: "येथे समस्या स्पष्ट करा...",
    submit: "तिकीट पाठवा",
    success: "तिकीट यशस्वीरित्या पाठवले. सपोर्ट लवकरच तुमच्याशी संपर्क साधेल.",
    issues: {
      vehicle_delay: "वाहन आले नाही",
      qty_issue: "प्रमाण / लोड समस्या",
      route_issue: "रस्त्याची समस्या",
      payment: "पेमेंट समस्या",
      other: "इतर"
    }
  }
}

export function SupportTicketModal({ bookingId, lang, isOpen: externalOpen, onOpenChange: externalSetOpen }: SupportTicketModalProps) {
  const t = DICT[lang] || DICT.en;
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    externalSetOpen ? externalSetOpen(v) : setInternalOpen(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !desc) return;
    
    // Simulate API call
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setCategory("");
      setDesc("");
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100">
          <HeadphonesIcon className="mr-2 h-4 w-4" />
          {t.btn}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription className="flex items-start gap-2 mt-2 text-blue-800 bg-blue-50 p-2 rounded text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                {t.desc}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t.issueLabel}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.issues).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.detailsLabel}</Label>
                <Textarea 
                  placeholder={t.placeholder}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!category || !desc}>
                {t.submit}
              </Button>
            </form>
          </>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-green-800 font-medium">{t.success}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
