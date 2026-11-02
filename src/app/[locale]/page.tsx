import { ArrowUpLeft, ArrowUpRight, Brain, Crown, Gamepad2, Handshake, Lightbulb, ShieldCheck, Sparkles, Swords, Users, Zap } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  const cards = [
    { icon: Users, number: "01", title: ar ? "تحدي واحد ضد واحد" : "One-on-one showdown", body: ar ? "اعمل غرفة خاصة وادعُ صاحبك بكود بسيط. كل واحد يختار شخصيته السرية." : "Create a private room and invite a friend with a simple code. Each player picks a secret character.", color: "from-fuchsia-500 to-violet-600" },
    { icon: Brain, number: "02", title: ar ? "اسأل بذكاء" : "Ask clever questions", body: ar ? "اسأل عن الشعر أو النظارة أو الإكسسوارات، وحاول تضيق دائرة الاحتمالات." : "Ask about hair, glasses, and accessories to narrow down the possibilities.", color: "from-cyan-400 to-blue-600" },
    { icon: Crown, number: "03", title: ar ? "اكشف الشخصية" : "Reveal the character", body: ar ? "اقلب البطاقات بنفسك، راجع اختياراتك، وخمّن في اللحظة المناسبة." : "Flip cards yourself, review your choices, and make your guess at the perfect moment.", color: "from-lime-300 to-emerald-500" }
  ];
  return (
    <main id="main-content" tabIndex={-1} className="arena-home min-h-screen overflow-hidden bg-[#0c1028] text-white">
      <SiteHeader locale={locale}/>
      <section className="relative isolate min-h-[680px] overflow-hidden">
        <div className="pointer-events-none absolute -start-40 top-20 -z-10 size-[34rem] rounded-full bg-violet-700/35 blur-[110px]"/>
        <div className="pointer-events-none absolute -end-32 top-0 -z-10 size-[38rem] rounded-full bg-teal-400/15 blur-[120px]"/>
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:min-h-[680px] lg:grid-cols-[1fr_1fr]">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black tracking-wide text-lime-200"><Sparkles size={15}/>{ar ? "اللعبة اللي هتجمع الشلة" : "The game that brings everyone together"}</div>
            <h1 className="mt-7 text-5xl leading-[1.15] font-black tracking-tight sm:text-6xl lg:text-7xl">{ar ? "مين يقدر يكشف" : "Who can uncover"}<span className="mt-2 block bg-gradient-to-r from-lime-200 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">{ar ? "الشخصية السرية؟" : "the secret face?"}</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg">{ar ? "اسأل، فكّر، اقلب البطاقات، ونافس أصحابك في تحدي مباشر مليان مفاجآت. جهّز تركيزك… أول سؤال ممكن يغيّر كل حاجة!" : "Ask, think, flip the cards, and challenge your friends in a live duel full of surprises. Get focused — one smart question can change everything!"}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/play" className="arena-play-cta inline-flex min-h-14 items-center gap-3 rounded-2xl px-7 py-3 text-base font-black text-[#102018]"><Swords size={20}/>{ar ? "ابدأ اللعب الآن" : "Play now"}{ar ? <ArrowUpLeft size={19}/> : <ArrowUpRight size={19}/>}</Link>
              <Link href="/how-to-play" className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10"><Lightbulb size={18}/>{ar ? "اعرف طريقة اللعب" : "How to play"}</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-xs font-bold text-white/45"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-lime-300"/> {ar ? "مواجهة مباشرة" : "Live multiplayer"}</span><span className="inline-flex items-center gap-2"><Users size={15}/>{ar ? "لاعبان في كل غرفة" : "Two players per room"}</span><span className="inline-flex items-center gap-2"><ShieldCheck size={15}/>{ar ? "شخصيتك سرية" : "Secret character stays private"}</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[610px]">
            <div className="absolute inset-8 rounded-[4rem] bg-gradient-to-br from-violet-500/35 via-cyan-400/20 to-lime-300/25 blur-3xl"/>
            <div className="relative aspect-[1.08/1]">
              <div className="absolute left-[8%] top-[12%] h-[72%] w-[76%] rotate-[-7deg] rounded-[2.7rem] border border-white/15 bg-gradient-to-br from-violet-500/35 to-indigo-950/80 p-4 shadow-[0_35px_100px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black tracking-[.25em] text-violet-200">GUESS ARENA</span><span className="rounded-full bg-lime-300/15 px-3 py-1 text-[10px] font-black text-lime-200">LIVE</span></div>
                <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
                  {Array.from({length:16},(_,i)=><div key={i} className={`relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 ${i===5?"bg-gradient-to-br from-amber-200 to-orange-500 ring-2 ring-lime-300":"bg-gradient-to-br from-slate-700 to-slate-900"}`}>
                    <div className={`absolute left-1/2 top-[18%] h-[42%] w-[45%] -translate-x-1/2 rounded-[48%] ${["bg-[#f0c7a1]","bg-[#a76b4c]","bg-[#d69a72]","bg-[#e8bd91]"][i%4]}`}/>
                    <div className={`absolute left-1/2 top-[12%] h-[18%] w-[49%] -translate-x-1/2 rounded-t-full ${["bg-[#2c2432]","bg-[#754b32]","bg-[#d3a94e]","bg-[#48334b]"][i%4]}`}/>
                    <div className="absolute bottom-[-8%] left-1/2 h-[43%] w-[78%] -translate-x-1/2 rounded-t-[45%] bg-gradient-to-b from-cyan-300 to-blue-600"/>
                    {i===5&&<span className="absolute inset-0 grid place-items-center bg-lime-300/10 text-2xl font-black text-white">?</span>}
                  </div>)}
                </div>
              </div>
              <div className="absolute right-[0%] top-[2%] grid size-24 rotate-[10deg] place-items-center rounded-[2rem] border border-cyan-200/25 bg-cyan-300/15 text-cyan-100 shadow-2xl backdrop-blur-xl sm:size-32"><Brain size={44}/></div>
              <div className="absolute bottom-[4%] left-[0%] grid size-24 rotate-[-12deg] place-items-center rounded-[2rem] border border-lime-200/25 bg-lime-300/15 text-lime-200 shadow-2xl backdrop-blur-xl sm:size-32"><Zap size={42}/></div>
              <div className="absolute bottom-[10%] right-[1%] rounded-2xl border border-white/15 bg-[#191b3c]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"><p className="text-[10px] font-bold text-white/45">{ar ? "مستعد للتحدي؟" : "READY TO DUEL?"}</p><p className="mt-1 text-sm font-black text-lime-200">{ar ? "دورك تكسب!" : "Your move!"}</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black tracking-[.25em] text-lime-300">THE ARENA EXPERIENCE</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">{ar ? "ثلاث خطوات… وتبدأ المنافسة" : "Three steps. One epic duel."}</h2><p className="mt-4 leading-7 text-white/55">{ar ? "قواعد بسيطة، لكن الفوز محتاج تركيز وذكاء." : "Simple rules, but winning takes focus and clever thinking."}</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">{cards.map(({icon:Icon,number,title,body,color})=><article key={number} className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-7 transition duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[.08]"><span className="absolute end-5 top-2 text-6xl font-black text-white/[.045]">{number}</span><span className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${color} text-[#10152b] shadow-xl`}><Icon size={26}/></span><h3 className="mt-7 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-7 text-white/55">{body}</p></article>)}</div>
        </div>
      </section>
      <section className="px-5 pb-24 sm:px-8"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-lime-200/20 bg-gradient-to-r from-violet-700/70 via-indigo-700/60 to-teal-700/60 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.3)] sm:p-14"><div className="absolute -start-16 -top-20 size-64 rounded-full bg-fuchsia-400/20 blur-3xl"/><div className="absolute -end-16 -bottom-20 size-64 rounded-full bg-lime-300/20 blur-3xl"/><div className="relative"><Handshake size={38} className="mx-auto text-lime-200"/><h2 className="mt-5 text-3xl font-black sm:text-4xl">{ar ? "هات صاحبك… وابدأوا التحدي!" : "Bring a friend. Start the showdown!"}</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/65">{ar ? "أنشئ غرفة خاصة وشارك كودها. أول واحد يكشف الشخصية السرية هو بطل الساحة." : "Create a private room and share its code. The first to uncover the secret character wins the arena."}</p><Link href="/play" className="arena-play-cta mt-7 inline-flex min-h-13 items-center gap-2 rounded-2xl px-7 py-3 font-black text-[#102018]"><Gamepad2 size={19}/>{ar ? "يلا نلعب" : "Let's play"}</Link></div></div></section>
    </main>
  );
}
