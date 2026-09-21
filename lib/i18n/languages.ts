export type SupportedLanguage = "en" | "hi" | "ta" | "te" | "mr" | "bn";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    academics: "Academics",
    planner: "Planner",
    learning: "Learning Library",
    insights: "Insights & Analytics",
    workspace: "Creation Workspace",
    ai_tutor: "AI Tutor",
    diksha: "DIKSHA Curriculum",
    risk: "Academic Risk",
    teacher_portal: "Teacher Portal",
    profile: "Profile & Settings",
    overview: "Academic Overview",
    tasks: "Tasks & Deadlines",
    subjects: "Subjects",
    sessions: "Study Sessions",
    pending: "Pending",
    completed: "Completed",
    overdue: "Overdue",
    high_priority: "High Priority",
    optimize_schedule: "Optimize Schedule",
    ask_tutor: "Ask AI Tutor",
    save_document: "Save Document",
    export_pdf: "Export / Print PDF",
    run_code: "Run Code",
    search_resources: "Search NCERT & DIKSHA resources",
    switch_teacher: "Switch to Teacher Mode",
    switch_student: "Switch to Student Mode",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    academics: "अकादमिक",
    planner: "अध्ययन योजना",
    learning: "शिक्षण पुस्तकालय",
    insights: "प्रगति और विश्लेषण",
    workspace: "सृजन कार्यक्षेत्र",
    ai_tutor: "एआई ट्यूटर",
    diksha: "दीक्षा पाठ्यक्रम (DIKSHA)",
    risk: "शैक्षणिक जोखिम",
    teacher_portal: "शिक्षक पोर्टल",
    profile: "प्रोफ़ाइल एवं सेटिंग्स",
    overview: "शैक्षणिक अवलोकन",
    tasks: "कार्य और समय-सीमा",
    subjects: "विषय",
    sessions: "अध्ययन सत्र",
    pending: "लंबित",
    completed: "पूर्ण",
    overdue: "अतिदेय",
    high_priority: "उच्च प्राथमिकता",
    optimize_schedule: "समय-सारणी अनुकूलित करें",
    ask_tutor: "एआई ट्यूटर से पूछें",
    save_document: "दस्तावेज़ सहेजें",
    export_pdf: "पीडीएफ निर्यात / प्रिंट करें",
    run_code: "कोड निष्पादित करें",
    search_resources: "एनसीईआरटी और दीक्षा संसाधन खोजें",
    switch_teacher: "शिक्षक मोड में जाएं",
    switch_student: "छात्र मोड में जाएं",
  },
  ta: {
    dashboard: "டாஷ்போர்டு",
    academics: "கல்விப் பாடங்கள்",
    planner: "படிப்பு திட்டமிடுபவர்",
    learning: "கற்றல் நூலகம்",
    insights: "முன்னேற்ற பகுப்பாய்வு",
    workspace: "படைப்பு பணியிடம்",
    ai_tutor: "AI ஆசிரியர்",
    diksha: "தீக்ஷா கல்வி (DIKSHA)",
    risk: "கல்வி இடர் பகுப்பாய்வு",
    teacher_portal: "ஆசிரியர் தளம்",
    profile: "சுயவிவரம்",
    overview: "கல்வி கண்ணோட்டம்",
    tasks: "பணிகள் & காலக்கெடு",
    subjects: "பாடங்கள்",
    sessions: "படிப்பு அமர்வுகள்",
    pending: "நிலுவையில்",
    completed: "முடிந்தது",
    overdue: "தாமதமானது",
    high_priority: "முக்கிய முன்னுரிமை",
    optimize_schedule: "அட்டவணையை உகப்பாக்கு",
    ask_tutor: "AI ஆசிரியரிடம் கேளுங்கள்",
    save_document: "ஆவணத்தை சேமிக்கவும்",
    export_pdf: "PDF ஏற்றுமதி / அச்சிடு",
    run_code: "குறியீட்டை இயக்கவும்",
    search_resources: "NCERT & DIKSHA வளங்களைத் தேடுங்கள்",
    switch_teacher: "ஆசிரியர் பயன்முறைக்கு மாறவும்",
    switch_student: "மாணவர் பயன்முறைக்கு மாறவும்",
  },
  te: {
    dashboard: "డ్యాష్‌బోర్డ్",
    academics: "విద్యా విషయాలు",
    planner: "స్టడీ ప్లానర్",
    learning: "లెర్నింగ్ లైబ్రరీ",
    insights: "విశ్లేషణ & అంతర్దృష్టులు",
    workspace: "క్రియేషన్ వర్క్‌స్పేస్",
    ai_tutor: "AI ట్యూటర్",
    diksha: "దీక్షా పాఠ్యప్రణాళిక",
    risk: "విద్యా రిస్క్ విశ్లేషణ",
    teacher_portal: "ఉపాధ్యాయుల పోర్టల్",
    profile: "ప్రొఫైల్",
    overview: "విద్యా సమీక్ష",
    tasks: "టాస్క్‌లు & గడువులు",
    subjects: "సబ్జెక్టులు",
    sessions: "స్టడీ సెషన్లు",
    pending: "పెండింగ్",
    completed: "పూర్తయింది",
    overdue: "గడువు ముగిసింది",
    high_priority: "అధిక ప్రాధాన్యత",
    optimize_schedule: "షెడ్యూల్ ఆప్టిమైజ్ చేయండి",
    ask_tutor: "AI ట్యూటర్‌ని అడగండి",
    save_document: "డాక్యుమెంట్ సేవ్ చేయండి",
    export_pdf: "PDF ఎగుమతి / ప్రింట్",
    run_code: "కోడ్ రన్ చేయండి",
    search_resources: "NCERT & దీక్ష వనరులను శోధించండి",
    switch_teacher: "టీచర్ మోడ్‌కి మారండి",
    switch_student: "విద్యార్థి మోడ్‌కి మారండి",
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    academics: "शैक्षणिक विषय",
    planner: "अभ्यास नियोजक",
    learning: "शिक्षण ग्रंथालय",
    insights: "प्रगती विश्लेषण",
    workspace: "सर्जनशीलता कार्यक्षेत्र",
    ai_tutor: "एआय ट्यूटर",
    diksha: "दीक्षा अभ्यासक्रम (DIKSHA)",
    risk: "शैक्षणिक जोखीम",
    teacher_portal: "शिक्षक पोर्टल",
    profile: "प्रोफाइल",
    overview: "शैक्षणिक आढावा",
    tasks: "कार्ये आणि मुदती",
    subjects: "विषय",
    sessions: "अभ्यास सत्र",
    pending: "प्रलंबित",
    completed: "पूर्ण",
    overdue: "मुदत संपलेली",
    high_priority: "उच्च प्राधान्य",
    optimize_schedule: "वेळापत्रक अनुकूलित करा",
    ask_tutor: "एआय ट्यूटरला विचारा",
    save_document: "दस्तऐवज जतन करा",
    export_pdf: "पीडीएफ निर्यात / मुद्रित करा",
    run_code: "कोड चालवा",
    search_resources: "NCERT आणि दीक्षा संसाधने शोधा",
    switch_teacher: "शिक्षक मोडमध्ये जा",
    switch_student: "विद्यार्थी मोडमध्ये जा",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    academics: "একাডেমিক",
    planner: "অধ্যয়ন পরিকল্পনাকারী",
    learning: "লার্নিং লাইব্রেরি",
    insights: "অগ্রগতি বিশ্লেষণ",
    workspace: "ক্রিয়েশন ওয়ার্কস্পেস",
    ai_tutor: "এআই টিউটর",
    diksha: "দীক্ষা পাঠ্যক্রম (DIKSHA)",
    risk: "একাডেমিক ঝুঁকি বিশ্লেষণ",
    teacher_portal: "শিক্ষক পোর্টাল",
    profile: "প্রোফাইল",
    overview: "একাডেমিক ওভারভিউ",
    tasks: "কাজ এবং সময়সীমা",
    subjects: "বিষয়সমূহ",
    sessions: "অধ্যয়ন অধিবেশন",
    pending: "মুলতুবি",
    completed: "সম্পন্ন",
    overdue: "মেয়াদোত্তীর্ণ",
    high_priority: "উচ্চ অগ্রাধিকার",
    optimize_schedule: "সময়সূচী অপ্টিমাইজ করুন",
    ask_tutor: "এআই টিউটরকে জিজ্ঞাসা করুন",
    save_document: "নথি সংরক্ষণ করুন",
    export_pdf: "পিডিএফ রপ্তানি / মুদ্রণ করুন",
    run_code: "কোড চালান",
    search_resources: "NCERT ও দীক্ষা রিসোর্স খুঁজুন",
    switch_teacher: "শিক্ষক মোডে স্যুইচ করুন",
    switch_student: "ছাত্র মোডে স্যুইচ করুন",
  },
};

export const LANG_STORAGE_KEY = "aieses_language";

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors.
  }
  return "en";
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors.
  }
}

export function t(key: string, lang: SupportedLanguage = "en"): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}
