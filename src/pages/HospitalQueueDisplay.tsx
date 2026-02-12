import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Stethoscope, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function HospitalQueueDisplay() {
    const { hospitalId } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await api.get(`/appointments/queue/hospital/${hospitalId}`);
            if (res.data.success) {
                setData(res.data.data);
                setError("");
            } else {
                setError("Failed to load queue data");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    // Poll Data
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000); // Poll every 5 minutes
        return () => clearInterval(interval);
    }, [hospitalId]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-xl font-medium">Loading Display...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-destructive">
                <AlertCircle className="h-16 w-16" />
                <h1 className="text-2xl font-bold">{error || "Hospital Not Found"}</h1>
                <p className="text-muted-foreground">Please check the URL or try again later.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    const { hospitalName, queues } = data;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-4 font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm border border-slate-800 md:flex-row">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                        <Clock className="h-8 w-8 animate-pulse-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            {hospitalName}
                        </h1>
                        <p className="text-lg text-slate-400 font-medium">Live Queue Status</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-4xl font-bold font-mono text-primary tabular-nums">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="hidden h-12 w-12 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white md:flex"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                    </Button>
                </div>
            </header>

            {/* Grid */}
            {queues.length === 0 ? (
                <div className="flex h-[60vh] flex-col items-center justify-center text-slate-400">
                    <div className="rounded-full bg-slate-900 p-8 shadow-inner">
                        <Clock className="h-24 w-24 opacity-20" />
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold text-slate-300">No Active Queues</h2>
                    <p className="max-w-md text-center text-slate-500 mt-2">
                        There are no active appointments scheduled for today at this moment.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {queues.map((queue: any) => (
                        <Card key={queue.doctor.id} className="overflow-hidden border-slate-800 bg-slate-900 shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl hover:border-slate-700 group">
                            <CardHeader className="bg-slate-800/80 border-b border-slate-700/50 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                            {queue.doctor.name}
                                        </CardTitle>
                                        <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-wide flex items-center gap-1.5">
                                            <Stethoscope className="w-3.5 h-3.5 text-primary" />
                                            {queue.doctor.specialization}
                                        </p>
                                    </div>
                                    {queue.queueCount > 0 && (
                                        <Badge className="bg-primary text-primary-foreground font-bold text-sm px-2.5 py-0.5 shadow-glow">
                                            {queue.queueCount} Waiting
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {/* Current Token */}
                                <div className="text-center rounded-2xl bg-slate-950/50 p-6 border border-slate-800/50 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Now Serving</p>
                                    {queue.current ? (
                                        <div className="animate-in zoom-in-50 duration-500">
                                            <div className="text-5xl font-black text-white font-mono tracking-tight shadow-text-glow">
                                                {queue.current.tokenNumber.split('-').pop()}
                                            </div>
                                            <p className="mt-2 text-lg font-medium text-emerald-400 truncate px-2">
                                                {queue.current.patientName}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-2xl font-semibold text-slate-600 py-4 italic">Waiting...</p>
                                    )}
                                </div>

                                {/* Up Next List */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Up Next</p>
                                    <div className="space-y-2 max-h-[160px] overflow-hidden relative">
                                        {queue.queue.length > 0 ? (
                                            queue.queue.slice(0, 3).map((item: any, i: number) => (
                                                <div key={item._id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3 border border-slate-700/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                                                            {i + 1}
                                                        </div>
                                                        <span className="font-medium text-slate-200 truncate max-w-[120px]">
                                                            {item.patientName}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-primary">
                                                        #{item.tokenNumber.split('-').pop()}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-slate-500 italic text-sm bg-slate-800/20 rounded-lg border border-slate-800/30 border-dashed">
                                                No patients in waiting list
                                            </div>
                                        )}
                                        {queue.queue.length > 3 && (
                                            <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none flex items-end justify-center">
                                                <span className="text-xs text-slate-400 bg-slate-900 px-2 rounded-full absolute -bottom-2 border border-slate-800">
                                                    +{queue.queue.length - 3} more
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
