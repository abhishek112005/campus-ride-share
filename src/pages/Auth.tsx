import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Car, Shield, MapPin, Leaf, ArrowRight } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) navigate("/dashboard");
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const fullName = formData.get("full-name") as string;
    const parentPhone = formData.get("parent-phone") as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").update({ parent_phone_number: parentPhone }).eq("id", data.user.id);
      }

      toast({
        title: "Account Created!",
        description: "Your account is pending admin approval. You'll be notified via email.",
      });
    } catch (error: any) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Successfully signed in." });
    } catch (error: any) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-11 rounded-xl border-gray-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all font-medium";

  return (
    <div className="min-h-screen flex">

      {/* ── Left Brand Panel (desktop only) ── */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, hsl(158,79%,30%) 0%, hsl(200,90%,40%) 55%, hsl(258,85%,52%) 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)" }} />
        <div className="absolute bottom-24 left-6 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
        <div className="absolute top-40 left-16 w-14 h-14 rounded-2xl border border-white/15 rotate-12" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="absolute bottom-56 right-10 w-10 h-10 rounded-2xl border border-white/12 -rotate-8" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/25">
              <Car className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">RideMate Campus</span>
          </div>
        </div>

        {/* Headline & features */}
        <div className="relative z-10">
          <h2 className="text-[2.4rem] font-extrabold text-white leading-tight mb-5 tracking-tight">
            Your campus commute,{" "}
            <span style={{ color: "rgba(167,243,208,1)" }}>reinvented.</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-xs">
            Join thousands of verified students sharing safe, affordable rides every day.
          </p>

          <div className="space-y-3.5">
            {[
              { icon: Shield,   text: "Admin-verified user profiles" },
              { icon: MapPin,   text: "Live GPS with parent notifications" },
              { icon: Leaf,     text: "Track your eco contribution" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/15" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">👥</div>
            <div>
              <p className="text-white font-bold text-sm leading-none">500+ Campus Students</p>
              <p className="text-white/55 text-xs mt-1">Already sharing rides safely</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10" style={{ background: "hsl(220, 28%, 97%)" }}>
        <div className="w-full max-w-[420px]">

          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-xl text-gray-900">RideMate Campus</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <Tabs defaultValue="signin">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Welcome</h1>
                <p className="text-gray-500 text-sm">Sign in or create your campus account</p>
              </div>

              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/80 p-1 rounded-xl h-10">
                <TabsTrigger value="signin" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ── Sign In ── */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm font-semibold text-gray-700">Email</Label>
                    <Input id="signin-email" name="signin-email" type="email" placeholder="your.email@college.edu" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm font-semibold text-gray-700">Password</Label>
                    <Input id="signin-password" name="signin-password" type="password" required className={inputCls} />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl btn-primary text-sm font-semibold mt-2" disabled={loading}>
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                      : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Sign Up ── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <Input id="full-name" name="full-name" type="text" placeholder="Rahul Sharma" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-semibold text-gray-700">College Email</Label>
                    <Input id="signup-email" name="signup-email" type="email" placeholder="your.name@college.edu" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parent-phone" className="text-sm font-semibold text-gray-700">Parent's Phone</Label>
                    <Input id="parent-phone" name="parent-phone" type="tel" placeholder="+91 98765 43210" required className={inputCls} />
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Shield className="h-3 w-3 shrink-0" />
                      Parents receive live tracking alerts for safety
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-semibold text-gray-700">Password</Label>
                    <Input id="signup-password" name="signup-password" type="password" required minLength={6} className={inputCls} />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl btn-primary text-sm font-semibold mt-2" disabled={loading}>
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                      : <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">Account requires admin verification before activation</p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            By continuing, you agree to our campus ride-sharing community guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
