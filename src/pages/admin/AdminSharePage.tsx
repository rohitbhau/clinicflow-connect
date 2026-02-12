import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Copy, Check, Share2, Mail, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import api from "@/lib/api";

const createSlug = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
};

export default function AdminSharePage() {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const [hospitalName, setHospitalName] = useState("");

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.hospitalName) {
                        setHospitalName(user.hospitalName);
                    } else {
                        // Try to fetch hospital info
                        const response = await api.get('/hospitals/stats');
                        if (response.data?.data?.hospital?.name) {
                            setHospitalName(response.data.data.hospital.name);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch hospital info", error);
            }
        };
        fetchInfo();
    }, []);

    const hospitalSlug = createSlug(hospitalName || "hospital");
    const bookingLink = `${window.location.origin}/book/${hospitalSlug}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(bookingLink);
        setCopied(true);
        toast({ title: "Link copied!", description: "Booking link copied to clipboard" });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Book an Appointment",
                    text: `Book an appointment at ${hospitalName}`,
                    url: bookingLink
                });
            } catch {
                // User cancelled
            }
        } else {
            handleCopy();
        }
    };

    return (
        <DashboardLayout type="admin" title="QR & Link" subtitle="Share booking link with patients">
            <div className="space-y-4 max-w-2xl mx-auto">
                {/* QR Code */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <QrCode className="h-5 w-5 text-primary" />
                            Hospital QR Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="rounded-2xl bg-card p-5 shadow-lg border border-border">
                            <QRCode
                                value={bookingLink}
                                size={180}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox="0 0 256 256"
                            />
                        </div>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Display this at your hospital reception for patients to scan
                        </p>
                        <Button
                            variant="outline"
                            className="mt-3 gap-2 h-10 text-sm"
                            onClick={() => {
                                const svg = document.querySelector('svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL('image/png');
                                        const downloadLink = document.createElement('a');
                                        downloadLink.download = `${hospitalSlug}-qr.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                }
                            }}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Download QR
                        </Button>
                    </CardContent>
                </Card>

                {/* Link */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Share2 className="h-5 w-5 text-primary" />
                            Booking Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input value={bookingLink} readOnly className="h-11 bg-secondary/50 text-sm" />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                className={`h-11 w-11 flex-shrink-0 ${copied ? "border-success text-success" : ""}`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                className="flex-col gap-1.5 h-auto py-3 touch-target"
                                onClick={handleShare}
                            >
                                <Share2 className="h-5 w-5 text-primary" />
                                <span className="text-[10px]">Share</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-col gap-1.5 h-auto py-3 touch-target"
                                onClick={() => window.open(`mailto:?subject=Book an Appointment&body=Book here: ${bookingLink}`)}
                            >
                                <Mail className="h-5 w-5 text-info" />
                                <span className="text-[10px]">Email</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-col gap-1.5 h-auto py-3 touch-target"
                                onClick={() => window.open(`https://wa.me/?text=Book your appointment: ${bookingLink}`)}
                            >
                                <MessageSquare className="h-5 w-5 text-success" />
                                <span className="text-[10px]">WhatsApp</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
