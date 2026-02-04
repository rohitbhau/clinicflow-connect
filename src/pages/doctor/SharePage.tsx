import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Copy, Check, Share2, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

export default function SharePage() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const bookingLink = `${window.location.origin}/book/dr-john-smith`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Booking link has been copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Book an Appointment",
          text: "Book your appointment with Dr. John Smith",
          url: bookingLink,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy();
    }
  };

  return (
    <DashboardLayout
      type="doctor"
      title="Share Booking Link"
      subtitle="Generate QR code and share your appointment booking link with patients"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Code Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code
            </CardTitle>
            <CardDescription>
              Patients can scan this QR code to book an appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <QRCode
                value={bookingLink}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Print this QR code and display it at your clinic
            </p>
            <Button variant="outline" className="mt-4 gap-2">
              <ExternalLink className="h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Share Link Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Booking Link
            </CardTitle>
            <CardDescription>
              Share this link directly with your patients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Link Input */}
            <div className="flex gap-2">
              <Input
                value={bookingLink}
                readOnly
                className="bg-secondary/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className={copied ? "border-success text-success" : ""}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-card-foreground">
                Share via
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex-col gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 text-primary" />
                  <span className="text-xs">Share</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col gap-2 h-auto py-4 hover:border-info hover:bg-info/5"
                  onClick={() => window.open(`mailto:?subject=Book an Appointment&body=Book your appointment here: ${bookingLink}`)}
                >
                  <Mail className="h-5 w-5 text-info" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col gap-2 h-auto py-4 hover:border-success hover:bg-success/5"
                  onClick={() => window.open(`https://wa.me/?text=Book your appointment with Dr. John Smith: ${bookingLink}`)}
                >
                  <MessageSquare className="h-5 w-5 text-success" />
                  <span className="text-xs">WhatsApp</span>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <h4 className="text-sm font-medium text-card-foreground mb-3">
                Link Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-primary">156</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">42</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
