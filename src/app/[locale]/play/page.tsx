import { Bot, DoorOpen, PlusCircle, Sparkles, Swords } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function PlayPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  const choices = [
    { href: "/play/create" as const, icon: PlusCircle, title: ar ? "إنشاء غرفة" : "Create a room", body: ar ? "ابدأ غرفة جديدة وشارك كود الدعوة مع صديقك." : "Start a new room and share the invite code with a friend.", tone: "from-lime-300 to-emerald-500" },
    { href: "/play/join" as const, icon: DoorOpen, title: ar ? "الانضمام لغرفة" : "Join a room", body: ar ? "معاك كود دعوة؟ اكتبه وانضم للمباراة." : "Have an invite code? Enter it and join the match.", tone: "from-cyan-300 to-blue-500" },
    { href: "/practice" as const, icon: Bot, title: ar ? "اللعب ضد البوت" : "Play against bot", body: ar ? "واجه خصمًا ذكيًا بثلاثة مستويات صعوبة، والعب في أي وقت دون انتظار صديق." : "Challenge a smart opponent across three difficulty levels. Play anytime without waiting for a friend.", tone: "from-violet-300 to-fuchsia-500" }
  ];
  return <main id="main-content" dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-[#0c1028] text-white">
    <SiteHeader locale={locale}/>
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-4 py-2 text-xs font-black text-lime-200"><Sparkles size={15}/> GUESS ARENA · PLAY</span>
        <h1 className="mt-6 text-4xl font-black sm:text-6xl">{ar ? "اختار طريقة التحدي" : "Choose your challenge"}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/55">{ar ? "العب ضد صديقك أونلاين أو اختبر مهاراتك أمام البوت. اختار التحدي اللي يناسبك!" : "Play online with a friend or test your skills against the bot. Choose your challenge!"}</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {choices.map(({ href, icon: Icon, title, body, tone }) => <Link href={href} key={href} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.05] p-7 transition duration-300 hover:-translate-y-2 hover:border-lime-200/30 hover:bg-white/[.08] sm:p-8">
          <span className={`grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-[#11162a] shadow-xl transition group-hover:rotate-[-8deg]`}><Icon size={30}/></span>
          <h2 className="mt-7 text-2xl font-black">{title}</h2><p className="mt-3 min-h-14 text-sm leading-7 text-white/55">{body}</p>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-lime-200"><Swords size={17}/>{ar ? "متابعة" : "Continue"}</span>
        </Link>)}
      </div>
    </section>
  </main>;
}
