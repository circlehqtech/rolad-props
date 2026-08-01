import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  staffProfiles,
  useAuthStore,
  type MockCardProfile,
} from "../../store/authStore";
import { toast } from "../../utils/toast";
import Button from "../../components/Button";
import FlatIcon from "../../components/FlatIcon";

export default function Login() {
  const navigate = useNavigate();
  const loginSession = useAuthStore((state) => state.loginSession);
  const setSession = useAuthStore((state) => state.setSession);
  const devLoginSession = useAuthStore((state) => state.devLoginSession);
  const [selectedStaff, setSelectedStaff] = useState<MockCardProfile | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = (staff: MockCardProfile) => {
    setSelectedStaff(staff);
    setPassword("");
    setShowPassword(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);

    loginSession(selectedStaff.email, password)
      .then(() => {
        setIsLoading(false);
        toast.success(`Welcome back, ${selectedStaff.name}!`);
        navigate("/dashboard");
      })
      .catch((err: any) => {
        setIsLoading(false);
        if (import.meta.env.DEV && err?.statusCode === 0) {
          const [firstName, ...lastNameParts] = selectedStaff.name.split(" ");
          setSession(
            `rolad-local-preview:${selectedStaff.roleCode}`,
            {
              id: selectedStaff.id,
              firstName,
              lastName: lastNameParts.join(" "),
              email: selectedStaff.email,
              avatarUrl: selectedStaff.photo,
            },
            { code: selectedStaff.roleCode, label: selectedStaff.role },
          );
          toast.success(`Previewing as ${selectedStaff.name}`);
          navigate("/dashboard");
          return;
        }
        const errMsg =
          err.messages?.[0] || err.message || "Invalid credentials";
        toast.error(errMsg);
      });
  };

  const handleDevLoginBypass = () => {
    if (!selectedStaff) return;
    setIsLoading(true);
    devLoginSession(selectedStaff.roleCode)
      .then(() => {
        setIsLoading(false);
        toast.success(`Bypassed authentication as ${selectedStaff.name}`);
        navigate("/dashboard");
      })
      .catch((err: any) => {
        setIsLoading(false);
        const errMsg =
          err.messages?.[0] || err.message || "Dev login bypass failed";
        toast.error(errMsg);
      });
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-5 lg:grid lg:grid-cols-[.88fr_1.12fr] lg:gap-5 select-none">
      <aside className="relative hidden min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-[28px] bg-brand-teal p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="brand-mark !bg-white !text-brand-teal"><span>R</span></span>
            <div>
              <p className="text-lg font-extrabold">ROLAD PROPS</p>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/60">Property operations</p>
            </div>
          </div>
          <div className="mt-20 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em]">
              <FlatIcon name="shield-check" className="text-[13px]" />
              Secure staff access
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight xl:text-5xl">
              Every property operation, in one clear view.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
              Manage client portfolios, collections, approvals and estate delivery from your role-specific workspace.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-[10px] font-semibold text-white/65">
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-brand-lime" /> Systems available</span>
          <span>Protected workspace</span>
        </div>
        <div className="dashboard-skyline pointer-events-none absolute bottom-0 right-0 h-[42%] w-[65%] opacity-55">
          <div className="absolute bottom-0 right-[8%] h-full w-[25%] rounded-t-xl bg-white/15" />
          <div className="absolute bottom-0 right-[36%] h-[74%] w-[31%] rounded-t-xl bg-brand-coral/75" />
          <div className="absolute bottom-0 right-[67%] h-[52%] w-[20%] rounded-t-xl bg-white/10" />
        </div>
      </aside>

      <main className="flex min-h-[calc(100vh-1.5rem)] flex-col justify-center overflow-y-auto px-3 py-8 sm:px-8 lg:min-h-[calc(100vh-2.5rem)] lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="brand-mark"><span>R</span></span>
              <p className="text-lg font-extrabold text-charcoal">ROLAD <span className="text-brand-teal">PROPS</span></p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[.15em] text-brand-teal">Staff portal</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal">Choose your workspace</h2>
          <p className="mt-2 text-sm text-muted-gray">Select your profile to continue to the dashboard assigned to your role.</p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {staffProfiles.map((staff) => (
              <button
                type="button"
                key={staff.id}
                onClick={() => handleCardClick(staff)}
                className="group flex items-center gap-3 rounded-2xl border border-border-warm bg-white p-3 text-left shadow-sm hover:-translate-y-0.5 hover:border-brand-teal/35 hover:shadow-md"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#edf5f6]">
                  <img src={staff.photo} alt={staff.name} className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-bold text-charcoal group-hover:text-brand-teal">{staff.name}</h3>
                  <p className="mt-1 truncate text-[10px] font-medium text-muted-gray">{staff.role}</p>
                </div>
                <FlatIcon name="angle-small-right" className="text-[14px] text-slate-300 group-hover:text-brand-teal" />
              </button>
            ))}
          </div>

          <button className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-brand-teal hover:text-[#087d88]">
            Request external access
            <FlatIcon name="arrow-small-right" className="text-[14px]" />
          </button>
        </div>
      </main>

      {/* Onboarding Signin Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white/95 border border-border-warm rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-scale-up">
            {/* Design accents */}
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand-teal to-brand-lime" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-4 right-4 text-muted-gray hover:text-charcoal cursor-pointer p-1 rounded-full hover:bg-neutral-100 transition-colors"
            >
              ✕
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center text-center">
              {/* Staff Avatar preview */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-teal shadow-md mb-4 bg-neutral-100">
                <img
                  src={selectedStaff.photo}
                  alt={selectedStaff.name}
                  className="w-full h-full object-cover grayscale"
                />
              </div>

              <h3 className="font-serif text-xl font-bold text-charcoal leading-none mb-1">
                {selectedStaff.name}
              </h3>
              <p className="font-sans text-xs font-semibold text-brand-teal uppercase tracking-wider mb-6">
                {selectedStaff.role}
              </p>

              {/* Login Form */}
              <form
                onSubmit={handleLogin}
                className="w-full space-y-4 text-left"
              >
                {/* Email (Disabled Display) */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <FlatIcon name="envelope" className="absolute left-3 text-[14px] text-muted-gray" />
                    <input
                      type="email"
                      value={selectedStaff.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-border-warm rounded text-sm text-charcoal font-medium outline-none cursor-not-allowed select-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-bold text-muted-gray tracking-wider">
                      Verify Security Password
                    </label>
                    <span className="text-[9px] text-brand-olive font-bold tracking-wide">
                      Any password works
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <FlatIcon name="lock" className="absolute left-3 text-[14px] text-muted-gray" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      className="w-full pl-10 pr-10 py-2 border border-border-warm focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/15 rounded text-sm text-charcoal outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-0.5 text-muted-gray hover:text-charcoal cursor-pointer focus:outline-none"
                    >
                      <FlatIcon
                        name={showPassword ? "eye-crossed" : "eye"}
                        className="text-[14px]"
                      />
                    </button>
                  </div>
                </div>

                {/* Info alert banner */}
                <div className="p-3 bg-brand-teal/5 border border-brand-teal/10 rounded flex items-start gap-2.5">
                  <FlatIcon name="shield-check" className="text-[14px] text-brand-teal mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-normal text-brand-teal font-medium">
                    This portal secures executive dashboards by role. Sign in to
                    view client lists, payments, and approvals tailored to your
                    scope.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setSelectedStaff(null)}
                      className="flex-1 text-xs py-2 bg-neutral-100 hover:bg-neutral-200 border-none rounded text-charcoal"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={isLoading}
                      className="flex-1 text-xs py-2 bg-brand-teal hover:bg-brand-teal/95 text-white rounded font-bold"
                    >
                      Authorize Session
                    </Button>
                  </div>
                  {/* {import.meta.env.VITE_DEV_LOGIN !== "false" && (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleDevLoginBypass}
                      isLoading={isLoading}
                      className="w-full text-xs py-1.5 bg-brand-lime/10 hover:bg-brand-lime/20 border border-brand-lime/30 text-brand-teal font-bold rounded"
                    >
                      Bypass Password (Dev Login)
                    </Button>
                  )} */}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="hidden">
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-brand-teal transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-brand-teal transition-colors">
            Help Center
          </a>
          <a
            href="#"
            className="hover:text-brand-teal transition-colors flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-olive animate-pulse" />
            System Status: Nominal
          </a>
        </div>
        <div>
          <span>© 2024 Rolad Ops. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
