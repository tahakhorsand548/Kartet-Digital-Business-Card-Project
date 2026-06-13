import React, { useState, useEffect } from "react";
import AuthPages from "./components/AuthPages";
import UserDashboard from "./components/UserDashboard";
import AdminPanel from "./components/AdminPanel";
import CardPreview from "./components/CardPreview";
import { User, CardData } from "./types";
import { ShieldCheck, RefreshCw, QrCode, Globe, Info, CreditCard, Flame } from "lucide-react";
import { apiFetch, removeAuthToken } from "./utils/api";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Custom SPA Router States matched from window.location.pathname
  const [path, setPath] = useState(window.location.pathname);
  
  // Public card viewer state
  const [publicCardUser, setPublicCardUser] = useState<string | null>(null);
  const [publicCardData, setPublicCardData] = useState<any | null>(null);
  const [publicCardLoading, setPublicCardLoading] = useState(false);
  const [publicCardError, setPublicCardError] = useState("");

  // Sync state with browser location
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Fetch session on load
  useEffect(() => {
    checkActiveSession();
  }, []);

  // Parse path to fetch public card if matching /card/:username
  useEffect(() => {
    const match = path.match(/^\/card\/([a-zA-Z0-9]+)/);
    if (match) {
      const username = match[1];
      setPublicCardUser(username);
      fetchPublicCard(username);
    } else {
      setPublicCardUser(null);
      setPublicCardData(null);
    }
  }, [path]);

  const checkActiveSession = async () => {
    setSessionLoading(true);
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
          removeAuthToken();
        }
      } else {
        setCurrentUser(null);
        removeAuthToken();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchPublicCard = async (username: string) => {
    setPublicCardLoading(true);
    setPublicCardError("");
    try {
      // Pass UTM source if scanned from physical QR
      const params = new URLSearchParams(window.location.search);
      const source = params.get("source") || "link";

      const res = await apiFetch(`/api/card/${username}?source=${source}`);
      const data = await res.json();
      if (res.ok) {
        setPublicCardData(data);
      } else {
        setPublicCardError(data.message || "کارت ویزیت مورد نظر در مرکز سرور یافت نشد.");
      }
    } catch (e) {
      setPublicCardError("خطای شبکه در بارگذاری کارت ویزیت.");
    } finally {
      setPublicCardLoading(false);
    }
  };

  const navigateTo = (newPath: string) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.username === "admin") {
      navigateTo("/admin/dashboard");
    } else {
      navigateTo(`/dashboard/${user.username}`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await apiFetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        removeAuthToken();
        setCurrentUser(null);
        navigateTo("/");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-600 font-medium font-bold">تأیید هویت کاربری در سرور...</p>
      </div>
    );
  }

  // 1. PUBLIC CARD VIEW /card/[username]
  if (publicCardUser) {
    if (publicCardLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-semibold">در حال دریافت کارت ویزیت دیجیتال...</p>
        </div>
      );
    }

    if (publicCardError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">خطا در بارگذاری کارت</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">{publicCardError}</p>
          <button 
            onClick={() => navigateTo("/")}
            className="mt-6 py-2 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 transition-all"
          >
            ورود به سایت کارتت
          </button>
        </div>
      );
    }

    if (publicCardData) {
      return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center p-0 md:p-6">
          {/* On Desktop: Show in elegant centered smartphone container. On Mobile: full width */}
          <div className="w-full max-w-md md:max-w-md h-full md:min-h-[850px] md:max-h-[90%] md:rounded-[40px] md:border-8 md:border-slate-900 md:shadow-2xl overflow-hidden relative scrollbar-none bg-white">
            <CardPreview data={publicCardData.cardData} username={publicCardData.username} isPreview={false} />
          </div>
        </div>
      );
    }
  }

  // 2. ADMIN PORTALS /admin/*
  if (path.startsWith("/admin")) {
    if (!currentUser || currentUser.username !== "admin") {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
            <AuthPages onLoginSuccess={handleLoginSuccess} initialMode="login" />
            <p className="text-[10px] text-red-600 mt-4 text-center font-bold">شما مجاز به دسترسی به پنل مدیریت نیستید. لطفا به عنوان ادمین وارد شوید.</p>
          </div>
        </div>
      );
    }

    return (
      <AdminPanel 
        onBypassLogin={(username) => {
          // Bypassing directly signs user session and navigates admin to dashboard
          checkActiveSession();
          navigateTo(`/dashboard/${username}`);
        }}
        onLogout={handleLogout}
        onCloseAdmin={() => navigateTo(`/dashboard/${currentUser.username}`)}
      />
    );
  }

  // 3. USER DASHBOARDS /dashboard/*
  if (path.startsWith("/dashboard")) {
    const matchDashboard = path.match(/^\/dashboard\/([a-zA-Z0-9]+)/);
    const dashboardUser = matchDashboard ? matchDashboard[1] : null;

    if (!currentUser) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
          <AuthPages onLoginSuccess={handleLoginSuccess} initialMode="login" />
        </div>
      );
    }

    // Security check: normal user cannot view someone else's dashboard! Only admin can bypass
    if (currentUser.username !== "admin" && dashboardUser && currentUser.username !== dashboardUser) {
      // Redirect to their own dashboard
      navigateTo(`/dashboard/${currentUser.username}`);
      return null;
    }

    // Loaded active user dashboard
    return (
      <UserDashboard 
        user={currentUser}
        onLogout={handleLogout}
        onNavigateToAdmin={currentUser.username === "admin" ? () => navigateTo("/admin/desk") : undefined}
      />
    );
  }

  // 4. PORTAL ROOT / (Interactive landing page and signup options)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* Navbar header */}
      <header className="border-b border-slate-200/80 bg-white py-4 px-6 md:px-12 flex justify-between items-center text-right shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-200">ك</div>
          <span className="font-extrabold text-slate-900 text-base">کارتت | Kartet</span>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser ? (
            <button
              onClick={() => {
                if (currentUser.username === "admin") {
                  navigateTo("/admin/dashboard");
                } else {
                  navigateTo(`/dashboard/${currentUser.username}`);
                }
              }}
              className="py-2 px-4 rounded-xl bg-blue-600 font-bold text-xs hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-100"
            >
              داشبورد کاربری من
            </button>
          ) : (
            <button
              onClick={() => navigateTo("/dashboard/login")}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold text-xs border border-transparent transition-all"
            >
              ورود / ثبت‌نام اعضا
            </button>
          )}
        </div>
      </header>

      {/* Main hero cards content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-right">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold leading-none">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>پیشروترین پلتفرم ساخت کارت هوشمند در کشور</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            کارت ویزیت کاغذی را فراموش کنید، <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-650">دیجیتالی بدرخشید!</span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 leading-relaxed font-semibold">
            با کارتت، در کمتر از ۵ دقیقه کارت ویزیت هوشمند اختصاصی خود را بسازید. مجهز به آمارگیر پیشرفته، کاتالوگ محصولات دیجیتال، گالری اسلایدر تصاویر، و سیستم نوبت‌دهی و پشتیبانی آنلاین. کارت خود را با کیوآرکد روی برچسب‌های NFC چاپ و همیشه همراه داشته باشید.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={() => {
                if (currentUser) {
                  navigateTo(`/dashboard/${currentUser.username}`);
                } else {
                  navigateTo("/dashboard/login");
                }
              }}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 text-white text-sm font-black transition-all"
            >
              همین حالا رایگان بسازید!
            </button>
            <a
              href="/card/admin"
              className="py-3.5 px-6 rounded-xl bg-white border border-slate-200 text-slate-705 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Globe className="w-4.5 h-4.5 text-blue-650" />
              مشاهده دمو کارت ادمین
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <span className="text-xl font-black text-slate-800 font-mono block">۱۰۰٪</span>
              <span className="text-[10px] text-slate-400 font-bold">بروزرسانی زنده آنلاین</span>
            </div>
            <div>
              <span className="text-xl font-black text-slate-800 font-mono block">۱۹.۵:۹</span>
              <span className="text-[10px] text-slate-400 font-bold">موکاپ آیفون ۱۶ پرو</span>
            </div>
            <div>
              <span className="text-xl font-black text-slate-800 font-mono block">۲۴ ساعته</span>
              <span className="text-[10px] text-slate-400 font-bold">پشتیبانی آنلاین تیکتی</span>
            </div>
          </div>
        </div>

        {/* Auth card render right next to hero layout */}
        <div className="bg-white p-2 rounded-[32px] border border-slate-200/80 shadow-xl relative">
          <AuthPages onLoginSuccess={handleLoginSuccess} initialMode="register" />
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-6 text-center text-[10px] text-slate-400 font-semibold">
        <p>© ۱۴۰۵ پلتفرم کارتت (Kartet) - کلیه حقوق مادی و معنوی محفوظ می باشد.</p>
      </footer>

    </div>
  );
}
