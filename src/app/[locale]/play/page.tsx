import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return localizedPageMetadata({
    locale, path: "/play",
    titleAr: "العب Guess Arena | تحدى صديقك أو العب ضد البوت",
    titleEn: "Play Guess Arena | Challenge a Friend or the Bot",
    descriptionAr: "اختار طريقة اللعب في Guess Arena: أنشئ غرفة خاصة، انضم بكود دعوة، أو ابدأ تحديًا فوريًا ضد البوت بثلاثة مستويات صعوبة.",
    descriptionEn: "Choose your Guess Arena mode: create a private room, join with an invite code, or start an instant bot challenge with three difficulty levels.",
    keywords: locale === "ar" ? ["العب Guess Arena", "لعبة أونلاين مع صديق", "لعبة ضد الكمبيوتر"] : ["play Guess Arena", "online game with friend", "guessing game against bot"]
  });
}

import { Bot, DoorOpen, PlusCircle, Sparkles, Swords } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function PlayPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  const choices = [
    { href: "/play/create" as const, icon: PlusCircle, title: ar ? "إنشاء غرفة" : "Create a room", body: ar ? "ابدأ غرفة جديدة وشارك كود الدعوة مع صديقك." : "Start a new room and share the invite code with a friend.", tone: "from-lime-300 to-emerald-500" },
    { href: "/play/join" as const, icon: DoorOpen, title: ar ? "الانضمام لغرفة" : "Join a room", body: ar ? "معاك كود دعوة؟ اكتبه وانضم للمباراة." : "Have an invite code? Enter it and join the match.", tone: "from-cyan-300 to-blue-500" },
    { href: "/practice" as const, icon: Bot, title: ar ? "اللعب ضد البوت" : "Play against bot", body: ar ? "هتلعب ضد الكمبيوتر بدل لاعب حقيقي. اختار سهل أو متوسط أو صعب، والبوت هيسألك ويخمّن شخصيتك تلقائيًا. ابدأ فورًا من غير غرفة أو كود دعوة أو انتظار صديق." : "Play against the computer instead of a real person. Choose Easy, Medium, or Hard, and the bot will ask questions and guess your character automatically. Start instantly—no room, invite code, or friend needed.", tone: "from-violet-300 to-fuchsia-500" }
  ];
  return <main id="main-content" dir={ar ? "rtl" : "ltr"} className="game-entry-page min-h-screen">
    <SiteHeader locale={locale}/>
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e2d3bd] bg-[#eff8d9] px-4 py-2 text-xs font-black text-[#557a3d]"><Sparkles size={15}/> GUESS ARENA · PLAY</span>
        <h1 className="mt-6 text-4xl font-black sm:text-6xl">{ar ? "اختار طريقة التحدي" : "Choose your challenge"}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-[#78685a]">{ar ? "العب ضد صديقك أونلاين أو اختبر مهاراتك أمام البوت. اختار التحدي اللي يناسبك!" : "Play online with a friend or test your skills against the bot. Choose your challenge!"}</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {choices.map(({ href, icon: Icon, title, body, tone }) => <Link href={href} key={href} className="group relative overflow-hidden rounded-[2rem] border border-[#e2d3bd] bg-[#fffaf1] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#bef264] hover:bg-[#fff7e8] sm:p-8">
          <span className={`grid size-16 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-[#21140d] shadow-xl transition group-hover:rotate-[-8deg]`}><Icon size={30}/></span>
          <h2 className="mt-7 text-2xl font-black">{title}</h2><p className="mt-3 min-h-14 text-sm leading-7 text-white/55">{body}</p>
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-lime-200"><Swords size={17}/>{ar ? "متابعة" : "Continue"}</span>
        </Link>)}
      </div>
    </section>
  </main>;
}
