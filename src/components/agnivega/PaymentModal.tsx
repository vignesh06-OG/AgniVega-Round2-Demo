import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, Smartphone, ShieldCheck, CreditCard, Loader2 } from "lucide-react";
import { rupees } from "@/lib/krishi/constants";

interface PaymentModalProps {
  platformFee: number;
  expectedNetRealization: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: (method: string) => Promise<void>;
  lang: "en" | "mr";
}

export function PaymentModal({ platformFee, expectedNetRealization, isOpen, onOpenChange, onConfirmPayment, lang }: PaymentModalProps) {
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await onConfirmPayment(method);
      onOpenChange(false);
    } catch (err) {
      // handled by parent
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{lang === "en" ? "Complete Logistics Payment" : "लॉजिस्टिक पेमेंट पूर्ण करा"}</DialogTitle>
          <DialogDescription>
            {lang === "en" 
              ? "AgniVega only processes the logistics and platform fee. Your crop sale value will be settled directly at the market."
              : "अग्नीवेगा फक्त लॉजिस्टिक आणि प्लॅटफॉर्म फीवर प्रक्रिया करते. तुमच्या पिकाच्या विक्रीचे पैसे थेट बाजारपेठेत मिळतील."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-primary">{lang === "en" ? "Transport Booking Fee" : "वाहतूक बुकिंग फी"}</span>
              <span className="font-bold text-primary">{rupees(platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground border-t pt-3">
              <span>{lang === "en" ? "Expected Net Amount (At Market)" : "अपेक्षित निव्वळ रक्कम (बाजारपेठेत)"}</span>
              <span>{rupees(expectedNetRealization)}</span>
            </div>
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
              {lang === "en" ? `The crop sale value (${rupees(expectedNetRealization + platformFee)}) will be paid to you at the mandi directly by the buyer. You only pay the transport fee here.` : `पिकाच्या विक्रीची रक्कम (${rupees(expectedNetRealization + platformFee)}) तुम्हाला बाजारपेठेत खरेदीदाराकडून थेट दिली जाईल. तुम्ही येथे फक्त वाहतूक फी भरायची आहे.`}
            </div>
          </div>

          <RadioGroup value={method} onValueChange={setMethod} className="space-y-3">
            <Label
              htmlFor="upi"
              className={`flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                method === "upi" ? "border-primary bg-primary/5" : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="upi" id="upi" />
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <span>UPI (GPay, PhonePe, Paytm)</span>
                </div>
              </div>
            </Label>
            
            <Label
              htmlFor="wallet"
              className={`flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                method === "wallet" ? "border-primary bg-primary/5" : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="wallet" id="wallet" />
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <span>{lang === "en" ? "AgniVega Wallet" : "अग्नीवेगा वॉलेट"}</span>
                </div>
              </div>
            </Label>

            <Label
              htmlFor="fpo"
              className={`flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                method === "fpo" ? "border-primary bg-primary/5" : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="fpo" id="fpo" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span>{lang === "en" ? "Sponsored by FPO / Buyer" : "FPO / खरेदीदाराद्वारे प्रायोजित"}</span>
                </div>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            {lang === "en" ? "Cancel" : "रद्द करा"}
          </Button>
          <Button onClick={handleConfirm} disabled={processing} className="w-full sm:w-auto">
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lang === "en" ? `Pay ${rupees(platformFee)}` : `पेमेंट ${rupees(platformFee)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
