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
        const interval = setInterval(fetchQueueStatus, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [doctorId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !queueData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-slate-900">{queueData?.doctor?.name}</h1>
                    <p className="text-xl text-slate-600 font-medium">{queueData?.doctor?.specialization}</p>
                    <Badge variant="outline" className="text-lg py-1 px-4 bg-white">
                        Live Queue Status
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Serving */}
                    <Card className="border-primary/20 shadow-xl md:col-span-1 h-full flex flex-col justify-center">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                                <Play className="h-6 w-6" /> Now Serving
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-10">
                            {queueData?.current ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="text-9xl font-black text-primary">
                                        #{queueData.current.tokenNumber}
                                    </div>
                                    <div className="text-2xl text-slate-700 font-medium">
                                        {queueData.current.patientName}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 py-8">
                                    <Clock className="h-24 w-24 mx-auto mb-4 opacity-20" />
                                    <p className="text-xl">Waiting for next patient...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Up Next List */}
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" /> Up Next
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {queueData?.queue?.length > 0 ? (
                                    queueData.queue.map((item: any, index: number) => (
                                        <div
                                            key={item._id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">
                                                    {index + 1}
                                                </span>
                                                <span className="font-semibold text-lg text-slate-800">
                                                    {item.patientName}
                                                </span>
                                            </div>
                                            <Badge className="text-xl px-3 py-1 bg-slate-900 text-white">
                                                #{item.tokenNumber}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No patients in waiting queue.</p>
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
