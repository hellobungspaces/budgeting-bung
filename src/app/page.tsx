"use client";
import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";

export default function Home() {
  const [currentDate, setCurrentDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Result View Tabs
  const [resultTab, setResultTab] = useState<"microAsset" | "vibe" | "digital">("microAsset");

  // Story Template Choice (1 to 5)
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);

  // Wizard Flow State (Total 10 Steps: 1 for Name + 9 for Budgeting)
  const [wizardStep, setWizardStep] = useState(1);
  const [answers, setAnswers] = useState({
    userName: "",
    hasCoffee: true,
    coffeePerWeek: "",
    coffeePrice: "",
    hasCigs: false,
    cigsPerDay: "",
    cigsPrice: "",
    hasEatOut: true,
    eatOutPerWeek: "",
    eatOutPrice: "",
    hangoutBudget: "",
    subsBudget: "",
    aiSubsIncluded: true,
    impulseBudget: "",
    commuteType: "public",
    publicMonthly: "",
    fuelMonthly: "",
    billsMonthly: "",
    charityMonthly: "",
    monthlyIncome: "",
  });

  const [showStoryModal, setShowStoryModal] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const date = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDate(date);
  }, []);

  const triggerFeedback = (type: "tap" | "success" | "error" = "tap") => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(type === "error" ? [60, 40, 60] : type === "success" ? [30, 50, 30] : 20);
    }
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      } else if (type === "error") {
        osc.frequency.setValueAtTime(180, ctx.currentTime);
      } else {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === "success" ? 0.25 : 0.06));
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (type === "success" ? 0.25 : 0.06));
    } catch (e) {}
  };

  const handleNumericChange = (field: string, val: string, maxLimit = 100000000) => {
    setErrorMsg("");
    const clean = val.replace(/[^0-9]/g, "");
    if (!clean) {
      setAnswers({ ...answers, [field]: "" });
      return;
    }
    const num = parseInt(clean, 10);
    if (num > maxLimit) return;
    setAnswers({ ...answers, [field]: num.toString() });
  };

  const parseNumber = (formattedStr: any) => {
    if (!formattedStr) return 0;
    const clean = String(formattedStr).replace(/[^0-9]/g, "");
    return clean ? Number(clean) : 0;
  };

  const handleNextStep = (nextStepTarget: number, hasItem: boolean, countVal: string, priceVal: string) => {
    if (hasItem) {
      if (parseNumber(countVal) <= 0) {
        setErrorMsg("Frekuensi minimal 1 ya bro! Atau pilih Tidak Pernah / Jarang.");
        triggerFeedback("error");
        return;
      }
      if (parseNumber(priceVal) <= 0) {
        setErrorMsg("Estimasi harga tidak boleh kosong!");
        triggerFeedback("error");
        return;
      }
    }
    setErrorMsg("");
    setWizardStep(nextStepTarget);
    triggerFeedback("tap");
  };

  const formatNumberInput = (val: string) => {
    if (!val) return "";
    const clean = String(val).replace(/[^0-9]/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("id-ID");
  };

  const handleExportAction = async (actionType: "download" | "share") => {
    if (!storyRef.current) return;
    setIsExporting(true);
    triggerFeedback("success");
    
    const templateBgColors: Record<number, string> = {
      1: "#ff6600",
      2: "#09090b",
      3: "#ffffff",
      4: "#064e3b",
      5: "#1e3a8a",
    };

    try {
      const dataUrl = await toPng(storyRef.current, {
        backgroundColor: templateBgColors[selectedTemplate] || "#ff6600",
        pixelRatio: 3,
        style: { display: "block" }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Budgeting-BUNG-${Date.now()}.png`, { type: "image/png" });

      if (actionType === "share" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Budgeting BUNG! Ecosystem",
          text: `Cek breakdown Vibe-Based Budgeting ${answers.userName} di Budgeting BUNG!`,
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Budgeting-BUNG-${Date.now()}.png`;
        link.click();
      }
      setShowStoryModal(false);
    } catch (error) {
      console.error("Export/Share failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const coffeeYearly = answers.hasCoffee ? parseNumber(answers.coffeePerWeek) * parseNumber(answers.coffeePrice) * 52 : 0;
  const cigsYearly = answers.hasCigs ? parseNumber(answers.cigsPerDay) * parseNumber(answers.cigsPrice) * 365 : 0;
  const eatOutYearly = answers.hasEatOut ? parseNumber(answers.eatOutPerWeek) * parseNumber(answers.eatOutPrice) * 52 : 0;
  const hangoutYearly = parseNumber(answers.hangoutBudget) * 52;
  const subsYearly = parseNumber(answers.subsBudget) * 12;
  const impulseYearly = parseNumber(answers.impulseBudget) * 12;
  const transportYearly = answers.commuteType === "public" ? parseNumber(answers.publicMonthly) * 12 : parseNumber(answers.fuelMonthly) * 12;
  const billsYearly = parseNumber(answers.billsMonthly) * 12;
  const charityYearly = parseNumber(answers.charityMonthly) * 12;

  // VIBE-BASED BUDGETING BREAKDOWN
  const survivalPos = eatOutYearly + transportYearly + billsYearly; 
  const flexPos = coffeeYearly + cigsYearly + hangoutYearly + subsYearly + impulseYearly; 
  const futurePos = charityYearly; 

  const totalYearlyBurn = survivalPos + flexPos + futurePos;
  const totalMonthlyBurn = Math.round(totalYearlyBurn / 12);
  const totalWeeklyBurn = Math.round(totalYearlyBurn / 52);

  // PERCENTAGE CALCULATIONS FOR STORY CARD
  const survivalPct = totalYearlyBurn > 0 ? Math.round((survivalPos / totalYearlyBurn) * 100) : 0;
  const flexPct = totalYearlyBurn > 0 ? Math.round((flexPos / totalYearlyBurn) * 100) : 0;
  const futurePct = totalYearlyBurn > 0 ? Math.max(0, 100 - survivalPct - flexPct) : 0;

  const monthlyIncomeNum = parseNumber(answers.monthlyIncome);
  const yearlyIncomeNum = monthlyIncomeNum * 12;
  const savingsRate = yearlyIncomeNum > 0 ? Math.max(0, Math.round(((yearlyIncomeNum - totalYearlyBurn) / yearlyIncomeNum) * 100)) : 0;
  const expenseRate = yearlyIncomeNum > 0 ? Math.min(100, Math.max(0, 100 - savingsRate)) : 0;

  let tierBadge = { 
    title: "Pejuang Survival & Mindfulness", 
    desc: "Alokasi pos dasar lu aman. Pertahankan disiplin keuangan ini!", 
    emoji: "🌱",
    color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)]", 
    level: 1 
  };
  if (flexPos > survivalPos) {
    tierBadge = { 
      title: "High-Flex Lifestyle Explorer", 
      desc: "Pos gaya hidup lebih besar dari survival. Waktunya ngerem khilaf bulanan!", 
      emoji: "⚡",
      color: "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]", 
      level: 3 
    };
  } else if (totalYearlyBurn > 120000000) {
    tierBadge = { 
      title: "Sultan Senoparty Berdarah Dingin", 
      desc: "Burn rate tahunan tinggi tapi rasio cashflow masih ketolong pemasukan.", 
      emoji: "🥂",
      color: "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]", 
      level: 4 
    };
  }

  const microAssetItems = [
    { name: "Emas Batangan Antam (1 Gram)", price: 1350000, emoji: "🥇", unit: "Gram", bg: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300" },
    { name: "Saham BBCA (Blue Chip)", price: 10000, emoji: "📊", unit: "Lembar", bg: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-300" },
    { name: "Unit Reksa Dana Pasar Uang", price: 50000, emoji: "💼", unit: "Unit", bg: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/30 text-cyan-300" },
    { name: "Sembako Beras Premium (5kg)", price: 75000, emoji: "🌾", unit: "Sak", bg: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300" },
  ];

  const vibeBreakdownItems = [
    { name: "Pos Survival (Makan & Tagihan)", price: survivalPos, emoji: "🌱", unit: "Setahun", bg: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-300" },
    { name: "Pos Gengsi & Flex (Nongkrong/Jajan)", price: flexPos, emoji: "🔥", unit: "Setahun", bg: "from-purple-500/15 to-purple-500/5 border-purple-500/30 text-purple-300" },
    { name: "Pos Masa Depan (Amal & Sosial)", price: futurePos > 0 ? futurePos : 100000, emoji: "🚀", unit: "Setahun", bg: "from-sky-500/15 to-sky-500/5 border-sky-500/30 text-sky-300" },
    { name: "Es Kopi Susu Setara", price: 22000, emoji: "☕", unit: "Gelas", bg: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-300" },
  ];

  const digitalItems = [
    { name: "Langganan AI Assistant (ChatGPT Plus)", price: 200000, emoji: "🤖", unit: "Bulan", bg: "from-teal-500/15 to-teal-500/5 border-teal-500/30 text-teal-300" },
    { name: "Langganan Spotify / Netflix", price: 65000, emoji: "🎵", unit: "Bulan", bg: "from-purple-500/15 to-purple-500/5 border-purple-500/30 text-purple-300" },
    { name: "Cloud Storage (iCloud/Drive)", price: 15000, emoji: "☁️", unit: "Bulan", bg: "from-sky-500/15 to-sky-500/5 border-sky-500/30 text-sky-300" },
    { name: "Tiket Bioskop XXI", price: 50000, emoji: "🎬", unit: "Tiket", bg: "from-blue-500/15 to-blue-500/5 border-blue-500/30 text-blue-300" },
  ];

  const getTemplateStyle = (id: number) => {
    switch(id) {
      case 1:
        return {
          bg: "bg-[#ff6600]",
          cardBg: "bg-pink-400 border-4 border-black text-black shadow-[8px_8px_0px_0px_#000] rounded-[2rem]",
          badge: "bg-yellow-300 text-black border-2 border-black font-black",
          callout: "bg-white border-2 border-black text-black shadow-[3px_3px_0px_0px_#000]",
          itemList: "bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_#fff]",
          headerBadge: "bg-black text-white",
          accentColor: "text-emerald-400"
        };
      case 2:
        return {
          bg: "bg-[#09090b]",
          cardBg: "bg-zinc-900 border-2 border-cyan-500 text-white shadow-[0_0_35px_rgba(6,182,212,0.3)] rounded-[2rem]",
          badge: "bg-cyan-400 text-black font-black",
          callout: "bg-zinc-800 border border-cyan-500/40 text-cyan-300",
          itemList: "bg-black text-white border border-zinc-800",
          headerBadge: "bg-cyan-400 text-black",
          accentColor: "text-cyan-400"
        };
      case 3:
        return {
          bg: "bg-[#ffffff]",
          cardBg: "bg-zinc-100 border-4 border-black text-black shadow-[8px_8px_0px_0px_#000] rounded-[2rem]",
          badge: "bg-black text-white font-black",
          callout: "bg-white border-2 border-black text-black",
          itemList: "bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]",
          headerBadge: "bg-black text-white",
          accentColor: "text-yellow-300"
        };
      case 4:
        return {
          bg: "bg-[#064e3b]",
          cardBg: "bg-emerald-950 border-2 border-amber-400 text-emerald-100 shadow-[8px_8px_0px_0px_#022c22] rounded-[2rem]",
          badge: "bg-amber-400 text-black font-black",
          callout: "bg-emerald-900 border border-emerald-500/50 text-amber-300",
          itemList: "bg-black/70 text-white border border-emerald-500/30",
          headerBadge: "bg-amber-400 text-black",
          accentColor: "text-amber-400"
        };
      case 5:
        return {
          bg: "bg-[#1e3a8a]",
          cardBg: "bg-blue-600 border-4 border-yellow-300 text-white shadow-[8px_8px_0px_0px_#fde047] rounded-[2rem]",
          badge: "bg-yellow-300 text-black font-black",
          callout: "bg-blue-900 border-2 border-yellow-300 text-yellow-200",
          itemList: "bg-black text-white border-2 border-yellow-300",
          headerBadge: "bg-yellow-300 text-black",
          accentColor: "text-yellow-300"
        };
      default:
        return {
          bg: "bg-[#ff6600]",
          cardBg: "bg-pink-400 border-4 border-black text-black shadow-[8px_8px_0px_0px_#000] rounded-[2rem]",
          badge: "bg-yellow-300 text-black border-2 border-black font-black",
          callout: "bg-white border-2 border-black text-black",
          itemList: "bg-black text-white border-2 border-black",
          headerBadge: "bg-black text-white",
          accentColor: "text-emerald-400"
        };
    }
  };

  const currentTemplateStyle = getTemplateStyle(selectedTemplate);

  return (
    <main className="min-h-screen relative overflow-x-hidden bg-[#030712] text-white font-sans pb-10 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      
      {/* AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* ONBOARDING MODAL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900/95 border border-zinc-800 text-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center backdrop-blur-xl">
            
            <div className="flex justify-between items-center text-xs font-bold opacity-60 px-2 uppercase tracking-wider">
              <span>Budgeting BUNG!</span>
              <span>Langkah {onboardingStep} dari 3</span>
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${((onboardingStep - 1) / 3) * 100}%` }}></div>
            </div>

            {onboardingStep === 1 && (
              <div className="space-y-3 py-2">
                <span className="text-5xl">🌱🔥🚀</span>
                <h2 className="text-xl font-black">Vibe-Based Budgeting</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Pengeluaranmu otomatis dikelompokkan ke pos <strong className="text-emerald-400">Survival</strong>, <strong className="text-purple-400">Gengsi/Flex</strong>, dan <strong className="text-sky-400">Masa Depan</strong>.
                </p>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-3 py-2">
                <span className="text-5xl">🥇📊</span>
                <h2 className="text-xl font-black">Micro-Asset Mirror</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Konversi pengeluaran harianmu langsung ke emas fisik 1 gram dan saham blue chip.
                </p>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-3 py-2">
                <span className="text-5xl">📸✨</span>
                <h2 className="text-xl font-black">Flex Positif ke Media Sosial</h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Bagikan hasil ekosistem keuanganmu dengan 5 varian design story yang estetik.
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              {onboardingStep > 1 && (
                <button onClick={() => { setOnboardingStep(onboardingStep - 1); triggerFeedback("tap"); }} className="flex-1 py-3.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-bold text-xs uppercase">Kembali</button>
              )}
              {onboardingStep < 3 ? (
                <button onClick={() => { setOnboardingStep(onboardingStep + 1); triggerFeedback("tap"); }} className="flex-1 py-3.5 rounded-xl bg-white text-black font-black text-xs uppercase shadow-lg">Lanjut ➔</button>
              ) : (
                <button onClick={() => { setShowOnboarding(false); triggerFeedback("success"); }} className="flex-1 py-3.5 rounded-xl bg-emerald-400 text-black font-black text-xs uppercase shadow-[0_0_25px_rgba(52,211,153,0.4)]">Mulai Sekarang</button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="max-w-xl mx-auto px-4 pt-4 w-full flex justify-between items-center relative z-10">
        <button onClick={() => { setShowOnboarding(true); setOnboardingStep(1); triggerFeedback("tap"); }} className="text-xs px-3.5 py-1.5 rounded-full border bg-zinc-900/80 border-zinc-800 text-zinc-300 font-semibold backdrop-blur-md">❓ Panduan</button>
        <button onClick={() => { setWizardStep(1); setErrorMsg(""); triggerFeedback("tap"); }} className="text-xs px-3.5 py-1.5 rounded-full border bg-zinc-900/80 border-zinc-800 text-zinc-300 font-semibold backdrop-blur-md">🔄 Hitung Ulang</button>
      </div>

      {/* MAIN CONTAINER / WIZARD FLOW */}
      <div className="relative z-10 px-4 py-4 max-w-md mx-auto w-full my-auto space-y-4">
        
        {wizardStep >= 2 && wizardStep <= 10 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400 px-1">
              <span>
                {wizardStep === 2 ? "👋 Kenalan" : wizardStep <= 6 ? "☕ Pilar 1: Lifestyle & AI" : wizardStep <= 8 ? "🚆 Pilar 2: Mobilitas" : wizardStep === 9 ? "🧾 Pilar 3: Tagihan & Sosial" : "💰 Quick Income (Opsional)"} ({wizardStep}/10)
              </span>
              <span>{Math.round(((wizardStep - 1) / 9) * 100)}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${((wizardStep - 1) / 9) * 100}%` }}></div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold px-3 py-2.5 rounded-xl text-center backdrop-blur-md">⚠️ {errorMsg}</div>
        )}

        {/* STEP 1: NAMA USER */}
        {wizardStep === 1 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl text-center">
            <div className="space-y-1">
              <span className="text-3xl">👋</span>
              <h2 className="text-lg font-black tracking-tight">Siapa nama panggilan lu?</h2>
              <p className="text-xs text-zinc-400">Biar hasil analisa dan story card-nya personal banget buat lu di Budgeting BUNG!.</p>
            </div>
            <div className="pt-2">
              <input 
                type="text" 
                value={answers.userName} 
                onChange={(e) => setAnswers({ ...answers, userName: e.target.value })} 
                placeholder="Contoh: Gilang"
                className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-4 rounded-xl text-center focus:outline-none focus:border-emerald-400" 
              />
            </div>
            <button 
              onClick={() => {
                if (!answers.userName.trim()) {
                  setErrorMsg("Isi nama panggilan dulu ya bro!");
                  triggerFeedback("error");
                  return;
                }
                setErrorMsg("");
                setWizardStep(2);
                triggerFeedback("tap");
              }} 
              className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg mt-2"
            >
              Mulai Hitung ➔
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {wizardStep === 2 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">☕ / 🍵</span>
              <h2 className="text-lg font-black tracking-tight">{answers.userName}, berapa kali seminggu lu ngopi atau minum matcha?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setAnswers({ ...answers, hasCoffee: true }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${answers.hasCoffee ? "bg-emerald-400 text-black shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Ya, Sering</button>
              <button onClick={() => { setAnswers({ ...answers, hasCoffee: false, coffeePerWeek: "0", coffeePrice: "0" }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${!answers.hasCoffee ? "bg-rose-500 text-white shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Tidak Pernah</button>
            </div>
            {answers.hasCoffee && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Berapa Kali dalam Seminggu:</label>
                  <input type="text" inputMode="numeric" value={answers.coffeePerWeek} onChange={(e) => handleNumericChange("coffeePerWeek", e.target.value, 50)} placeholder="Contoh: 3" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Estimasi Harga per Gelas (Rp):</label>
                  <input type="text" inputMode="numeric" value={formatNumberInput(answers.coffeePrice)} onChange={(e) => handleNumericChange("coffeePrice", e.target.value, 500000)} placeholder="Contoh: 30.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(1); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => handleNextStep(3, answers.hasCoffee, answers.coffeePerWeek, answers.coffeePrice)} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {wizardStep === 3 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">💨</span>
              <h2 className="text-lg font-black tracking-tight">Rokok atau Vaping?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setAnswers({ ...answers, hasCigs: true }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${answers.hasCigs ? "bg-emerald-400 text-black shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Ya, Konsumsi</button>
              <button onClick={() => { setAnswers({ ...answers, hasCigs: false, cigsPerDay: "0", cigsPrice: "0" }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${!answers.hasCigs ? "bg-rose-500 text-white shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Tidak Pernah</button>
            </div>
            {answers.hasCigs && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Bungkus / Pod per Hari:</label>
                  <input type="text" inputMode="numeric" value={answers.cigsPerDay} onChange={(e) => handleNumericChange("cigsPerDay", e.target.value, 50)} placeholder="Contoh: 1" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Harga per Bungkus / Refill (Rp):</label>
                  <input type="text" inputMode="numeric" value={formatNumberInput(answers.cigsPrice)} onChange={(e) => handleNumericChange("cigsPrice", e.target.value, 500000)} placeholder="Contoh: 35.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(2); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => handleNextStep(4, answers.hasCigs, answers.cigsPerDay, answers.cigsPrice)} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {wizardStep === 4 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">🍛</span>
              <h2 className="text-lg font-black tracking-tight">Berapa kali seminggu lu makan di luar?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setAnswers({ ...answers, hasEatOut: true }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${answers.hasEatOut ? "bg-emerald-400 text-black shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Ya, Sering</button>
              <button onClick={() => { setAnswers({ ...answers, hasEatOut: false, eatOutPerWeek: "0", eatOutPrice: "0" }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${!answers.hasEatOut ? "bg-rose-500 text-white shadow-lg" : "bg-zinc-900 text-zinc-400"}`}>Jarang / Bawa Bekal</button>
            </div>
            {answers.hasEatOut && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Berapa Kali dalam Seminggu:</label>
                  <input type="text" inputMode="numeric" value={answers.eatOutPerWeek} onChange={(e) => handleNumericChange("eatOutPerWeek", e.target.value, 50)} placeholder="Contoh: 5" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Rata-rata Biaya per Sekali Makan (Rp):</label>
                  <input type="text" inputMode="numeric" value={formatNumberInput(answers.eatOutPrice)} onChange={(e) => handleNumericChange("eatOutPrice", e.target.value, 1000000)} placeholder="Contoh: 40.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(3); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => handleNextStep(5, answers.hasEatOut, answers.eatOutPerWeek, answers.eatOutPrice)} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {wizardStep === 5 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">🍻 / 🤖</span>
              <h2 className="text-lg font-black tracking-tight">Budget nongkrong & langganan digital?</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Nongkrong per Weekend (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.hangoutBudget)} onChange={(e) => handleNumericChange("hangoutBudget", e.target.value, 10000000)} placeholder="Contoh: 250.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-base py-2 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Langganan Digital + AI Subs (ChatGPT/Netflix) per Bulan (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.subsBudget)} onChange={(e) => handleNumericChange("subsBudget", e.target.value, 5000000)} placeholder="Contoh: 200.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-base py-2 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(4); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(6); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 6 */}
        {wizardStep === 6 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">📦</span>
              <h2 className="text-lg font-black tracking-tight">Khilaf checkout keranjang online?</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Total Belanja Random per Bulan (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.impulseBudget)} onChange={(e) => handleNumericChange("impulseBudget", e.target.value, 20000000)} placeholder="Contoh: 300.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(5); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(7); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 7 */}
        {wizardStep === 7 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">🚆 / 🚗</span>
              <h2 className="text-lg font-black tracking-tight">Pilih moda transportasi utama harian lu:</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => { setAnswers({ ...answers, commuteType: "public" }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-4 px-3 rounded-2xl flex flex-col items-center gap-2 border font-bold text-xs transition-all ${answers.commuteType === "public" ? "bg-emerald-400 text-black border-emerald-400 shadow-lg scale-105" : "bg-zinc-900 text-zinc-300 border-zinc-800"}`}>
                <span className="text-2xl">🚆</span>
                <span>Transportasi Umum (KRL/Busway)</span>
              </button>
              <button onClick={() => { setAnswers({ ...answers, commuteType: "private" }); setErrorMsg(""); triggerFeedback("tap"); }} className={`py-4 px-3 rounded-2xl flex flex-col items-center gap-2 border font-bold text-xs transition-all ${answers.commuteType === "private" ? "bg-emerald-400 text-black border-emerald-400 shadow-lg scale-105" : "bg-zinc-900 text-zinc-300 border-zinc-800"}`}>
                <span className="text-2xl">🚗</span>
                <span>Kendaraan Pribadi (Bensin/Tol)</span>
              </button>
            </div>
            <div className="flex gap-2 pt-3">
              <button onClick={() => { setWizardStep(6); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(8); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 8 */}
        {wizardStep === 8 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">💳</span>
              <h2 className="text-lg font-black tracking-tight">Estimasi pengeluaran transportasi per bulan</h2>
            </div>
            {answers.commuteType === "public" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Total Biaya Transum Bulanan (Rp):</label>
                  <input type="text" inputMode="numeric" value={formatNumberInput(answers.publicMonthly)} onChange={(e) => handleNumericChange("publicMonthly", e.target.value, 5000000)} placeholder="Contoh: 400.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Total BBM, Tol & Parkir per Bulan (Rp):</label>
                  <input type="text" inputMode="numeric" value={formatNumberInput(answers.fuelMonthly)} onChange={(e) => handleNumericChange("fuelMonthly", e.target.value, 10000000)} placeholder="Contoh: 600.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(7); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(9); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 9 */}
        {wizardStep === 9 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">🧾 / 🙏</span>
              <h2 className="text-lg font-black tracking-tight">Tagihan tetap & anggaran sosial/amal bulanan</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Tagihan Wajib Bulanan (Listrik/Internet/Cicilan) (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.billsMonthly)} onChange={(e) => handleNumericChange("billsMonthly", e.target.value, 20000000)} placeholder="Contoh: 750.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-base py-2.5 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Amal, Donasi & Sosial / Kondangan per Bulan (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.charityMonthly)} onChange={(e) => handleNumericChange("charityMonthly", e.target.value, 10000000)} placeholder="Contoh: 200.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-base py-2.5 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(8); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(10); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lanjut ➔</button>
            </div>
          </div>
        )}

        {/* STEP 10 */}
        {wizardStep === 10 && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-[2rem] p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">💰</span>
              <h2 className="text-lg font-black tracking-tight">Estimasi Pemasukan Bulanan (Opsional)</h2>
              <p className="text-xs text-zinc-400">Pilih rentang cepat atau ketik nominal buat ngintip rasio tabungan.</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "< 5 Juta", val: "4000000" },
                  { label: "5 - 10 Juta", val: "8000000" },
                  { label: "10 - 20 Juta", val: "15000000" },
                  { label: "> 20 Juta", val: "25000000" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => { setAnswers({ ...answers, monthlyIncome: preset.val }); triggerFeedback("tap"); }}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${parseNumber(answers.monthlyIncome) === parseNumber(preset.val) ? "bg-emerald-400 text-black border-emerald-400 shadow-lg font-black" : "bg-zinc-900 text-zinc-300 border-zinc-800"}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Atau Ketik Nominal Gaji / Pendapatan per Bulan (Rp):</label>
                <input type="text" inputMode="numeric" value={formatNumberInput(answers.monthlyIncome)} onChange={(e) => handleNumericChange("monthlyIncome", e.target.value, 200000000)} placeholder="Contoh: 8.000.000" className="w-full bg-black/60 border border-zinc-800 text-white font-black text-lg py-3 px-3 rounded-xl text-center focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setWizardStep(9); setErrorMsg(""); triggerFeedback("tap"); }} className="flex-1 py-3.5 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl">Kembali</button>
              <button onClick={() => { setWizardStep(11); setErrorMsg(""); triggerFeedback("success"); }} className="flex-1 py-3.5 bg-emerald-400 text-black font-black text-xs uppercase rounded-xl shadow-lg">Lihat Hasil ⚡</button>
            </div>
          </div>
        )}

        {/* STEP 11: RESULT VIEW WITH PERSONALIZED GREETING BANNER */}
        {wizardStep === 11 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* PERSONALIZED GREETING BANNER */}
            <div className="bg-gradient-to-r from-emerald-500/20 via-zinc-900 to-black border border-emerald-500/30 rounded-2xl p-4 space-y-1 backdrop-blur-xl shadow-lg text-center">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">✨ Budgeting BUNG! Vibe Check</span>
              <h2 className="text-base font-black text-white tracking-tight">Hi, {answers.userName}! Ini rangkuman ekosistem keuanganmu 🚀</h2>
            </div>

            <div className={`${tierBadge.color} border rounded-2xl p-4 space-y-2 backdrop-blur-xl shadow-xl relative overflow-hidden text-center`}>
              <div className="text-[10px] uppercase font-black tracking-widest opacity-80">Vibe Status Keuangan</div>
              <div className="text-base font-black tracking-tight flex items-center justify-center gap-1.5">
                <span>{tierBadge.emoji}</span>
                <span>{tierBadge.title}</span>
              </div>
              <p className="text-xs font-medium opacity-90 leading-relaxed pt-0.5 border-t border-white/10">{tierBadge.desc}</p>
            </div>

            {monthlyIncomeNum > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3 backdrop-blur-xl">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Perbandingan Rasio Keuangan Tahunan</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                    <span className="text-[10px] text-emerald-300 block font-black uppercase">Savings Rate: {savingsRate}%</span>
                    <p className="text-[10px] text-zinc-400 leading-tight">Persentase dari total pemasukan yang berhasil diselamatkan sebagai tabungan bersih.</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                    <span className="text-[10px] text-rose-400 block font-black uppercase">Expense Rate: {expenseRate}%</span>
                    <p className="text-[10px] text-zinc-400 leading-tight">Persentase dari total pemasukan yang habis terpakai untuk konsumsi & gaya hidup.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-950/80 to-black border border-emerald-500/30 rounded-3xl p-5 text-center space-y-2 shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Total Pengeluaran Setahun (3 Pilar)</span>
              <div className="text-2xl font-black text-emerald-300 tracking-tight pt-1">
                Rp {totalYearlyBurn.toLocaleString("id-ID")} <span className="text-xs font-normal text-zinc-400">/thn</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-xs">
                <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-bold">Per Bulan</span>
                  <strong className="text-yellow-400 text-sm">Rp {totalMonthlyBurn.toLocaleString("id-ID")}</strong>
                </div>
                <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-bold">Per Minggu</span>
                  <strong className="text-yellow-400 text-sm">Rp {totalWeeklyBurn.toLocaleString("id-ID")}</strong>
                </div>
              </div>
            </div>

            {/* VIBE DEFINITION CARDS SECTION */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3 text-xs">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">📖 Panduan Pos Vibe Keuangan:</span>
              <div className="space-y-2">
                <div className="border-l-2 border-emerald-400 pl-3">
                  <strong className="text-emerald-300 block font-black">🌱 Pos Survival (Rp {survivalPos.toLocaleString("id-ID")})</strong>
                  <span className="text-zinc-400 text-[11px]">Alokasi mutlak untuk kebutuhan pokok bertahan hidup: makan harian, transum, dan tagihan wajib.</span>
                </div>
                <div className="border-l-2 border-purple-400 pl-3">
                  <strong className="text-purple-300 block font-black">🔥 Pos Gengsi / Flex (Rp {flexPos.toLocaleString("id-ID")})</strong>
                  <span className="text-zinc-400 text-[11px]">Pengeluaran sekunder untuk hiburan, nongkrong weekend, kopi kekinian, dan belanja khilaf online.</span>
                </div>
                <div className="border-l-2 border-sky-400 pl-3">
                  <strong className="text-sky-300 block font-black">🚀 Pos Masa Depan (Rp {futurePos.toLocaleString("id-ID")})</strong>
                  <span className="text-zinc-400 text-[11px]">Alokasi kontribusi sosial, donasi, amal, atau investasi untuk keberkahan jangka panjang.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 overflow-x-auto pb-1">
              <div className="flex gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl w-full">
                <button onClick={() => { setResultTab("microAsset"); triggerFeedback("tap"); }} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap ${resultTab === "microAsset" ? "bg-white text-black shadow-lg" : "text-zinc-400"}`}>🥇 Aset Mikro</button>
                <button onClick={() => { setResultTab("vibe"); triggerFeedback("tap"); }} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap ${resultTab === "vibe" ? "bg-white text-black shadow-lg" : "text-zinc-400"}`}>🔥 Vibe Pos</button>
                <button onClick={() => { setResultTab("digital"); triggerFeedback("tap"); }} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap ${resultTab === "digital" ? "bg-white text-black shadow-lg" : "text-zinc-400"}`}>🤖 AI & Subs</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(resultTab === "microAsset" ? microAssetItems : resultTab === "vibe" ? vibeBreakdownItems : digitalItems).map((item: any, idx: number) => {
                const qty = Math.floor(totalYearlyBurn / item.price);
                return (
                  <div key={idx} className={`bg-gradient-to-b ${item.bg} border rounded-2xl p-3.5 flex flex-col justify-between shadow-xl space-y-2`}>
                    <div className="flex justify-between items-start">
                      <span className="text-xl p-1.5 bg-black/50 rounded-xl">{item.emoji}</span>
                      <span className="text-[9px] font-black uppercase bg-black/40 px-2 py-0.5 rounded-full">{item.unit}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white line-clamp-1">{item.name}</h3>
                      <div className="text-base font-black tracking-tight text-white pt-1">
                        {resultTab === "vibe" ? `Rp ${item.price.toLocaleString("id-ID")}` : `${qty.toLocaleString("id-ID")} ${item.unit}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-2">
              <button onClick={() => { setShowStoryModal(true); triggerFeedback("tap"); }} className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(52,211,153,0.35)] flex items-center justify-center gap-2">📸 Bikin IG Story Card (5 Pilihan Varian)</button>
              <button onClick={() => { setWizardStep(1); setErrorMsg(""); triggerFeedback("tap"); }} className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-2xl">🔄 Hitung Ulang</button>
            </div>

          </div>
        )}

      </div>

      <footer className="text-center pt-2 pb-1 border-t border-zinc-900/80 space-y-0.5 max-w-xl mx-auto w-full px-4 relative z-10">
        <p className="text-[10px] text-zinc-400 font-medium">🔒 <strong className="text-zinc-200">100% Aman & Privasi Terjaga:</strong> Tanpa simpan data.</p>
      </footer>

      {/* MULTI-TEMPLATE STORY PREVIEW MODAL */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 max-w-md w-full space-y-4 text-center shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Pilih Varian Design Story</h3>
              <button onClick={() => { setShowStoryModal(false); triggerFeedback("tap"); }} className="text-zinc-400 hover:text-white text-xs px-3.5 py-1.5 bg-zinc-800 rounded-xl font-bold">✕ Close</button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-zinc-800">
              {[
                { id: 1, name: "Sunset", color: "bg-[#ff6600]" },
                { id: 2, name: "Cyber", color: "bg-cyan-400" },
                { id: 3, name: "Clean", color: "bg-white text-black" },
                { id: 4, name: "Wealth", color: "bg-emerald-600" },
                { id: 5, name: "Retro", color: "bg-blue-600" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTemplate(t.id); triggerFeedback("tap"); }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 ${selectedTemplate === t.id ? "bg-white text-black shadow-lg scale-105" : "text-zinc-400 hover:text-white bg-zinc-900"}`}
                >
                  <span className={`w-3 h-3 rounded-full ${t.color} border border-black/30`}></span>
                  {t.name}
                </button>
              ))}
            </div>

            <div className="flex justify-center py-1">
              <div 
                ref={storyRef}
                className={`w-[340px] h-[600px] ${currentTemplateStyle.bg} text-black p-5 flex flex-col justify-between font-sans relative overflow-hidden rounded-3xl text-left shadow-2xl transition-all duration-300`}
              >
                <div className="relative z-10 flex justify-between items-center">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${currentTemplateStyle.headerBadge} px-3 py-1 rounded-full`}>
                    Budgeting BUNG!
                  </span>
                  <span className="text-xs font-black tracking-tighter opacity-80">BUNG.APP</span>
                </div>

                <div className={`relative z-10 my-auto ${currentTemplateStyle.cardBg} p-3.5 space-y-2`}>
                  {monthlyIncomeNum > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-center border-b border-black/10 pb-2">
                      <div className="bg-black/10 p-1.5 rounded-xl">
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-70 block">Savings Rate</span>
                        <div className="text-lg font-black tracking-tighter">{savingsRate}%</div>
                      </div>
                      <div className="bg-black/10 p-1.5 rounded-xl">
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-70 block">Expense Rate</span>
                        <div className="text-lg font-black tracking-tighter">{expenseRate}%</div>
                      </div>
                    </div>
                  )}

                  <div className={`${currentTemplateStyle.callout} rounded-xl p-2.5 space-y-1 text-left`}>
                    <div className="text-xs font-black tracking-tight text-center pb-1 border-b border-black/10">
                      Hi, {answers.userName}! 🚀
                    </div>
                    <div className="text-[9px] font-medium leading-relaxed pt-0.5">
                      <strong className="block font-black uppercase tracking-wide text-[8px] pb-0.5 opacity-80">💡 VIBE INSIGHT:</strong>
                      {tierBadge.desc}
                    </div>
                  </div>

                  {/* FIXED BREAKDOWN POS LABELS & PERCENTAGE */}
                  <div className={`${currentTemplateStyle.itemList} rounded-xl p-2 space-y-1 text-left`}>
                    <span className={`text-[8px] font-black ${currentTemplateStyle.accentColor} uppercase tracking-widest block text-center border-b border-white/10 pb-0.5`}>
                      ✨ Komposisi Vibe Keuangan:
                    </span>
                    {[
                      { name: "Pos Survival (Dasar)", pct: survivalPct, emoji: "🌱" },
                      { name: "Pos Gengsi & Flex", pct: flexPct, emoji: "🔥" },
                      { name: "Pos Masa Depan", pct: futurePct, emoji: "🚀" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-black">
                        <span className="truncate pr-1">{item.emoji} {item.name}</span>
                        <span className={`${currentTemplateStyle.accentColor} whitespace-nowrap`}>{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 text-center pt-1 border-t border-black/20 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center text-[9px] font-black tracking-wider uppercase opacity-80">
                    <span>#BudgetingBung</span>
                    <span>Cek di bung.app</span>
                  </div>
                  <p className="text-[8px] italic opacity-60 font-medium">*(Ecosystem budgeting tanpa pusing mikirin ledger)*</p>
                </div>

              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button onClick={() => handleExportAction("share")} disabled={isExporting} className="w-full py-4 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {isExporting ? "Memproses..." : `🚀 Share Budgeting BUNG! ke IG / WA`}
              </button>
              <button onClick={() => handleExportAction("download")} disabled={isExporting} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 disabled:opacity-50">
                📥 Download Card Saja
              </button>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 0px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

    </main>
  );
}