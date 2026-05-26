import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { Loader2, MapPin, User, Car, CheckCircle, ArrowRight, Save } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<{
    full_name: string; phone_number: string;
    gender: "male"|"female"|"other"|"prefer_not_to_say"|"";
    photo_url: string; primary_location_address: string;
    primary_location_lat: number|null; primary_location_lng: number|null;
    user_type: "student"|"faculty"; current_year: number|null;
  }>({
    full_name: "", phone_number: "", gender: "", photo_url: "",
    primary_location_address: "", primary_location_lat: null, primary_location_lng: null,
    user_type: "student", current_year: null,
  });
  const [ridePreferences, setRidePreferences] = useState({ accept_opposite_gender: true, accept_seniors: true });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (error) { console.error(error); } else if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "", phone_number: data.phone_number || "",
        gender: data.gender || "", photo_url: data.photo_url || "",
        primary_location_address: data.primary_location_address || "",
        primary_location_lat: data.primary_location_lat, primary_location_lng: data.primary_location_lng,
        user_type: data.user_type || "student", current_year: data.current_year,
      });
    }

    const { data: prefData } = await supabase.from("ride_preferences").select("*").eq("user_id", session.user.id).single();
    if (prefData) setRidePreferences({ accept_opposite_gender: prefData.accept_opposite_gender, accept_seniors: prefData.accept_seniors });

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const updateData: any = {
      full_name: formData.full_name, phone_number: formData.phone_number,
      photo_url: formData.photo_url, primary_location_address: formData.primary_location_address,
      primary_location_lat: formData.primary_location_lat, primary_location_lng: formData.primary_location_lng,
      user_type: formData.user_type, current_year: formData.current_year,
    };
    if (formData.gender) updateData.gender = formData.gender;

    const { error } = await supabase.from("profiles").update(updateData).eq("id", session.user.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }

    const { error: prefError } = await supabase.from("ride_preferences").upsert({
      user_id: session.user.id,
      accept_opposite_gender: ridePreferences.accept_opposite_gender,
      accept_seniors: ridePreferences.accept_seniors,
    });

    if (prefError) {
      toast({ title: "Error updating preferences", description: prefError.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved! ✅", description: "Your changes have been saved successfully." });
      fetchProfile();
    }
    setSaving(false);
  };

  const geocodeAddress = async () => {
    if (!formData.primary_location_address) {
      toast({ title: "Enter an address", description: "Please enter an address first", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.primary_location_address)}`);
      const data = await res.json();
      if (data?.length > 0) {
        setFormData({ ...formData, primary_location_lat: parseFloat(data[0].lat), primary_location_lng: parseFloat(data[0].lon) });
        toast({ title: "Location found! 📍", description: "Coordinates set successfully." });
      } else {
        toast({ title: "Not found", description: "Could not find coordinates for this address", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to geocode address", variant: "destructive" });
    }
  };

  const inputCls = "h-10 rounded-xl border-gray-200 bg-white focus:border-primary transition-all";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 shadow-md" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
                {profile?.full_name?.[0] || "U"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{profile?.full_name || "My Profile"}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-5">

        {/* ── Profile Info Card ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Information
            </CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Photo Upload */}
            <FileUpload
              bucket="profile-photos"
              path={profile?.id || ""}
              accept="image/*"
              label="Profile Photo"
              currentFile={formData.photo_url}
              onUploadComplete={url => setFormData({ ...formData, photo_url: url })}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm font-semibold">Full Name</Label>
                <Input id="full_name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={inputCls} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                <Input id="phone" type="tel" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className={inputCls} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Gender</Label>
                <Select value={formData.gender} onValueChange={(v: any) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">I am a</Label>
                <Select value={formData.user_type} onValueChange={(v: "student"|"faculty") => setFormData({ ...formData, user_type: v, current_year: v === "faculty" ? null : formData.current_year })}>
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.user_type === "student" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Current Year</Label>
                <Select value={formData.current_year?.toString() || ""} onValueChange={v => setFormData({ ...formData, current_year: parseInt(v) })}>
                  <SelectTrigger className={`${inputCls} max-w-xs w-full`}><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Location Card ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Primary Location
            </CardTitle>
            <CardDescription>Used for calculating your pickup distance and fare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Home Address</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.primary_location_address}
                  onChange={e => setFormData({ ...formData, primary_location_address: e.target.value })}
                  placeholder="e.g., Kondapur, Hyderabad"
                  className={`${inputCls} flex-1`}
                />
                <Button variant="outline" onClick={geocodeAddress} className="h-10 px-4 rounded-xl font-semibold hover:border-primary hover:text-primary">
                  <MapPin className="h-4 w-4 mr-1.5" /> Verify
                </Button>
              </div>
              {formData.primary_location_lat && formData.primary_location_lng && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Coordinates verified: {formData.primary_location_lat.toFixed(4)}, {formData.primary_location_lng.toFixed(4)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Ride Preferences Card ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">Ride Matching Preferences</CardTitle>
            <CardDescription>Control who you match with for rides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "accept_opposite_gender", label: "Match with opposite gender", desc: "Receive ride requests from riders of the opposite gender" },
              { key: "accept_seniors",          label: "Match with seniors (3rd & 4th year)", desc: "Receive ride requests from 3rd and 4th year students" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={ridePreferences[key as keyof typeof ridePreferences]}
                  onClick={() => setRidePreferences(p => ({ ...p, [key]: !p[key as keyof typeof ridePreferences] }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${ridePreferences[key as keyof typeof ridePreferences] ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${ridePreferences[key as keyof typeof ridePreferences] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Save Button ── */}
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-2xl btn-primary text-base font-bold">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>

        {/* ── Driver Status Cards ── */}
        {profile?.is_driver && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" /> Driver Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-2xl ${profile.approval_status === "approved" ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
                <p className={`text-sm font-semibold ${profile.approval_status === "approved" ? "text-emerald-700" : "text-amber-700"}`}>
                  {profile.approval_status === "approved" ? "✅ Approved Driver — You can create rides!" : "⏳ Driver application pending admin review."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!profile?.is_driver && (
          <Card className="border-0 shadow-sm border-primary/20 bg-primary/3">
            <CardHeader>
              <CardTitle className="text-base font-bold">Want to become a driver?</CardTitle>
              <CardDescription>Share rides with campus students on your route and earn</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="btn-primary font-semibold" onClick={() => navigate("/become-driver")}>
                Apply to Become a Driver <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
