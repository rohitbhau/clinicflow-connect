import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Users, Clock, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const QueueDisplay = () => {
    const { doctorId } = useParams();
    const [queueData, setQueueData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchQueueStatus = async () => {
        try {
            const response = await api.get(`/appointments/queue/${doctorId}`);
            setQueueData(response.data.data);
            setError("");
        } catch (err) {
            console.error("Failed to fetch queue:", err);
            setError("Failed to load queue data. Retrying...");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 10000);
        return () => clearInterval(interval);
    }, [doctorId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !queueData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
                <p className="text-red-500 text-sm sm:text-base text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col">
            <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="text-center space-y-1 sm:space-y-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 truncate px-2">
                        {queueData?.doctor?.name}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 font-medium">
                        {queueData?.doctor?.specialization}
                    </p>
                    <Badge variant="outline" className="text-xs sm:text-sm md:text-base lg:text-lg py-0.5 sm:py-1 px-2 sm:px-4 bg-white">
                        Live Queue Status
                    </Badge>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8 flex-1">
                    {/* Current Serving */}
                    <Card className="border-primary/20 shadow-xl flex flex-col justify-center">
                        <CardHeader className="text-center pb-1 sm:pb-2">
                            <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary flex items-center justify-center gap-1.5 sm:gap-2">
                                <Play className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" /> Now Serving
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-4 sm:py-6 md:py-8 lg:py-10">
                            {queueData?.current ? (
                                <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-pulse">
                                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-primary leading-tight break-all">
                                        #{queueData.current.tokenNumber}
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 font-medium truncate px-2">
                                        {queueData.current.patientName}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 py-4 sm:py-6 md:py-8">
                                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 mx-auto mb-2 sm:mb-3 md:mb-4 opacity-20" />
                                    <p className="text-sm sm:text-base md:text-lg lg:text-xl">Waiting for next patient...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Up Next List */}
                    <Card className="shadow-lg flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Up Next
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                {queueData?.queue?.length > 0 ? (
                                    queueData.queue.map((item: any, index: number) => (
                                        <div
                                            key={item._id}
                                            className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg bg-slate-50 border border-slate-200 gap-2 sm:gap-3"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                                                <span className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-xs sm:text-sm md:text-base text-slate-700 shrink-0">
                                                    {index + 1}
                                                </span>
                                                <span className="font-semibold text-sm sm:text-base md:text-lg text-slate-800 truncate">
                                                    {item.patientName}
                                                </span>
                                            </div>
                                            <Badge className="text-[10px] sm:text-xs md:text-sm lg:text-base px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-slate-900 text-white shrink-0 max-w-[45%] truncate">
                                                #{item.tokenNumber}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 sm:py-6 md:py-8 text-muted-foreground">
                                        <p className="text-sm sm:text-base">No patients in waiting queue.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QueueDisplay;
