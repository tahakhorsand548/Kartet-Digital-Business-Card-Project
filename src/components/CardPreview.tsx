import React, { useState, useEffect } from "react";
import { 
  Phone, Globe, MapPin, MessageSquare, Clock, ArrowLeft, ArrowRight,
  Instagram, Send, CreditCard, Play, Youtube, CheckCircle2, AlertCircle
} from "lucide-react";
import { CardData } from "../types";
import { apiFetch } from "../utils/api";

interface CardPreviewProps {
  data: CardData;
  username: string;
  isPreview?: boolean;
}

export default function CardPreview({ data, username, isPreview = false }: CardPreviewProps) {
  const {
    businessName,
    brandManager,
    slogan,
    description,
    logoUrl,
    bgImageUrl,
    phones,
    landlines,
    branches,
    website,
    socials,
    gallery,
    products,
    workingDays,
    design
  } = data;

  const themeHex = design?.colorTheme || "#3B82F6";
  const isDark = design?.isDark ?? false;

  // Gallery Sliders State
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [activeProductIdx, setActiveProductIdx] = useState(0);

  // Auto Scroll Gallery every 3 seconds
  useEffect(() => {
    if (gallery && gallery.length > 1) {
      const interval = setInterval(() => {
        setActiveGalleryIdx((prev) => (prev + 1) % gallery.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [gallery]);

  // Auto Scroll Products every 3 seconds
  useEffect(() => {
    if (products && products.length > 1) {
      const interval = setInterval(() => {
        setActiveProductIdx((prev) => (prev + 1) % products.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [products]);

  // Click Tracker for Live Cards
  const handleInteraction = async (type: string, url?: string) => {
    if (isPreview) return; // ignore in edit view
    try {
      await apiFetch(`/api/card/${username}/click`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    if (url) {
      window.open(url, "_blank");
    }
  };

  const getDayStatus = () => {
    const daysWeek = ["جمعه", "شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه"];
    const todayStr = daysWeek[new Date().getDay()];
    const todaySchedule = workingDays?.[todayStr];
    if (!todaySchedule || !todaySchedule.isOpen || todaySchedule.isClosed) {
      return { text: "امروز تعطیل است", color: "text-red-500" };
    }
    return { text: `باز است (ساعت کاری: ${todaySchedule.openTime} الی ${todaySchedule.closeTime})`, color: "text-emerald-500" };
  };

  const dayStatus = getDayStatus();

  return (
    <div 
      className={`w-full min-h-screen font-sans transition-colors duration-300 card-preview-scope template-${design?.template || "modern"} ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"
      }`}
      style={{ direction: "rtl" }}
    >
      {/* 1. Brand Banner Header */}
      <div className="relative w-full h-44 bg-slate-800 overflow-hidden">
        {bgImageUrl ? (
          <img 
            src={bgImageUrl} 
            alt="برند" 
            className="w-full h-full object-cover opacity-85 transition-transform duration-500 hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-slate-500 text-sm">بدون تصویر پس‌زمینه</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* 2. Brand Identity Block */}
      <div className="px-6 -mt-16 relative z-10 text-center pb-4">
        <div className="inline-block relative">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border-4 border-slate-950 shadow-xl mx-auto flex items-center justify-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="لوگو" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-3xl font-bold text-white flex items-center justify-center">
                {businessName ? businessName.charAt(0) : "B"}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold mt-3 tracking-tight">
          {businessName || "نام کسب و کار شما"}
        </h1>
        {brandManager && (
          <p className="text-sm font-medium opacity-65 mt-1">
            با مدیریت {brandManager}
          </p>
        )}
        {slogan && (
          <p 
            className="text-sm font-semibold tracking-wide mt-2 inline-block px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: themeHex }}
          >
            {slogan}
          </p>
        )}
        {description && (
          <p className="text-sm leading-relaxed mt-4 max-w-sm mx-auto opacity-80 px-2 line-clamp-4">
            {description}
          </p>
        )}
      </div>

      <hr className={`mx-6 my-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />

      {/* 3. Interactive Quick Call & Links */}
      <div className="px-6 space-y-3">
        {/* Web Link */}
        {website && (
          <button 
            onClick={() => handleInteraction("website", website)}
            className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between shadow-md transition-all text-white scale-98 active:scale-95"
            style={{ backgroundColor: themeHex }}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>وب سایت رسمی برند</span>
            </div>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Phones List */}
        {phones && phones.length > 0 && phones.map((p, idx) => (
          p && (
            <button 
              key={`phone-${idx}`}
              onClick={() => handleInteraction("phone", `tel:${p}`)}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-between transition-all border ${
                isDark 
                  ? "bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-white" 
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-500" />
                <span>تماس مستقیم {idx === 0 ? "" : `(${idx + 1})`}</span>
              </div>
              <span className="font-mono text-sm tracking-widest">{p}</span>
            </button>
          )
        ))}

        {/* Fixed Landlines */}
        {landlines && landlines.length > 0 && landlines.map((l, idx) => (
          l && (
            <button 
              key={`landline-${idx}`}
              onClick={() => handleInteraction("landline", `tel:${l}`)}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-between transition-all border ${
                isDark 
                  ? "bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-white" 
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-slate-400" />
                <span>شماره تماس ثابت {idx === 0 ? "" : `(${idx + 1})`}</span>
              </div>
              <span className="font-mono text-sm tracking-widest">{l}</span>
            </button>
          )
        ))}
      </div>

      {/* 4. Branch Branches & Navigation Map Links */}
      {branches && branches.length > 0 && (
        <div className="px-6 mt-6 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: themeHex }}></span>
            شعب و آدرس های حضوری
          </h3>
          {branches.map((b, idx) => (
            <div 
              key={`branch-${idx}`} 
              className={`p-4 rounded-xl border ${
                isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
              }`}
            >
              <h4 className="font-bold text-sm text-slate-200" style={{ color: isDark ? "#f1f5f9" : "#334155" }}>
                📍 {b.title || "شعبه اصلی"}
              </h4>
              <p className="text-xs leading-relaxed opacity-75 mt-1.5">
                {b.address || "آدرس ثبت نشده است"}
              </p>

              {/* Map Router buttons if they exist */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {b.googleMaps && (
                  <button 
                    onClick={() => handleInteraction("googleMaps", b.googleMaps)}
                    className="py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition bg-[#4285F4]/10 text-[#4285F4] border border-[#4285F4]/20 hover:bg-[#4285F4]/20"
                  >
                    <span className="text-xs font-mono">Google Maps</span>
                  </button>
                )}
                {b.neshan && (
                  <button 
                    onClick={() => handleInteraction("neshan", b.neshan)}
                    className="py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                  >
                    <span>نقشه نشان</span>
                  </button>
                )}
                {b.balad && (
                  <button 
                    onClick={() => handleInteraction("balad", b.balad)}
                    className="py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20"
                  >
                    <span>نقشه بلد</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Image Slide Gallery (Max 5 images, slides auto or manual dot clicks) */}
      {gallery && gallery.length > 0 && (
        <div className="px-6 mt-6 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: themeHex }}></span>
            گالری تصاویر برند
          </h3>

          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 group shadow-lg">
            <img 
              src={gallery[activeGalleryIdx]} 
              alt={`گالری ${activeGalleryIdx + 1}`} 
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              referrerPolicy="no-referrer"
            />
            
            {/* Gallery Navigation Overlay buttons */}
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setActiveGalleryIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-black/90"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveGalleryIdx((prev) => (prev + 1) % gallery.length)}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-black/90"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Slider Dots indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {gallery.map((_, idx) => (
                <button 
                  key={`dot-${idx}`}
                  onClick={() => setActiveGalleryIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeGalleryIdx ? "w-4" : "w-1.5"
                  }`}
                  style={{ backgroundColor: idx === activeGalleryIdx ? themeHex : "rgba(255,255,255,0.4)" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Products Scroll Carousel Slider */}
      {products && products.length > 0 && (
        <div className="px-6 mt-6 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: themeHex }}></span>
            محصولات و خدمات
          </h3>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-800/10">
            <div className={`p-4 ${isDark ? "bg-slate-800/60" : "bg-slate-50"} flex flex-col justify-between aspect-[1.1]`}>
              <div className="aspect-[1.8] w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-700/15">
                {products[activeProductIdx]?.imageUrl ? (
                  <img 
                    src={products[activeProductIdx].imageUrl} 
                    alt={products[activeProductIdx].title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-850 flex items-center justify-center text-slate-600 text-xs text-center">بغیر تصویر</div>
                )}
              </div>

              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-sm">{products[activeProductIdx]?.title}</h4>
                  <p className="text-xs opacity-75 mt-1 line-clamp-2">{products[activeProductIdx]?.description}</p>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-700/15 pt-2">
                  <span className="text-xs font-black tracking-wide" style={{ color: themeHex }}>
                    {products[activeProductIdx]?.price || "توافقی"}
                  </span>
                  
                  {products[activeProductIdx]?.link && (
                    <button 
                      onClick={() => handleInteraction("product", products[activeProductIdx].link)}
                      className="py-1 px-3 rounded-lg text-[10px] font-bold text-white transition hover:brightness-110 flex items-center gap-1"
                      style={{ backgroundColor: themeHex }}
                    >
                      <span>خرید و جزییات</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Slider Dots indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {products.map((_, idx) => (
                <button 
                  key={`pdot-${idx}`}
                  onClick={() => setActiveProductIdx(idx)}
                  className={`h-1 rounded-full transition-all ${
                    idx === activeProductIdx ? "w-3" : "w-1"
                  }`}
                  style={{ backgroundColor: idx === activeProductIdx ? themeHex : "rgba(255,255,255,0.3)" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Working Hours Calendar section */}
      {workingDays && (
        <div className="px-6 mt-6 space-y-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: themeHex }}></span>
            ساعات کاری و فعالیت
          </h3>

          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
          }`}>
            <div className="flex items-center gap-2 font-bold mb-3">
              <Clock className="w-4 h-4 text-[#3B82F6]" style={{ color: themeHex }} />
              <span className={dayStatus.color}>{dayStatus.text}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-slate-300">
              {Object.entries(workingDays).map(([day, val]) => (
                <div key={day} className="flex justify-between items-center pl-4 border-r border-slate-700/10 pr-2">
                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{day} :</span>
                  <span className={`font-mono font-medium ${val.isOpen && !val.isClosed ? "text-emerald-500" : "text-red-400"}`}>
                    {val.isOpen && !val.isClosed ? `${val.openTime} تا ${val.closeTime}` : "تعطیل"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Web & Social Media Section */}
      <div className="px-6 py-6 mt-4 pb-12">
        <h3 className="text-base font-bold flex items-center gap-2 mb-4">
          <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: themeHex }}></span>
          شبکه های اجتماعی ما
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          {Object.entries(socials || {}).map(([key, val]) => {
            if (!val) return null;
            let iconComp = <Globe className="w-5 h-5" />;
            let title = key;
            let themeBg = "bg-slate-800";

            if (key === "instagram") {
              iconComp = <Instagram className="w-5 h-5 text-pink-500" />;
              title = "اینستاگرام";
              themeBg = "bg-pink-500/10";
            } else if (key === "telegram") {
              iconComp = <Send className="w-5 h-5 text-sky-400 -rotate-45" />;
              title = "تلگرام";
              themeBg = "bg-sky-400/10";
            } else if (key === "whatsapp") {
              iconComp = <Phone className="w-5 h-5 text-green-500" />;
              title = "واتساپ";
              themeBg = "bg-green-500/10";
            } else if (key === "youtube") {
              iconComp = <Youtube className="w-5 h-5 text-red-500" />;
              title = "یوتیوب";
              themeBg = "bg-red-500/10";
            } else if (key === "aparat") {
              iconComp = <Play className="w-5 h-5 text-rose-500" />;
              title = "آپارات";
              themeBg = "bg-rose-500/10";
            } else if (key === "bale") {
              iconComp = <MessageSquare className="w-5 h-5 text-[#2E86DE]" />;
              title = "بله";
              themeBg = "bg-blue-500/10";
            } else if (key === "rubika") {
              iconComp = <CheckCircle2 className="w-5 h-5 text-amber-500" />;
              title = "روبیکا";
              themeBg = "bg-amber-500/10";
            } else if (key === "soroush") {
              iconComp = <AlertCircle className="w-5 h-5 text-indigo-400" />;
              title = "سروش";
              themeBg = "bg-indigo-500/10";
            }

            return (
              <button
                key={key}
                onClick={() => handleInteraction(key, val)}
                className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl hover:scale-105 active:scale-95 transition-all border border-slate-700/10 ${themeBg}`}
              >
                {iconComp}
                <span className="text-[9px] font-bold opacity-80">{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template-specific Aesthetic Adjustments */}
      {design?.template === "classic" && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
          
          .template-classic {
            font-family: 'Playfair Display', 'Georgia', serif !important;
            background-color: ${isDark ? "#0f111a" : "#faf6f0"} !important;
            color: ${isDark ? "#eae0cc" : "#2d2012"} !important;
          }
          .template-classic h1, 
          .template-classic h2, 
          .template-classic h3, 
          .template-classic h4 {
            font-family: 'Cinzel', 'Playfair Display', serif !important;
            color: ${isDark ? "#dfb841" : "#997316"} !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            font-weight: 850 !important;
          }
          .template-classic button, 
          .template-classic .rounded-xl, 
          .template-classic .rounded-2xl,
          .template-classic .rounded-[24px] {
            border-radius: 4px !important;
            border: 3px double ${isDark ? "#dfb841" : "#997316"} !important;
            font-family: 'Cinzel', 'Playfair Display', serif !important;
            background-color: ${isDark ? "#161926" : "#ffffff"} !important;
            color: ${isDark ? "#eae0cc" : "#2d2012"} !important;
            box-shadow: none !important;
          }
          .template-classic hr {
            border: none !important;
            height: 3px !important;
            background: repeating-linear-gradient(90deg, transparent, transparent 4px, ${isDark ? "#dfb841" : "#997316"} 4px, ${isDark ? "#dfb841" : "#997316"} 8px) !important;
            margin: 20px 0 !important;
          }
        `}} />
      )}
      {design?.template === "minimalist" && (
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap');
          
          .template-minimalist {
            font-family: 'Space Grotesk', 'Inter', sans-serif !important;
            background-color: ${isDark ? "#080808" : "#fafafa"} !important;
            color: ${isDark ? "#eeeeee" : "#111111"} !important;
            font-weight: 300 !important;
          }
          .template-minimalist h1, 
          .template-minimalist h2, 
          .template-minimalist h3, 
          .template-minimalist h4 {
            font-weight: 600 !important;
            letter-spacing: -0.04em !important;
            color: ${isDark ? "#ffffff" : "#000000"} !important;
            font-family: 'Space Grotesk', sans-serif !important;
          }
          .template-minimalist .shadow-lg, 
          .template-minimalist .shadow-xl, 
          .template-minimalist .shadow-md,
          .template-minimalist .shadow-sm { 
            box-shadow: none !important; 
          }
          .template-minimalist button, 
          .template-minimalist .rounded-xl, 
          .template-minimalist .rounded-2xl {
            border-radius: 0px !important;
            border: 1px solid ${isDark ? "#2a2a2a" : "#e5e7eb"} !important;
            background-color: ${isDark ? "#0e0e0e" : "#ffffff"} !important;
            color: ${isDark ? "#dddddd" : "#333333"} !important;
          }
        `}} />
      )}
    </div>
  );
}
