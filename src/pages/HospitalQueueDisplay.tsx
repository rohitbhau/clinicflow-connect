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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(`/appointments/queue/hospital/${hospitalId}`);
      if (res.data.success) { setData(res.data.data); setError(""); }
      else setError("Failed to load queue data");
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" />
        <span className="ml-3 text-base font-medium sm:text-xl sm:ml-4">Loading Display...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-destructive p-4 sm:gap-4">
        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16" />
        <h1 className="text-xl font-bold text-center sm:text-2xl">{error || "Hospital Not Found"}</h1>
        <p className="text-sm text-muted-foreground text-center">Please check the URL or try again later.</p>
        <Button onClick={() => window.location.reload()} className="h-11">Retry</Button>
      </div>
    );
  }

  const { hospitalName, queues } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-3 font-sans selection:bg-primary/30 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-4 flex flex-col items-center gap-3 rounded-xl bg-slate-900/50 p-4 shadow-lg backdrop-blur-sm border border-slate-800 sm:mb-6 sm:gap-4 sm:p-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow sm:h-16 sm:w-16">
            <Clock className="h-6 w-6 animate-pulse-slow sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white truncate sm:text-2xl md:text-3xl lg:text-4xl">
              {hospitalName}
            </h1>
            <p className="text-sm text-slate-400 font-medium sm:text-base lg:text-lg">Live Queue Status</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center md:text-right">
            <p className="text-2xl font-bold font-mono text-primary tabular-nums sm:text-3xl lg:text-4xl">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider sm:text-sm">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden h-10 w-10 rounded-full border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white md:flex sm:h-12 sm:w-12"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6" />}
          </Button>
        </div>
      </header>

      {/* Grid */}
      {queues.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center text-slate-400 sm:h-[60vh]">
          <div className="rounded-full bg-slate-900 p-6 shadow-inner sm:p-8">
            <Clock className="h-16 w-16 opacity-20 sm:h-24 sm:w-24" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-300 sm:mt-6 sm:text-2xl">No Active Queues</h2>
          <p className="max-w-md text-center text-slate-500 mt-1.5 text-sm sm:mt-2 sm:text-base">
            No active appointments scheduled at this moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {queues.map((queue: any) => (
            <Card key={queue.doctor.id} className="overflow-hidden border-slate-800 bg-slate-900 shadow-xl transition-all hover:shadow-2xl hover:border-slate-700 group">
              <CardHeader className="bg-slate-800/80 border-b border-slate-700/50 pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2 truncate sm:text-lg lg:text-xl">
                      {queue.doctor.name}
                    </CardTitle>
                    <p className="text-slate-400 text-xs font-medium mt-0.5 uppercase tracking-wide flex items-center gap-1.5 sm:text-sm sm:mt-1">
                      <Stethoscope className="w-3 h-3 text-primary sm:w-3.5 sm:h-3.5" />
                      {queue.doctor.specialization}
                    </p>
                  </div>
                  {queue.queueCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2 py-0.5 shadow-glow flex-shrink-0 sm:text-sm sm:px-2.5">
                      {queue.queueCount} Waiting
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4 sm:p-6 sm:space-y-6">
                {/* Current Token */}
                <div className="text-center rounded-xl bg-slate-950/50 p-4 border border-slate-800/50 relative overflow-hidden sm:rounded-2xl sm:p-6">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 sm:text-sm sm:mb-2">Now Serving</p>
                  {queue.current ? (
                    <div className="animate-in zoom-in-50 duration-500">
                      <div className="text-3xl font-black text-white font-mono tracking-tight sm:text-4xl lg:text-5xl">
                        {queue.current.tokenNumber.split('-').pop()}
                      </div>
                      <p className="mt-1.5 text-base font-medium text-emerald-400 truncate px-2 sm:mt-2 sm:text-lg">
                        {queue.current.patientName}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xl font-semibold text-slate-600 py-3 italic sm:text-2xl sm:py-4">Waiting...</p>
                  )}
                </div>

                {/* Up Next List */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 sm:text-xs">Up Next</p>
                  <div className="space-y-1.5 max-h-[140px] overflow-hidden relative sm:max-h-[160px] sm:space-y-2">
                    {queue.queue.length > 0 ? (
                      queue.queue.slice(0, 3).map((item: any, i: number) => (
                        <div key={item._id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-2.5 border border-slate-700/30 sm:p-3">
                          <div className="flex items-center gap-2 min-w-0 sm:gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-300 flex-shrink-0 sm:h-6 sm:w-6 sm:text-xs">
                              {i + 1}
                            </div>
                            <span className="font-medium text-slate-200 truncate text-sm sm:text-base sm:max-w-[120px]">
                              {item.patientName}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-primary flex-shrink-0 sm:text-sm">
                            #{item.tokenNumber.split('-').pop()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-slate-500 italic text-xs bg-slate-800/20 rounded-lg border border-slate-800/30 border-dashed sm:py-4 sm:text-sm">
                        No patients in waiting list
                      </div>
                    )}
                    {queue.queue.length > 3 && (
                      <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none flex items-end justify-center">
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-2 rounded-full absolute -bottom-2 border border-slate-800 sm:text-xs">
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