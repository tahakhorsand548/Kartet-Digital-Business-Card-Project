import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, LayoutDashboard, Palette, QrCode, MessageSquare, 
  LogOut, Globe, Phone, MapPin, Trash2, Plus, Clock, Save, Copy, 
  Download, ArrowLeft, ArrowRight, UploadCloud, Volume2, ShieldAlert,
  Megaphone, Flame, CheckCircle, Info, ExternalLink, RefreshCw
} from "lucide-react";
import { CardData, User, Ticket, GlobalAnnouncement, AdvertisingBanner } from "../types";
import IPhoneMockup from "./IPhoneMockup";
import { apiFetch } from "../utils/api";

const fetch = apiFetch;

const COLORS_PRESETS = [
  { name: "آسمان آبی", hex: "#3B82F6" },
  { name: "یاقوتی سرخ", hex: "#EF4444" },
  { name: "زمردین سبز", hex: "#10B981" },
  { name: "کهربایی زرین", hex: "#F59E0B" },
  { name: "بنفش سلطنتی", hex: "#8B5CF6" },
  { name: "امپرور نارنجی", hex: "#F97316" },
  { name: "تاریک شب", hex: "#475569" },
  { name: "صورتی رمانتیک", hex: "#EC4899" },
  { name: "سیان اقیانوس", hex: "#06B6D4" },
  { name: "رز گلد", hex: "#FB7185" },
  { name: "قهوه‌ای لاته", hex: "#78350F" },
  { name: "ارکیده تیره", hex: "#D946EF" },
  { name: "لیمویی تابستانی", hex: "#84CC16" },
  { name: "نعنایی تازه", hex: "#14B8A6" },
  { name: "سایبرپانک سرخ", hex: "#F43F5E" },
  { name: "بنیتا بنفش", hex: "#6366F1" },
  { name: "خاکستری مدرن", hex: "#1E293B" },
  { name: "آلبالویی لوکس", hex: "#9D174D" }
];

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
}

export default function UserDashboard({ user, onLogout, onNavigateToAdmin }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "design" | "qrcode" | "tickets">("stats");
  
  // Card customization stats
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Announcements and advertising banners loaded from administrator
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [banners, setBanners] = useState<AdvertisingBanner[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  // Tickets States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Simulated drag and drop uploads progress state
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  const DAYS_OF_WEEK = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

  // Fetch initial Card details and messages
  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch User Card
      const cardRes = await fetch(`/api/user/card/${user.username}`);
      if (cardRes.ok) {
        const data = await cardRes.json();
        setCardData(data);
      } else {
        if (cardRes.status === 401 || cardRes.status === 410) {
          // Token expired or invalid, auto logout to avoid dead-end loops
          onLogout();
          return;
        }
        const errorData = await cardRes.json().catch(() => ({}));
        setErrorMsg(errorData.message || "خطا در دریافت اطلاعات کارت ویزیت از سرور.");
      }
      
      // 2. Fetch Tickets
      const ticketsRes = await fetch(`/api/user/${user.username}/tickets`);
      if (ticketsRes.ok) {
        const t = await ticketsRes.json();
        setTickets(t);
      }

      // 3. Fetch public announcements
      const annRes = await fetch("/api/announcements");
      if (annRes.ok) {
        const a = await annRes.json();
        setAnnouncements(a);
      }

      // 4. Fetch advertising banners
      const banRes = await fetch("/api/banners");
      if (banRes.ok) {
        const b = await banRes.json();
        setBanners(b);
      }
    } catch (e) {
      console.error("Error loading panel data", e);
      setErrorMsg("خطای ارتباط با سرور. لطفا اتصال اینترنت خود را بررسی نمایید.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardData) return;
    setSaveLoading(true);
    setFeedback("");
    try {
      const res = await fetch(`/api/user/card/${user.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        setFeedback("تغییرات با موفقیت ذخیره و در آدرس عمومی اعمال شد! 🎉");
        // refresh stats
        setTimeout(() => setFeedback(""), 4000);
      } else {
        setFeedback("خطا در ذخیره‌سازی اطلاعات کارت.");
      }
    } catch (err) {
      setFeedback("عدم دسترسی به پایگاه داده.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Simulating image upload with beautiful 1% to 100% progress
  const simulateImageUpload = (file: File, targetKey: string, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      let progress = 0;
      setUploadProgress(prev => ({ ...prev, [targetKey]: 0 }));
      
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Set final image URL
          callback(reader.result as string);
          setTimeout(() => {
            setUploadProgress(prev => {
              const copy = { ...prev };
              delete copy[targetKey];
              return copy;
            });
          }, 1500);
        }
        setUploadProgress(prev => ({ ...prev, [targetKey]: progress }));
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragActive(prev => ({ ...prev, [id]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragActive(prev => ({ ...prev, [id]: false }));
  };

  const handleDrop = (e: React.DragEvent, id: string, callback: (url: string) => void) => {
    e.preventDefault();
    setDragActive(prev => ({ ...prev, [id]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateImageUpload(e.dataTransfer.files[0], id, callback);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, id: string, callback: (url: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      simulateImageUpload(e.target.files[0], id, callback);
    }
  };

  // Ticket creation trigger
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketDesc) return;
    try {
      const res = await fetch(`/api/user/${user.username}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTicketTitle, description: newTicketDesc })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => [...prev, data.ticket]);
        setActiveTicket(data.ticket);
        setNewTicketTitle("");
        setNewTicketDesc("");
        setShowCreateTicketModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Chat reply trigger
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage || !activeTicket) return;

    try {
      const res = await fetch(`/api/user/${user.username}/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage, sender: "user" })
      });
      if (res.ok) {
        const newMsg = await res.json();
        // Update local tickets
        const updatedTickets = tickets.map(t => {
          if (t.id === activeTicket.id) {
            return {
              ...t,
              status: "under_review" as const,
              messages: [...t.messages, newMsg]
            };
          }
          return t;
        });
        setTickets(updatedTickets);
        setActiveTicket(updatedTickets.find(t => t.id === activeTicket.id) || null);
        setChatMessage("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Request QR code approval trigger
  const handleRequestQrCode = async () => {
    try {
      const res = await fetch(`/api/user/${user.username}/qr-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        user.qrRequestStatus = "pending";
        // recheck
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inline modifications of deep CardData state
  const editBasic = (key: string, val: any) => {
    if (!cardData) return;
    setCardData({ ...cardData, [key]: val });
  };

  const editSocial = (key: string, val: string) => {
    if (!cardData) return;
    setCardData({
      ...cardData,
      socials: { ...cardData.socials, [key]: val }
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert("لینک کپی شد");
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-5 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">خطا در همگام‌سازی پنل کاربری</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">{errorMsg}</p>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={fetchInitialData}
            className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
          <button
            onClick={onLogout}
            className="py-2.5 px-5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            خروج از حساب
          </button>
        </div>
      </div>
    );
  }

  if (loading || !cardData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">در حال همگام سازی پنل کاربری...</p>
      </div>
    );
  }

  // suspension block
  if (user.isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-white">حساب کاربری شما موقتا تعلیق شده است</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          دسترسی شما به کنترل کارت قطع شده است. در صورت نیاز به بررسی علت، می توانید از طریق تیکت های پشتیبانی زیر با مدیریت وبسایت گفتگو نمایید.
        </p>

        {/* Support panel inline in suspend mode */}
        <div className="w-full max-w-4xl mt-8 glass-effect rounded-2xl p-6 text-right">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-lg text-white">تیکت های پشتیبانی (حالت تعلیق)</h3>
            <button 
              onClick={() => setShowCreateTicketModal(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              افزودن تیکت جدید
            </button>
          </div>
          {/* List + mini chats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2 max-h-[350px] overflow-y-auto">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">تیکتی یافت نشد</p>
              ) : (
                tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`w-full p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                      activeTicket?.id === t.id ? "bg-blue-600/10 border-blue-500/40 text-white" : "bg-slate-900/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-200">{t.title}</span>
                    <span className="text-[10px] opacity-75 mt-1">{t.createdAt}</span>
                  </button>
                ))
              )}
            </div>
            <div className="md:col-span-2 bg-slate-950/60 rounded-xl p-4 min-h-[300px] flex flex-col justify-between">
              {activeTicket ? (
                <>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] p-2">
                    {activeTicket.messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2.5 rounded-xl max-w-[80%] text-xs ${m.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 rounded-bl-none"}`}>
                          <p>{m.message}</p>
                          <span className="block text-[8px] opacity-60 mt-1 text-left">{m.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {activeTicket.status !== "ended" ? (
                    <form onSubmit={handleSendChatMessage} className="flex gap-2 mt-4 pt-2 border-t border-slate-800">
                      <input 
                        type="text"
                        placeholder="پیام خود را بنویسید..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none"
                      />
                      <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold">ارسال</button>
                    </form>
                  ) : (
                    <p className="text-center text-[10px] text-red-500 py-2">مکالمه پایان یافته است</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500 text-center my-auto">یک تیکت را برای شروع گفتگو انتخاب کنید</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JALALI Date calculation helper for dynamic chart
  const getJalaliMonthsArray = () => {
    // Return last 7 entries of cardData stats
    const daily = cardData.stats?.dailyVisits || {};
    const entries = Object.entries(daily);
    if (entries.length === 0) {
      return [
        { label: "شنبه", value: 12 },
        { label: "یکشنبه", value: 15 },
        { label: "دوشنبه", value: 8 },
        { label: "سه شنبه", value: 25 },
        { label: "چهارشنبه", value: 19 },
        { label: "پنجشنبه", value: 30 },
        { label: "جمعه", value: 14 }
      ];
    }
    // Take last 7
    return entries.slice(-7).map(([date, val]) => ({
      label: date,
      value: val as number
    }));
  };

  const chartData = getJalaliMonthsArray();
  const maxChartVal = Math.max(...chartData.map(d => d.value), 10);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR CONTAINER */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-l border-slate-200/80 p-6 flex flex-col justify-between shadow-sm sticky top-0 md:h-screen">
        <div className="space-y-8">
          
          {/* User Meta header */}
          <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-lg shadow-md shadow-blue-200">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">{user.fullName}</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Sidebar Menu Options */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("stats")}
              className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                activeTab === "stats" 
                  ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>داشبورد و آمارها</span>
            </button>

            <button
              onClick={() => setActiveTab("design")}
              className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                activeTab === "design" 
                  ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Palette className="w-4.5 h-4.5" />
              <span>طراحی و ویرایش کارت</span>
            </button>

            <button
              onClick={() => setActiveTab("qrcode")}
              className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                activeTab === "qrcode" 
                  ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>کیوآرکد و بارکد راهنما</span>
            </button>

            <button
              onClick={() => setActiveTab("tickets")}
              className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                activeTab === "tickets" 
                  ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>تیکت پشتیبانی</span>
            </button>
          </nav>
        </div>

        {/* Logout & admin switch options */}
        <div className="pt-6 border-t border-slate-100 space-y-2 mt-6 md:mt-0">
          {user.username === "admin" && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all text-center"
            >
              ورود به پنل مدیریت کل سایت
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-all animate-none"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </aside>

      {/* 2. CHIEF WORKSPACE CONTENT */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* Global Banner Announcement if active from admin */}
        {announcements.filter(a => !dismissedAnnouncements.includes(a.id)).map(ann => (
          <div 
            key={ann.id}
            className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-right"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                <img src={ann.image} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-1">
                  <Megaphone className="w-3 h-3 text-amber-600" />
                  اطلاعیه مدیریت پلتفرم
                </span>
                <h4 className="font-extrabold text-sm text-slate-800">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-semibold">{ann.description}</p>
              </div>
            </div>
            <button 
              onClick={() => setDismissedAnnouncements(prev => [...prev, ann.id])}
              className="py-1.5 px-3 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-205 transition shadow-xs"
            >
              متوجه شدم
            </button>
          </div>
        ))}

        {/* Tab 1: DASHBOARD & REAL STATS */}
        {activeTab === "stats" && (
          <div className="space-y-8 text-right">
            <div>
              <h2 className="text-2xl font-black text-slate-900">سلام "{user.fullName}" گرامی</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1.5">به صفحه کنترل پنل و ایجاد کارت ویزیت دیجیتال کارتت خوش آمدید.</p>
            </div>

            {/* Quick Online link trigger */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold">آدرس آنلاین عمومی کارت ویزیت هوشمند شما :</p>
                <span className="text-sm font-semibold text-blue-600 font-mono mt-1 block">
                  {`${window.location.origin}/card/${user.username}`}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopyLink(`${window.location.origin}/card/${user.username}`)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  کپی لینک
                </button>
                <a 
                  href={`/card/${user.username}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 text-white text-xs font-bold transition flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  آدرس آنلاین کارت ویزیت
                </a>
              </div>
            </div>

            {/* 4 real statistical tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">کل بازدیدهای کارت :</span>
                  <span className="text-2xl font-black text-slate-800 font-mono mt-2 block">{cardData.stats?.totalVisits || 15}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "80%" }}></div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">روند صعودی بهینه 📈</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">تعداد اسکن بارکد (QR) :</span>
                  <span className="text-2xl font-black text-slate-850 font-mono mt-2 block">{cardData.stats?.scans || 0}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "35%" }}></div>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold mt-1 block">پاسخ کارت فیزیکی NFC</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">تعداد کلیک دکمه ها :</span>
                  <span className="text-2xl font-black text-slate-800 font-mono mt-2 block">{cardData.stats?.buttonClicks || 0}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "60%" }}></div>
                  </div>
                  <span className="text-[10px] text-[#5551FF] font-bold mt-1 block">نرخ تبدیل عالی (CTR)</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">بازدید لینک مستقیم :</span>
                  <span className="text-2xl font-black text-slate-800 font-mono mt-2 block">{cardData.stats?.linkOpens || 0}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold mt-1 block">ورودی گوگل و پیامک ها</span>
                </div>
              </div>
            </div>

            {/* Simulated interactive last 7 days chart - native SVG with CSS transitions */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800">نمودار بازدیدهای ۷ روز اخیر کارت شما (تاریخ شمسی)</h3>
              
              <div className="relative w-full h-[220px] flex items-end justify-between pt-6 pr-4">
                {chartData.map((d, idx) => {
                  const percent = (d.value / maxChartVal) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative z-10">
                      
                      {/* Bar hover indicator tooltip */}
                      <span className="absolute -top-6 bg-slate-850 text-white font-bold font-mono text-[10px] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-200">
                        {d.value} بازدید
                      </span>

                      {/* SVG representation or clean bar */}
                      <div className="w-8 bg-gradient-to-t from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-t-lg transition-all duration-500 relative"
                        style={{ height: `${Math.max(percent, 8)}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-t-lg transition" />
                      </div>
                      
                      <span className="text-[10px] text-slate-500 font-bold mt-2 truncate w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })}

                {/* Background grid indicators */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  <div className="border-b border-slate-400 w-full h-0" />
                  <div className="border-b border-slate-400 w-full h-0" />
                  <div className="border-b border-slate-400 w-full h-0" />
                  <div className="border-b border-slate-400 w-full h-0" />
                </div>
              </div>
            </div>
          </div>
        )}

         {/* Tab 2: THE SPLIT DESIGN WORKSPACE */}
        {activeTab === "design" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start text-right">
            
            {/* Input fields panel (right side in Arabic view) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">ویرایشگر و پیکربندی کارت</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">تغییرات را به طور زنده در گوشی کناری مشاهده کنید و سپس بر روی دکمه ذخیره کلیک کنید.</p>
                </div>
                <button
                  onClick={handleSaveCard}
                  disabled={saveLoading}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/10 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saveLoading ? "درحال ذخیره..." : "ذخیره تغییرات نهایی"}
                </button>
              </div>

              {feedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold">
                  {feedback}
                </div>
              )}

              {/* Template Theme and visual identity card options */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs text-slate-800">طراحی شخصی و هویت بصری کارت</h3>
                
                {/* 3 Templates choices */}
                <div className="grid grid-cols-3 gap-3">
                  {["modern", "classic", "minimalist"].map(t => (
                    <button
                      key={t}
                      onClick={() => setCardData({
                        ...cardData,
                        design: { ...cardData.design, template: t as any }
                      })}
                      className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition ${
                        cardData.design?.template === t 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850 hover:bg-slate-100"
                      }`}
                    >
                      {t === "modern" ? "مدرن (جدید)" : t === "classic" ? "کلاسیک" : "مینیمال"}
                    </button>
                  ))}
                </div>

                {/* Dark & Light toggle option */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-600">پس‌زمینه تیره کارت (کاربردی در شب) :</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCardData({
                        ...cardData,
                        design: { ...cardData.design, isDark: false }
                      })}
                      className={`py-1.5 px-4 rounded-lg text-xs font-bold ${
                        !cardData.design?.isDark ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-850"
                      }`}
                    >
                      روشن
                    </button>
                    <button
                      onClick={() => setCardData({
                        ...cardData,
                        design: { ...cardData.design, isDark: true }
                      })}
                      className={`py-1.5 px-4 rounded-lg text-xs font-bold ${
                        cardData.design?.isDark ? "bg-slate-800 text-white border border-slate-705" : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-850"
                      }`}
                    >
                      تیره
                    </button>
                  </div>
                </div>

                {/* 18 Swatches for colors selection */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-600 block">تم رنگ پیوندهای کارت و دکمه ها (۱۸ رنگ پیشنهادی) :</span>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS_PRESETS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => setCardData({
                          ...cardData,
                          design: { ...cardData.design, colorTheme: c.hex }
                        })}
                        title={c.name}
                        className="w-full aspect-square rounded-lg border-2 relative transition hover:scale-105"
                        style={{ 
                          backgroundColor: c.hex, 
                          borderColor: cardData.design?.colorTheme === c.hex ? "#334155" : "transparent" 
                        }}
                      >
                        {cardData.design?.colorTheme === c.hex && (
                          <span className="absolute inset-x-0 bottom-1 text-[8px] bg-slate-900/90 text-white font-bold rounded px-1 max-w-[90%] mx-auto truncate text-center">
                            {c.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Basic brand description details */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs text-slate-800">اطلاعات کلی و معرفی برند</h3>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650">نام تجاری یا برند کسب و کار :</label>
                  <input 
                    type="text"
                    placeholder="مثال: فروشگاه نوین سازان"
                    value={cardData.businessName}
                    onChange={(e) => editBasic("businessName", e.target.value.substring(0, 40))}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all"
                  />
                  <span className="text-[9px] text-slate-400 font-bold text-left block">حداکثر ۴۰ کاراکتر ({40 - (cardData.businessName?.length || 0)} باقی مانده)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-650">نام مدیر مجموعه :</label>
                    <input 
                      type="text"
                      placeholder="امیر رضایی"
                      value={cardData.brandManager}
                      onChange={(e) => editBasic("brandManager", e.target.value.substring(0, 30))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all"
                    />
                    <span className="text-[9px] text-slate-400 font-bold text-left block">حداکثر ۳۰ کاراکتر ({30 - (cardData.brandManager?.length || 0)} باقی مانده)</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-650">شعار اصلی تبلیغاتی :</label>
                    <input 
                      type="text"
                      placeholder="کیفیت را ارزان خریداری کنید"
                      value={cardData.slogan}
                      onChange={(e) => editBasic("slogan", e.target.value.substring(0, 50))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all"
                    />
                    <span className="text-[9px] text-slate-400 font-bold text-left block">حداکثر ۵۰ کاراکتر ({50 - (cardData.slogan?.length || 0)} باقی مانده)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650">توضیحات کلی درباره خدمات برند :</label>
                  <textarea 
                    rows={3}
                    placeholder="توضیحات کوتاهی در خصوص مجموعه، گواهینامه ها و نوع فعالیت خود بنویسید..."
                    value={cardData.description}
                    onChange={(e) => editBasic("description", e.target.value.substring(0, 200))}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl p-3 text-xs text-slate-800 outline-none resize-none transition-all"
                  />
                  <span className="text-[9px] text-slate-400 font-bold text-left block">حداکثر ۲۰۰ کاراکتر ({200 - (cardData.description?.length || 0)} باقی مانده)</span>
                </div>

                {/* Drag and drop image upload panel for logo & background banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LOGO Drag & drop */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-650">تصویر لوگو برند :</span>
                    <div 
                      onDragOver={(e) => handleDragOver(e, "logo")}
                      onDragLeave={(e) => handleDragLeave(e, "logo")}
                      onDrop={(e) => handleDrop(e, "logo", (url) => editBasic("logoUrl", url))}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[110px] ${
                        dragActive["logo"] ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <input 
                        type="file"
                        id="logoFileInput"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileInputChange(e, "logo", (url) => editBasic("logoUrl", url))}
                      />
                      <label htmlFor="logoFileInput" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600">درگ و دراپ عکس یا لمس برای انتخاب</span>
                      </label>
                      {uploadProgress["logo"] !== undefined && (
                        <div className="w-full mt-3">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress["logo"]}%` }} />
                          </div>
                          <span className="text-[9px] text-blue-600 mt-1 block font-bold">درحال دانلود و ذخیره‌سازی: {uploadProgress["logo"]}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COVER Drag & drop */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-650">تصویر هدر پس‌زمینه :</span>
                    <div 
                      onDragOver={(e) => handleDragOver(e, "banner")}
                      onDragLeave={(e) => handleDragLeave(e, "banner")}
                      onDrop={(e) => handleDrop(e, "banner", (url) => editBasic("bgImageUrl", url))}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[110px] ${
                        dragActive["banner"] ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <input 
                        type="file"
                        id="bannerFileInput"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileInputChange(e, "banner", (url) => editBasic("bgImageUrl", url))}
                      />
                      <label htmlFor="bannerFileInput" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600">درگ یا کلیک جهت بارگذاری</span>
                      </label>
                      {uploadProgress["banner"] !== undefined && (
                        <div className="w-full mt-3">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress["banner"]}%` }} />
                          </div>
                          <span className="text-[9px] text-blue-600 mt-1 block font-bold">آپلود شد: {uploadProgress["banner"]}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>


              {/* Dynamic Branch Mobile list (max 3) & Fixed telephones (max 2) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800">اطلاعات تماس کسب و کار</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (cardData.phones.length >= 3) return;
                      setCardData({ ...cardData, phones: [...cardData.phones, ""] });
                    }}
                    disabled={cardData.phones.length >= 3}
                    className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-[10px] font-bold flex items-center gap-1 text-white shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    شماره همراه جدید
                  </button>
                </div>

                {/* Phones */}
                <div className="space-y-2.5">
                  {cardData.phones.map((p, idx) => (
                    <div key={`phoneinputs-${idx}`} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold min-w-[60px]">همراه {idx + 1} :</span>
                      <input 
                        type="tel"
                        maxLength={11}
                        placeholder="فرمت: 09123456789"
                        value={p}
                        onChange={(e) => {
                          const copy = [...cardData.phones];
                          copy[idx] = e.target.value.replace(/[^0-9]/g, "");
                          setCardData({ ...cardData, phones: copy });
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-left text-slate-800 font-mono outline-none transition-all"
                      />
                      {idx > 0 && (
                        <button 
                          onClick={() => {
                            const copy = [...cardData.phones];
                            copy.splice(idx, 1);
                            setCardData({ ...cardData, phones: copy });
                          }}
                          className="p-1.5 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 transition-all shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Landlines list (max 2) */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">شماره تلفن های ثابت (حداکثر ۲ شماره) :</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (cardData.landlines.length >= 2) return;
                        setCardData({ ...cardData, landlines: [...cardData.landlines, ""] });
                      }}
                      disabled={cardData.landlines.length >= 2}
                      className="py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-[9px] font-bold flex items-center gap-1 text-slate-705 shadow-xs"
                    >
                      <Plus className="w-3" />
                      تلفن ثابت
                    </button>
                  </div>

                  <div className="space-y-2">
                    {cardData.landlines.map((l, idx) => (
                      <div key={`landlineinputs-${idx}`} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold min-w-[60px]">ثابت {idx + 1} :</span>
                        <input 
                          type="tel"
                          placeholder="مثال: 02188888888"
                          value={l}
                          onChange={(e) => {
                            const copy = [...cardData.landlines];
                            copy[idx] = e.target.value.replace(/[^0-9]/g, "");
                            setCardData({ ...cardData, landlines: copy });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-left text-slate-800 font-mono outline-none transition-all"
                        />
                        <button 
                          onClick={() => {
                            const copy = [...cardData.landlines];
                            copy.splice(idx, 1);
                            setCardData({ ...cardData, landlines: copy });
                          }}
                          className="p-1.5 rounded-lg bg-red-50 border border-red-100 text-red-550 hover:bg-red-100 transition-all shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* branches addresses section and maps links */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800">شعب و آدرس های جغرافیایی</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setCardData({
                        ...cardData,
                        branches: [...cardData.branches, {
                          id: "branch-" + Date.now(),
                          title: "",
                          address: "",
                          googleMaps: "",
                          neshan: "",
                          balad: ""
                        }]
                      });
                    }}
                    className="py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    شعبه جدید
                  </button>
                </div>

                <div className="space-y-4">
                  {cardData.branches.map((b, idx) => (
                    <div key={b.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/85 shadow-sm space-y-3 relative">
                      <button
                        onClick={() => {
                          const copy = [...cardData.branches];
                          copy.splice(idx, 1);
                          setCardData({ ...cardData, branches: copy });
                        }}
                        className="absolute left-3 top-3 text-slate-400 hover:text-red-505 bg-white border border-slate-200 shadow-xs rounded-lg p-1 transition-all"
                        title="حذف این شعبه"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650">نام یا عنوان شعبه :</label>
                        <input 
                          type="text"
                          placeholder="دفتر اقدسیه، کارگاه تولید و..."
                          value={b.title}
                          onChange={(e) => {
                            const copy = [...cardData.branches];
                            copy[idx].title = e.target.value;
                            setCardData({ ...cardData, branches: copy });
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650">آدرس دقیق پستی شعبه :</label>
                        <input 
                          type="text"
                          placeholder="تهران، اقدسیه، خیابان سپند، پلاک هشت"
                          value={b.address}
                          onChange={(e) => {
                            const copy = [...cardData.branches];
                            copy[idx].address = e.target.value;
                            setCardData({ ...cardData, branches: copy });
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                        />
                      </div>

                      {/* Map URLs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500">گوگل مپ URL :</label>
                          <input 
                            type="text"
                            placeholder="https://maps.google.com/..."
                            value={b.googleMaps}
                            onChange={(e) => {
                              const copy = [...cardData.branches];
                              copy[idx].googleMaps = e.target.value;
                              setCardData({ ...cardData, branches: copy });
                            }}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2 text-[10px] text-left font-mono outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500">روتر نقشه نشان URL :</label>
                          <input 
                            type="text"
                            placeholder="https://neshan.org/..."
                            value={b.neshan}
                            onChange={(e) => {
                              const copy = [...cardData.branches];
                              copy[idx].neshan = e.target.value;
                              setCardData({ ...cardData, branches: copy });
                            }}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2 text-[10px] text-left font-mono outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500">روتر نقشه بلد URL :</label>
                          <input 
                            type="text"
                            placeholder="https://balad.ir/..."
                            value={b.balad}
                            onChange={(e) => {
                              const copy = [...cardData.branches];
                              copy[idx].balad = e.target.value;
                              setCardData({ ...cardData, branches: copy });
                            }}
                            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2 text-[10px] text-left font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Channels lists */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs text-slate-800">شبکه های اجتماعی و لینک سایت</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-600 font-bold min-w-[100px]">آدرس وب‌سایت :</span>
                    <input 
                      type="text" 
                      placeholder="https://example.com"
                      value={cardData.website}
                      onChange={(e) => editBasic("website", e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-left font-mono text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {Object.keys(cardData.socials || {}).map((soc) => (
                    <div key={soc} className="flex gap-2 items-center">
                      <span className="text-xs text-slate-600 font-bold min-w-[100px] capitalize">{soc === "instagram" ? "اینستاگرام" : soc === "telegram" ? "تلگرام" : soc === "whatsapp" ? "واتساپ" : soc === "youtube" ? "یوتیوب" : soc === "aparat" ? "آپارات" : soc === "bale" ? "بله" : soc === "rubika" ? "روبیکا" : "سروش"} :</span>
                      <input 
                        type="text" 
                        placeholder={`لینک شبکه اجتماعی ${soc}`}
                        value={(cardData.socials as any)[soc] || ""}
                        onChange={(e) => editSocial(soc, e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-left font-mono text-slate-800 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* PRODUCTS Manager (max 5) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800">مدیریت محصولات یا خدمات (حداکثر ۵ مورد)</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (cardData.products.length >= 5) return;
                      setCardData({
                        ...cardData,
                        products: [...cardData.products, {
                          id: "prod-" + Date.now(),
                          title: "",
                          description: "",
                          price: "",
                          link: "",
                          imageUrl: ""
                        }]
                      });
                    }}
                    disabled={cardData.products.length >= 5}
                    className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن محصول
                  </button>
                </div>

                <div className="space-y-4">
                  {cardData.products.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 shadow-xs space-y-3 relative">
                      <button
                        onClick={() => {
                          const copy = [...cardData.products];
                          copy.splice(idx, 1);
                          setCardData({ ...cardData, products: copy });
                        }}
                        className="absolute left-3 top-3 text-slate-400 hover:text-red-500 bg-white border border-slate-200 shadow-xs rounded-lg p-1 transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650">نام کالا یا خدمت :</label>
                          <input 
                            type="text"
                            placeholder="کارت ویزیت فلزی"
                            value={p.title}
                            onChange={(e) => {
                              const copy = [...cardData.products];
                              copy[idx].title = e.target.value.substring(0, 35);
                              setCardData({ ...cardData, products: copy });
                            }}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650">قیمت (تومان / ريال) :</label>
                          <input 
                            type="text"
                            placeholder="450,000 تومان یا توافقی"
                            value={p.price}
                            onChange={(e) => {
                              const copy = [...cardData.products];
                              copy[idx].price = e.target.value;
                              setCardData({ ...cardData, products: copy });
                            }}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650">توضیح کوتاه کالا :</label>
                        <input 
                          type="text"
                          placeholder="توضیح کوتاهی از مشخصات فنی یا عمومی کالا..."
                          value={p.description}
                          onChange={(e) => {
                            const copy = [...cardData.products];
                            copy[idx].description = e.target.value.substring(0, 100);
                            setCardData({ ...cardData, products: copy });
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650">لینک دکمه خرید اختصاصی :</label>
                          <input 
                            type="text"
                            placeholder="https://myshop.com/product/..."
                            value={p.link}
                            onChange={(e) => {
                              const copy = [...cardData.products];
                              copy[idx].link = e.target.value;
                              setCardData({ ...cardData, products: copy });
                            }}
                            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg py-1.5 px-3 text-xs text-slate-800 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-650">عکس محصول (لمس یا کپی) :</span>
                          <div 
                            onDragOver={(e) => handleDragOver(e, `prod-${p.id}`)}
                            onDragLeave={(e) => handleDragLeave(e, `prod-${p.id}`)}
                            onDrop={(e) => handleDrop(e, `prod-${p.id}`, (url) => {
                              const copy = [...cardData.products];
                              copy[idx].imageUrl = url;
                              setCardData({ ...cardData, products: copy });
                            })}
                            className={`border border-dashed rounded-lg p-2 text-center text-[10px] flex items-center justify-center cursor-pointer min-h-[46px] ${
                              dragActive[`prod-${p.id}`] ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <input 
                              type="file"
                              id={`prodFileInput-${p.id}`}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileInputChange(e, `prod-${p.id}`, (url) => {
                                const copy = [...cardData.products];
                                copy[idx].imageUrl = url;
                                setCardData({ ...cardData, products: copy });
                              })}
                            />
                            <label htmlFor={`prodFileInput-${p.id}`} className="cursor-pointer flex items-center gap-1.5 text-slate-500 font-semibold">
                              <UploadCloud className="w-4 h-4 text-slate-400" />
                              <span>انتخاب یا درگ عکس</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IMAGE GALLERY Manager */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-800">گالری تصاویر متحرک اسلایدر (حداکثر ۵ تصویر)</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (cardData.gallery.length >= 5) return;
                      setCardData({
                        ...cardData,
                        gallery: [...cardData.gallery, ""]
                      });
                    }}
                    disabled={cardData.gallery.length >= 5}
                    className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-[10px] font-bold rounded text-white flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن تصویر
                  </button>
                </div>

                <div className="space-y-4">
                  {cardData.gallery.map((imgUrl, idx) => (
                    <div key={`gal-${idx}`} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4 relative shadow-xs">
                      <button
                        onClick={() => {
                          const copy = [...cardData.gallery];
                          copy.splice(idx, 1);
                          setCardData({ ...cardData, gallery: copy });
                        }}
                        className="absolute left-3 top-3 text-slate-400 hover:text-red-500 bg-white border border-slate-200 shadow-xs rounded-lg p-1 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="w-16 h-12 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover" /> : <div className="text-[9px] text-slate-500 text-center my-4">بدون عکسه</div>}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-650">بارگذاری تصویر {idx + 1} (در قالب ۱۶:۹) :</span>
                        <div 
                          onDragOver={(e) => handleDragOver(e, `gal-${idx}`)}
                          onDragLeave={(e) => handleDragLeave(e, `gal-${idx}`)}
                          onDrop={(e) => handleDrop(e, `gal-${idx}`, (url) => {
                            const copy = [...cardData.gallery];
                            copy[idx] = url;
                            setCardData({ ...cardData, gallery: copy });
                          })}
                          className={`border border-dashed rounded-lg p-2 text-center text-[10px] flex items-center justify-center cursor-pointer ${
                            dragActive[`gal-${idx}`] ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <input 
                            type="file"
                            id={`galFileInput-${idx}`}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileInputChange(e, `gal-${idx}`, (url) => {
                              const copy = [...cardData.gallery];
                              copy[idx] = url;
                              setCardData({ ...cardData, gallery: copy });
                            })}
                          />
                          <label htmlFor={`galFileInput-${idx}`} className="cursor-pointer flex items-center gap-1.5 text-slate-500 font-semibold">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>عکس ویزیت رومیزی را بکشید یا برای انتخاب لمس کنید</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WORKING HOURS Calendars */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs text-slate-800">تقویم کاری و ساعت فعالیت هفتگی</h3>
                
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map(day => {
                    const sched = cardData.workingDays?.[day] || { isOpen: false, openTime: "08:00", closeTime: "17:00", isClosed: true };
                    return (
                      <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
                        <span className="font-bold text-slate-700 min-w-[70px]">{day} :</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = { ...cardData.workingDays };
                              copy[day] = { ...sched, isOpen: true, isClosed: false };
                              setCardData({ ...cardData, workingDays: copy });
                            }}
                            className={`py-1 px-3.5 rounded font-bold text-[10px] transition shadow-xs ${
                              sched.isOpen && !sched.isClosed ? "bg-emerald-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            باز
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = { ...cardData.workingDays };
                              copy[day] = { ...sched, isOpen: false, isClosed: true };
                              setCardData({ ...cardData, workingDays: copy });
                            }}
                            className={`py-1 px-3.5 rounded font-bold text-[10px] transition shadow-xs ${
                              sched.isClosed ? "bg-red-500 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            تعطیل
                          </button>
                        </div>

                        {sched.isOpen && !sched.isClosed && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono font-bold">
                            <input 
                              type="text" 
                              value={sched.openTime}
                              onChange={(e) => {
                                const copy = { ...cardData.workingDays };
                                copy[day] = { ...sched, openTime: e.target.value };
                                setCardData({ ...cardData, workingDays: copy });
                              }}
                              className="w-14 bg-white hover:border-slate-350 text-center rounded py-0.5 border border-slate-200 text-xs text-slate-800"
                            />
                            <span className="text-[10px]">الی</span>
                            <input 
                              type="text" 
                              value={sched.closeTime}
                              onChange={(e) => {
                                const copy = { ...cardData.workingDays };
                                copy[day] = { ...sched, closeTime: e.target.value };
                                setCardData({ ...cardData, workingDays: copy });
                              }}
                              className="w-14 bg-white hover:border-slate-350 text-center rounded py-0.5 border border-slate-200 text-xs text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary save settings */}
              <div className="flex items-center justify-between mt-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-600 font-bold">ذخیره نهایی ویرایش ها :</span>
                <button
                  onClick={handleSaveCard}
                  disabled={saveLoading}
                  className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {saveLoading ? "درحال ذخیره‌سازی..." : "ثبت و تایید اطلاعات کارت"}
                </button>
              </div>
            </div>

            {/* Simulated Live iPhone mockup (left side in Arabic View) */}
            <div className="xl:sticky xl:top-6 bg-slate-100 p-6 rounded-[40px] border border-slate-200/80 flex items-center justify-center shadow-inner">
              <IPhoneMockup data={cardData} username={user.username} />
            </div>
          </div>
        )}

        {/* Tab 3: QR CODE GENERATOR SECTION */}
        {activeTab === "qrcode" && (
          <div className="space-y-8 text-right max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-slate-900">کیوآرکد و بارکد اختصاصی راهنما</h2>
              <p className="text-xs text-slate-500 mt-1">با بارگذاری این کد در بنرها، کاتالوگ ها و کارت فیزیکی خود، مشتریان را به آدرس الکترونیکی خود متصل کنید.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 md:p-8 rounded-[30px] border border-slate-200 shadow-sm">
              
              {/* Box 1: QR Image layout */}
              <div className="flex flex-col items-center justify-center space-y-4">
                {user.qrRequestStatus === "approved" && user.qrImageUrl ? (
                  <div className="p-4 bg-white rounded-3xl shadow-2xl relative inline-block border border-slate-100">
                    <img 
                      src={user.qrImageUrl} 
                      alt="کیوآرکد اختصاصی" 
                      className="w-52 h-52 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-4 text-center">
                      <span className="bg-slate-900 text-white font-mono text-[9px] px-2 py-0.5 rounded-full">Approved QR Code</span>
                    </div>
                  </div>
                ) : user.qrRequestStatus === "pending" ? (
                  <div className="w-52 h-52 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-3 shadow-inner">
                    <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                    <h4 className="font-extrabold text-xs text-amber-600">در انتظار آپلود کیوآرکد رسمی</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      درخواست شما با موفقیت به مدیریت ارسال شد. ادمین به زودی عکس با کیفیت کیوآرکد چاپی کارت شما را طراحی و در این محل بارگذاری خواهد کرد.
                    </p>
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-inner">
                    <Info className="w-10 h-10 text-blue-600" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">کارت فیزیکی یا کیوآرکد چاپی ندارید؟</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">
                        شما می توانید با دکمه روبرو، درخواست دریافت تصویر کیوآرکد رسمی و فیزیکی خود را به پورتال مدیریت بفرستید تا برای شما طراحی شود.
                      </p>
                    </div>
                    <button
                      onClick={handleRequestQrCode}
                      className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] transition shadow cursor-pointer"
                    >
                      ثبت درخواست فعالسازی تصویر کیوآرکد
                    </button>
                  </div>
                )}
              </div>

              {/* Box 2: Actions copy links & download */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600 block">لینک دائم کارت ویزیت دیجیتال شما :</span>
                  <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-blue-600 font-mono font-semibold flex-1 select-all overflow-x-auto truncate text-left pt-1">
                      {`${window.location.origin}/card/${user.username}`}
                    </span>
                    <button 
                      onClick={() => handleCopyLink(`${window.location.origin}/card/${user.username}`)}
                      className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                    >
                      کپی
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 space-y-2 text-xs leading-relaxed text-slate-600">
                  <p className="font-bold flex items-center gap-1.5 text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    نکات مهم نصب بارکد راهنما :
                  </p>
                  <p>• این کیوآرکد را دانلود کرده و روی کارت های ویزیت چاپ کنید.</p>
                  <p>• در صورت تعلیق حساب توسط مدیریت، بازدید با این کد غیرفعال خواهد شد.</p>
                  <p>• با تغییر آدرس، کارت به طور زنده روی همین آدرس دائم بروز می شود.</p>
                </div>

                {user.qrRequestStatus === "approved" && user.qrImageUrl && (
                  <a 
                    href={user.qrImageUrl} 
                    download={`QR_${user.username}.png`}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4.5 h-4.5" />
                    دانلود کیوآرکد به صورت PNG با کیفیت عالی جهت چاپ
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: TICKET SYSTEM */}
        {activeTab === "tickets" && (
          <div className="space-y-8 text-right max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">تیکت های پشتیبانی و ارتباط با مدیریت</h2>
                <p className="text-xs text-slate-500 mt-1">سوالات، پیشنهادات یا مشکلات خود را در قالب پیام ثبت کنید. کارشناسان ما به زودی پاسخ خواهند داد.</p>
              </div>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                ایجاد تیکت پشتیبانی جدید
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Tickets list */}
              <div className="md:col-span-1 space-y-3">
                <span className="text-xs font-extrabold text-slate-650 block pr-1 leading-relaxed">تیکت های جاری شما :</span>
                {tickets.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs text-wrap leading-relaxed shadow-sm">
                    تاکنون هیچ تیکت یا درخواستی ثبت نکرده‌اید.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pl-1">
                    {tickets.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicket(t)}
                        className={`w-full p-4 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                          activeTicket?.id === t.id 
                            ? "bg-blue-50 border-blue-200 text-blue-900 font-bold" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-extrabold text-xs line-clamp-1 ${activeTicket?.id === t.id ? "text-blue-900" : "text-slate-800"}`}>{t.title}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === "read" ? "bg-amber-100 text-amber-700" :
                            t.status === "under_review" ? "bg-blue-105 bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {t.status === "read" ? "خوانده شد" :
                             t.status === "under_review" ? "در حال بررسی" :
                             "پایان چت با کاربر"}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75 mt-2.5 font-mono text-left w-full">{t.createdAt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat View Container */}
              <div className="md:col-span-2 bg-white border border-slate-200/85 rounded-2xl p-6 min-h-[400px] flex flex-col justify-between shadow-sm">
                {activeTicket ? (
                  <div className="flex flex-col justify-between h-[420px]">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{activeTicket.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">شناسه تیکت: {activeTicket.id}</p>
                      </div>
                      <span className={`text-xs font-bold ${activeTicket.status === 'ended' ? "text-red-500" : "text-emerald-600"}`}>
                        {activeTicket.status === "ended" ? "🔴 خاتمه یافته" : "🟢 مکالمه فعال است"}
                      </span>
                    </div>
 
                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2 my-2 scrollbar-none">
                      {activeTicket.messages.map(m => (
                        <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                            m.sender === "user" 
                              ? "bg-blue-600 text-white rounded-br-none shadow-sm" 
                              : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200 shadow-xs"
                          }`}>
                            <p>{m.message}</p>
                            <span className="block text-[8px] opacity-60 mt-1.5 font-mono text-left">{m.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat reply form if active */}
                    {activeTicket.status !== "ended" ? (
                      <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-100 pt-3 mt-1">
                        <input 
                          type="text"
                          placeholder="پاسخ خود را برای پشتیبانی بنویسید..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl py-3 px-4 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                        />
                        <button 
                          type="submit" 
                          className="py-3 px-6 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                        >
                          ارسال پیام
                        </button>
                      </form>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-100 text-center rounded-xl text-xs text-red-500 font-bold shadow-xs">
                        اين تیکت توسط پشتیبانی فینگر ریدر پایان یافته و چت ثانویه در آن مسدود است.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-10 space-y-2">
                    <MessageSquare className="w-12 h-12 text-slate-300 font-bold" />
                    <h4 className="font-extrabold text-xs text-slate-500">گفتگویی انتخاب نشده است</h4>
                    <p className="text-[10px] text-slate-500">جهت شروع چت، از منوی سمت راست یک تیکت را برگزینید یا تیکت جدید ارسال نمایید.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. TICKET CREATION MODAL */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 text-right space-y-4 animate-scaleUp">
            <h3 className="font-extrabold text-base text-slate-900 border-r-4 border-blue-600 pr-2">ثبت و ارسال تیکت جدید به پشتیبانی</h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650">موضوع یا عنوان تیکت :</label>
                <input 
                  type="text"
                  placeholder="مثال: سوال در مورد چاپ کارت فیزیکی"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl py-2.5 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650">جزییات و شرح تیکت :</label>
                <textarea 
                  rows={4}
                  placeholder="مشخصات و سوال خود را کامل شرح دهید..."
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs text-slate-800 outline-none resize-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  ارسال تیکت به سرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
