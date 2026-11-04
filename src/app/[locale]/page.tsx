import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, Bot, Brain, Check, CircleHelp, Crown, Flame, Gamepad2, Lightbulb, LockKeyhole, Sparkles, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  const modes = [
    { icon: Users, tag: ar ? "مع أصحابك" : "WITH FRIENDS", title: ar ? "مواجهة حقيقية" : "The real showdown", body: ar ? "افتح غرفة خاصة وشارك الكود مع صاحبك. كل واحد يختار شخصية سرية، والباقي ذكاء وتركيز." : "Create a private room and share the code. Pick secret characters, then let the mind games begin.", href: "/play", tone: "orange", number: "01" },
    { icon: Bot, tag: ar ? "في أي وقت" : "ANYTIME", title: ar ? "تحدي البوت" : "Challenge the bot", body: ar ? "ابدأ فورًا من غير انتظار. اختار مستوى سهل أو متوسط أو صعب وشوف هتقدر تكسب الكمبيوتر؟" : "Jump straight in. Choose Easy, Medium, or Hard and see if you can outsmart the computer.", href: "/practice", tone: "lime", number: "02" }
  ] as const;
  const steps = [
    { icon: Users, n: "01", title: ar ? "اختار طريقة اللعب" : "Choose your arena", body: ar ? "العب مع صاحبك أونلاين أو واجه البوت." : "Play online with a friend or face the bot." },
    { icon: Target, n: "02", title: ar ? "اسأل وركّز" : "Ask & focus", body: ar ? "اسأل أسئلة إجابتها نعم أو لا لتضييق الاحتمالات." : "Ask yes-or-no questions to narrow the possibilities." },
    { icon: Zap, n: "03", title: ar ? "اقلب البطاقات" : "Flip the cards", body: ar ? "استبعد الشخصيات التي لا تطابق الإجابة." : "Flip away every character that doesn't fit." },
    { icon: Crown, n: "04", title: ar ? "اكشف السر" : "Make your guess", body: ar ? "اختار الشخصية الصح قبل منافسك." : "Name the right character before your rival." }
  ];

  return (
    <main id="main-content" tabIndex={-1} className="arena-home min-h-screen overflow-x-clip bg-[#fff9ed] text-[#24170f]">
      <SiteHeader locale={locale} homeHero />

      {/* 01 — Hero */}
      <section className="relative isolate -mt-[124px] overflow-hidden bg-[#21140d] pt-[124px] text-[#fff9ed]">
        <div className="pointer-events-none absolute -start-32 -top-28 size-[34rem] rounded-full bg-orange-500/25 blur-[110px]" />
        <div className="pointer-events-none absolute -end-32 bottom-[-10rem] size-[38rem] rounded-full bg-lime-400/20 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.12]" style={{ backgroundImage: "radial-gradient(#fff1d6 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative mx-auto grid min-h-[680px] max-w-[1440px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-300/10 px-4 py-2 text-xs font-black text-orange-200"><Sparkles size={15}/>{ar ? "جهّز مخك… المنافسة بدأت" : "GET YOUR GAME FACE ON"}</div>
            <h1 className="mt-7 text-5xl leading-[1.12] font-black tracking-tight sm:text-6xl lg:text-[5.2rem]">{ar ? "مش مجرد تخمين" : "More than a"}<span className="mt-2 block text-[#bef264]">{ar ? "دي معركة ذكاء!" : "guessing game."}</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/65 sm:text-lg">{ar ? "شخصية واحدة مستخبية وسط 45 وشّ. اسأل السؤال الصح، اقلب البطاقات، واكشف اختيار منافسك قبل ما يكشف اختيارك." : "One secret face hiding among 45 characters. Ask the right question, flip the cards, and uncover your rival's pick before they find yours."}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/play" className="arena-home-primary inline-flex min-h-14 items-center gap-3 rounded-2xl px-7 py-3 text-base font-black text-[#21140d] shadow-[0_12px_35px_rgba(249,115,22,.25)] transition hover:-translate-y-1">{ar ? "ادخل الساحة" : "Enter the arena"}{ar ? <ArrowUpLeft size={19}/> : <ArrowUpRight size={19}/>}</Link>
              <Link href="/how-to-play" className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] px-6 py-3 font-bold text-white transition hover:bg-white/10"><CircleHelp size={18}/>{ar ? "ازاي تلعب؟" : "How to play"}</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/50"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-lime-300"/> {ar ? "45 شخصية في كل جولة" : "45 characters per round"}</span><span className="inline-flex items-center gap-2"><LockKeyhole size={14}/>{ar ? "اختيارات سرية" : "Secret picks"}</span><span className="inline-flex items-center gap-2"><Flame size={14}/>{ar ? "منافسة حماسية" : "Fast-paced fun"}</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[650px]">
            <div className="absolute inset-[12%] rounded-full bg-orange-500/20 blur-[70px]"/>
            <div className="relative rotate-[-2deg] rounded-[2.4rem] border border-white/15 bg-[#fff7e8]/[.08] p-3 shadow-[0_35px_100px_rgba(0,0,0,.38)] backdrop-blur-xl sm:rounded-[3rem] sm:p-5">
              <div className="flex items-center justify-between px-2 pb-4">
                <div><p className="text-[10px] font-black tracking-[.28em] text-orange-200">GUESS ARENA</p><p className="mt-1 text-sm font-black">{ar ? "مين الشخصية؟" : "WHO'S THE MYSTERY?"}</p></div>
                <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/25 bg-lime-300/10 px-3 py-1.5 text-[10px] font-black text-lime-200"><span className="size-1.5 animate-pulse rounded-full bg-lime-300"/> LIVE DUEL</span>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {Array.from({length:20},(_,i)=><div key={i} className={`relative aspect-[.82] overflow-hidden rounded-xl border p-1.5 sm:rounded-2xl sm:p-2 ${i===7?"border-lime-300 bg-lime-200 shadow-[0_0_28px_rgba(190,242,100,.28)]":"border-white/10 bg-[#3b2a1d]"}`}>
                  <div className={`relative mx-auto mt-[9%] h-[58%] w-[78%] overflow-hidden rounded-t-[48%] rounded-b-[35%] ${["bg-[#e7b58c]","bg-[#9d6547]","bg-[#f0c9a3]","bg-[#bd805d]"][i%4]}`}>
                    <div className={`absolute -top-[5%] left-[-8%] h-[34%] w-[116%] rounded-t-full ${["bg-[#32251f]","bg-[#d6a34b]","bg-[#57382b]","bg-[#29211e]"][i%4]}`}/>
                    <div className="absolute left-[23%] top-[48%] size-[13%] rounded-full bg-[#2b211c]"/><div className="absolute right-[23%] top-[48%] size-[13%] rounded-full bg-[#2b211c]"/>
                    <div className="absolute bottom-[18%] left-1/2 h-[5%] w-[25%] -translate-x-1/2 rounded-full bg-[#9c4d3b]"/>
                    <div className={`absolute bottom-[-30%] left-1/2 h-[48%] w-[130%] -translate-x-1/2 rounded-t-[50%] ${["bg-[#d97736]","bg-[#557a3d]","bg-[#a44f37]","bg-[#b28a42]"][i%4]}`}/>
                  </div>
                  <div className="mx-auto mt-1 h-1 w-1/2 rounded-full bg-white/20"/>
                  {i===7&&<span className="absolute inset-0 grid place-items-center bg-lime-300/15 text-3xl font-black text-white">?</span>}
                  {i===12&&<span className="absolute inset-0 bg-black/55"/>}
                </div>)}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><span className="text-xs font-bold text-white/65">{ar ? "الشخصية السرية اتحددت!" : "Secret character selected!"}</span><span className="inline-flex items-center gap-1.5 text-xs font-black text-lime-200"><Check size={14}/>{ar ? "جاهز للتحدي" : "READY TO PLAY"}</span></div>
            </div>
            <div className="absolute -start-4 top-[17%] grid size-16 -rotate-12 place-items-center rounded-2xl border border-orange-200/30 bg-orange-400 text-[#2b170b] shadow-2xl sm:-start-8 sm:size-20"><Brain size={34}/></div>
            <div className="absolute -end-2 bottom-[9%] grid size-[4.5rem] rotate-12 place-items-center rounded-2xl border border-lime-200/30 bg-lime-300 text-[#24330e] shadow-2xl sm:-end-7 sm:size-24"><Trophy size={38}/></div>
          </div>
        </div>
        <div className="relative h-14 overflow-hidden"><svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="h-full w-full"><path d="M0 0H1440V20C1200 58 1020 58 760 27C510 -3 260 2 0 28Z" fill="#fff9ed" transform="rotate(180 720 28)"/></svg></div>
      </section>

      {/* 02 — Choose your mode */}
      <section className="relative px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl"><p className="text-xs font-black tracking-[.25em] text-orange-600">{ar ? "اختار منافسك" : "PICK YOUR OPPONENT"}</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{ar ? "الساحة على مزاجك" : "Your arena. Your rules."}</h2><p className="mt-4 max-w-xl leading-7 text-[#78685a]">{ar ? "عايز تنافس صاحبك ولا تختبر ذكاءك ضد الكمبيوتر؟ اختار طريقتك وابدأ." : "Challenge a friend or test your skills against the computer. Pick your mode and jump in."}</p></div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadbc5] bg-white/70 px-4 py-2 text-xs font-black text-[#78685a]"><Gamepad2 size={15}/>{ar ? "طريقتان للعب" : "2 WAYS TO PLAY"}</span>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {modes.map(({icon:Icon,tag,title,body,href,tone,number})=><article key={number} className={`group relative isolate overflow-hidden rounded-[2.25rem] border p-7 shadow-[0_20px_60px_rgba(75,48,22,.07)] transition duration-300 hover:-translate-y-2 sm:p-9 ${tone==="orange"?"border-orange-200 bg-gradient-to-br from-[#fff0dc] via-white to-[#fff9ed]":"border-lime-200 bg-gradient-to-br from-[#eff8d9] via-white to-[#fff9ed]"}`}>
              <span className="absolute end-5 top-1 text-8xl font-black text-[#4a321e]/[.045]">{number}</span><div className={`grid size-16 place-items-center rounded-2xl shadow-lg ${tone==="orange"?"bg-orange-500 text-white":"bg-lime-400 text-[#24330e]"}`}><Icon size={30}/></div>
              <p className={`mt-7 text-[10px] font-black tracking-[.22em] ${tone==="orange"?"text-orange-700":"text-lime-800"}`}>{tag}</p><h3 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h3><p className="mt-3 max-w-lg text-sm leading-7 text-[#78685a]">{body}</p>
              <Link href={href} className={`mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 font-black text-white transition hover:gap-4 ${tone==="orange"?"bg-[#c84e16] hover:bg-[#a93c10]":"bg-[#4e7024] hover:bg-[#3d5a19]"}`}>{ar ? "ابدأ التحدي" : "Start challenge"}{ar?<ArrowLeft size={17}/>:<ArrowRight size={17}/>}</Link>
              <div className="pointer-events-none absolute -bottom-16 -end-10 size-48 rounded-full border-[26px] border-current opacity-[.035]"/>
            </article>)}
          </div>
        </div>
      </section>

      {/* 03 — How the game works */}
      <section className="relative overflow-hidden bg-[#f1e8d8] px-5 py-20 sm:px-8 sm:py-24">
        <div className="pointer-events-none absolute -end-24 top-0 size-80 rounded-full bg-orange-300/30 blur-[90px]"/>
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black tracking-[.25em] text-orange-700">{ar ? "اللعبة سهلة… الفوز مش سهل" : "EASY TO LEARN. HARD TO MASTER."}</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">{ar ? "أربع خطوات تفصلك عن الفوز" : "Four moves to victory"}</h2><p className="mt-4 leading-7 text-[#78685a]">{ar ? "كل سؤال بيقرّبك من الإجابة. بس خليك أذكى من منافسك." : "Every question gets you closer. Just stay one step ahead of your rival."}</p></div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({icon:Icon,n,title,body},i)=><article key={n} className="relative rounded-[1.8rem] border border-[#e2d3bd] bg-[#fffaf1] p-6 shadow-[0_12px_35px_rgba(75,48,22,.05)]">
              <div className="flex items-center justify-between"><span className="text-xs font-black tracking-widest text-orange-700">{n}</span><Icon size={23} className="text-[#7b8e36]"/></div><h3 className="mt-8 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-7 text-[#78685a]">{body}</p>
              {i!==3&&<span className="absolute -end-3 top-1/2 z-10 hidden size-7 -translate-y-1/2 place-items-center rounded-full border border-[#e2d3bd] bg-[#fffaf1] text-orange-600 lg:grid"><ArrowRight size={14}/></span>}
            </article>)}
          </div>
          <div className="mt-10 flex justify-center"><Link href="/how-to-play" className="inline-flex items-center gap-2 rounded-xl border border-[#d9c8af] bg-white/60 px-5 py-3 text-sm font-black text-[#5c4632] transition hover:bg-white"><Lightbulb size={17}/>{ar ? "شوف القواعد بالتفصيل" : "Explore the full rules"}{ar?<ArrowLeft size={16}/>:<ArrowRight size={16}/>}</Link></div>
        </div>
      </section>

      {/* 04 — Final challenge */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#21140d] px-7 py-14 text-center text-[#fff9ed] shadow-[0_30px_80px_rgba(75,48,22,.18)] sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -start-20 -top-24 size-72 rounded-full bg-orange-500/25 blur-[80px]"/><div className="pointer-events-none absolute -end-16 -bottom-24 size-72 rounded-full bg-lime-400/20 blur-[80px]"/>
          <div className="relative mx-auto max-w-3xl"><div className="mx-auto grid size-16 place-items-center rounded-2xl border border-lime-200/25 bg-lime-300/10 text-lime-200"><Trophy size={31}/></div><p className="mt-6 text-xs font-black tracking-[.25em] text-orange-200">{ar ? "مكانك مستنيك" : "THE ARENA IS CALLING"}</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">{ar ? "جاهز تثبت إنك أذكى؟" : "Ready to outsmart everyone?"}</h2><p className="mx-auto mt-4 max-w-xl leading-8 text-white/60">{ar ? "اختار منافسك، ركّز في كل إجابة، وخلي آخر بطاقة تكون هي الإجابة الصح." : "Choose your opponent, read every answer, and make that final card count."}</p><Link href="/play" className="arena-home-primary mt-8 inline-flex min-h-14 items-center gap-3 rounded-2xl px-8 py-3 font-black text-[#21140d] transition hover:-translate-y-1"><Swords size={20}/>{ar ? "ابدأ اللعب دلوقتي" : "Play the game now"}{ar?<ArrowUpLeft size={18}/>:<ArrowUpRight size={18}/>}</Link></div>
        </div>
      </section>
    </main>
  );
}
