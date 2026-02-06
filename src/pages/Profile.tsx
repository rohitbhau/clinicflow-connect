import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, User as UserIcon, Building } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email().readonly(),
    hospitalName: z.string().optional(),
    experience: z.string().optional(),
    profileImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    hospitalImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserData {
    name: string;
    email: string;
    role: string;
    hospitalName?: string;
    experience?: string;
    profileImage?: string;
    hospitalImage?: string;
}




const Profile = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/profile");
                const userData: UserData = response.data.data;

                setValue("name", userData.name || "");
                setValue("email", userData.email);
                setValue("hospitalName", userData.hospitalName || "");
                setValue("experience", userData.experience || "");
                setValue("profileImage", userData.profileImage || "");
                setValue("hospitalImage", userData.hospitalImage || "");
            } catch (error) {
                console.error("Fetch profile error:", error);
                toast.error("Failed to load profile");
            } finally {
                setIsFetching(false);
            }
        };

        fetchProfile();
    }, [setValue]);

    const onSubmit = async (data: ProfileFormValues) => {
        setIsLoading(true);
        try {
            const response = await api.put("/auth/profile", data);

            const currentUser = JSON.parse(localStorage.getItem("user") || "{ }");
            const updatedUser = { ...currentUser, ...response.data.data };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            toast.success("Profile updated", {
                description: "Your changes have been saved successfully.",
            });

            window.location.reload();

        } catch (error: any) {
            console.error("Update profile error:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const user = JSON.parse(localStorage.getItem("user") || "{ }");
    const userRole = (user.role === "admin" || user.role === "doctor") ? user.role : "doctor";

    return (
        <DashboardLayout
            type={userRole}
            title="Profile Settings"
            subtitle="Manage your personal and hospital information"
        >
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    Update your personal details and public profile.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        {...register("email")}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Dr. John Doe"
                                        {...register("name")}
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience">Experience (Years/Description)</Label>
                                    <Input
                                        id="experience"
                                        placeholder="e.g., 10 years in Cardiology"
                                        {...register("experience")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profileImage">Profile Image URL</Label>
                                    <Input
                                        id="profileImage"
                                        placeholder="https://example.com/avatar.jpg"
                                        {...register("profileImage")}
                                        className={errors.profileImage ? "border-red-500" : ""}
                                    />
                                    {errors.profileImage && (
                                        <p className="text-sm text-red-500">{errors.profileImage.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Organization Details</CardTitle>
                                <CardDescription>
                                    Manage your hospital or clinic information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hospitalName">Hospital/Clinic Name</Label>
                                    <Input
                                        id="hospitalName"
                                        {...register("hospitalName")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hospitalImage">Hospital Image URL</Label>
                                    <Input
                                        id="hospitalImage"
                                        placeholder="https://example.com/hospital.jpg"
                                        {...register("hospitalImage")}
                                        className={errors.hospitalImage ? "border-red-500" : ""}
                                    />
                                    {errors.hospitalImage && (
                                        <p className="text-sm text-red-500">{errors.hospitalImage.message}</p>
                                    )}
                                </div>

                                <div className="pt-8">
                                    {/* Added spacing to align with button */}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save All Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
