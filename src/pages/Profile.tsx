import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Camera } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageLoader } from "@/components/ui/page-loader";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().readonly(),
  hospitalName: z.string().optional(),
  experience: z.string().optional(),
  profileImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  hospitalImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const profileImage = watch("profileImage");
  const userName = watch("name");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        const userData = response.data.data;
        setValue("name", userData.name || "");
        setValue("email", userData.email);
        setValue("hospitalName", userData.hospitalName || "");
        setValue("experience", userData.experience || "");
        setValue("profileImage", userData.profileImage || "");
        setValue("hospitalImage", userData.hospitalImage || "");
      } catch (error) {
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
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (user.role === "admin" || user.role === "doctor") ? user.role : "doctor";

  if (isFetching) {
    return (
      <DashboardLayout type={userRole} title="Profile">
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type={userRole} title="Profile" subtitle="Manage your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={profileImage || ""} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {(userName?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-3 font-display text-lg font-bold">{userName || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input id="email" {...register("email")} disabled className="h-11 bg-muted text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input id="name" placeholder="Dr. John Doe" {...register("name")}
                className={`h-11 text-base ${errors.name ? "border-destructive" : ""}`} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-sm">Experience</Label>
              <Input id="experience" placeholder="e.g., 10 years in Cardiology" {...register("experience")}
                className="h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profileImage" className="text-sm">Profile Image URL</Label>
              <Input id="profileImage" placeholder="https://example.com/avatar.jpg" {...register("profileImage")}
                className={`h-11 text-base ${errors.profileImage ? "border-destructive" : ""}`} />
              {errors.profileImage && <p className="text-xs text-destructive">{errors.profileImage.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="hospitalName" className="text-sm">Hospital/Clinic Name</Label>
              <Input id="hospitalName" {...register("hospitalName")} className="h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hospitalImage" className="text-sm">Hospital Image URL</Label>
              <Input id="hospitalImage" placeholder="https://example.com/hospital.jpg" {...register("hospitalImage")}
                className={`h-11 text-base ${errors.hospitalImage ? "border-destructive" : ""}`} />
              {errors.hospitalImage && <p className="text-xs text-destructive">{errors.hospitalImage.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</>
          ) : (
            <><Save className="mr-2 h-5 w-5" />Save Changes</>
          )}
        </Button>
      </form>
    </DashboardLayout>
  );
};

export default Profile;
