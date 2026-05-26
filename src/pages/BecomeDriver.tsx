import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { Loader2, CheckCircle, Car, Shield, Phone, FileText, ArrowRight, Clock } from "lucide-react";

const BecomeDriver = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    license_number: "",
    license_photo_url: "",
    parent_phone_number: "",
    confirmation_letter_url: "",
    vehicle_model: "",
    vehicle_number: "",
    vehicle_type: "four_wheeler" as "two_wheeler" | "four_wheeler",
  });

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(profileData);

    const { data: driverData } = await supabase.from("driver_details").select("*").eq("user_id", session.user.id).single();
    setDriverDetails(driverData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    if (!formData.license_number || !formData.license_photo_url || !formData.parent_phone_number || !formData.confirmation_letter_url) {
      toast({ title: "Missing information", description: "Please fill in all required fields and upload all documents", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error: driverError } = await supabase.from("driver_details").insert({ user_id: session.user.id, ...formData });
    if (driverError) {
      toast({ title: "Error", description: driverError.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").update({ is_driver: true }).eq("id", session.user.id);
    if (profileError) {
      toast({ title: "Error", description: profileError.message, variant: "destructive" });
    } else {
      toast({ title: "Application submitted! 🎉", description: "Your driver application is pending admin approval." });
      navigate("/dashboard");
    }
    setSubmitting(false);
  };

  const inputCls = "h-10 rounded-xl border-gray-200 bg-white focus:border-primary transition-all";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── Already Applied State ── */
  if (driverDetails) {
    const isApproved = driverDetails.approval_status === "approved";
    const isPending  = driverDetails.approval_status === "pending";
    return (
      <div>
        <div className="page-hero">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Driver Application</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10 max-w-2xl">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={`h-2 w-full ${isApproved ? "bg-gradient-eco" : "bg-gradient-to-r from-amber-400 to-amber-500"}`} />
            <CardContent className="py-10 text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg ${isApproved ? "bg-gradient-eco" : "bg-amber-50 border-2 border-amber-200"}`}>
                {isApproved
                  ? <CheckCircle className="h-10 w-10 text-white" />
                  : <Clock className="h-10 w-10 text-amber-500" />
                }
              </div>
              <h2 className="text-xl font-extrabold mb-2">
                {isApproved ? "You're an Approved Driver!" : "Application Under Review"}
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6">
                {isApproved
                  ? "Congratulations! You can now create rides and start earning."
                  : "Your application has been submitted and is being reviewed by our admin team. You'll be notified once processed."
                }
              </p>
              <div className="flex gap-3 justify-center">
                {isApproved && (
                  <Button className="btn-primary font-semibold" onClick={() => navigate("/create-ride")}>
                    Create Your First Ride <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
                <Button variant={isApproved ? "outline" : undefined} className={isApproved ? "font-semibold" : "btn-primary font-semibold"} onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ── Application Form ── */
  const steps = [
    { icon: Shield, label: "License Details",   desc: "Your driving license info" },
    { icon: Phone,  label: "Emergency Contact", desc: "Parent/guardian number" },
    { icon: Car,    label: "Vehicle Info",       desc: "Your vehicle details" },
    { icon: FileText, label: "Documents",        desc: "Upload required documents" },
  ];

  return (
    <div>
      {/* ── Page Hero ── */}
      <div className="page-hero" style={{ background: "linear-gradient(135deg, hsl(222, 47%, 95%) 0%, white 60%)" }}>
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Become a Driver</h1>
              <p className="text-sm text-muted-foreground">Share rides and earn on your campus commute</p>
            </div>
          </div>

          {/* Step chips */}
          <div className="flex gap-2 flex-wrap">
            {steps.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-semibold bg-white/70 border border-gray-200 rounded-xl px-3 py-1.5 text-foreground shadow-sm">
                <Icon className="h-3.5 w-3.5 text-primary" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── License Details ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="font-bold text-sm">License Details</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="license_number" className="text-sm font-semibold">
                  Driving License Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="e.g., TS0120220012345"
                  className={inputCls}
                  required
                />
              </div>

              <FileUpload
                bucket="driver-documents"
                path={profile?.id || ""}
                accept="image/*,.pdf"
                label="License Photo / Scan *"
                currentFile={formData.license_photo_url}
                onUploadComplete={url => setFormData({ ...formData, license_photo_url: url })}
              />
            </CardContent>
          </Card>

          {/* ── Emergency Contact ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="font-bold text-sm">Emergency Contact</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parent_phone" className="text-sm font-semibold">
                  Parent / Guardian Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="parent_phone"
                  type="tel"
                  value={formData.parent_phone_number}
                  onChange={e => setFormData({ ...formData, parent_phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={inputCls}
                  required
                />
                <p className="text-xs text-muted-foreground">Used to notify your guardian at the start of each ride for safety</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Vehicle Details ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="font-bold text-sm">Vehicle Information</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Vehicle Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value: "two_wheeler" | "four_wheeler") => setFormData({ ...formData, vehicle_type: value })}
                >
                  <SelectTrigger className={`${inputCls} w-full`}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="two_wheeler">🛵 2-Wheeler (Bike / Scooter)</SelectItem>
                    <SelectItem value="four_wheeler">🚗 4-Wheeler (Car)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_model" className="text-sm font-semibold">Vehicle Model</Label>
                  <Input
                    id="vehicle_model"
                    value={formData.vehicle_model}
                    onChange={e => setFormData({ ...formData, vehicle_model: e.target.value })}
                    placeholder="e.g., Honda City 2022"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_number" className="text-sm font-semibold">Registration Number</Label>
                  <Input
                    id="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                    placeholder="e.g., TS 09 EF 1234"
                    className={inputCls}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Documents ── */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="font-bold text-sm">Required Documents</p>
              </div>

              <FileUpload
                bucket="driver-documents"
                path={profile?.id || ""}
                accept="image/*,.pdf"
                label="Confirmation Letter * (from college / institution)"
                currentFile={formData.confirmation_letter_url}
                onUploadComplete={url => setFormData({ ...formData, confirmation_letter_url: url })}
              />
            </CardContent>
          </Card>

          {/* ── Terms notice ── */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-bold">Note:</span> By submitting this application, you confirm that all information provided is accurate and that you agree to follow the campus ride-share safety guidelines. Your application will be reviewed by an admin within 24–48 hours.
            </p>
          </div>

          {/* ── Submit ── */}
          <Button type="submit" disabled={submitting} className="w-full h-12 rounded-2xl btn-primary text-base font-bold">
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              : <>Submit Application <ArrowRight className="ml-2 h-4 w-4" /></>
            }
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BecomeDriver;
