import { useId, type CSSProperties } from "react";

type PortraitProps = { name: string; attributes: Record<string, unknown>; className?: string };
const skinTones:Record<string,string>={light:"#f3c9a5",medium:"#c98961",dark:"#754832"};
const hairTones:Record<string,string>={black:"#29232b",brown:"#68402f",blonde:"#e6c36d",red:"#a94f36",gray:"#a7a8b0"};
const eyeTones:Record<string,string>={brown:"#70452f",blue:"#4b91c7",green:"#4c9a72"};
export function CharacterPortrait({name,attributes,className=""}:PortraitProps){
 const skin=skinTones[String(attributes.skin)]??skinTones.medium;
 const hair=hairTones[String(attributes.hairColor)]??hairTones.black;
 const eyes=eyeTones[String(attributes.eyeColor)]??eyeTones.brown;
 const female=attributes.gender==="female";
 const long=attributes.hairLength==="long";
 const bald=attributes.hairLength==="none";
 const hat=attributes.hasHat===true,glasses=attributes.hasGlasses===true,beard=attributes.hasBeard===true;
 const reactId=useId().replace(/:/g,"");
 const id=(name.toLowerCase().replace(/[^a-z0-9]/g,"")||"character")+reactId;
 const style:CSSProperties={width:"100%",height:"100%"};
 return <svg viewBox="0 0 160 180" className={className} style={style} role="img" aria-label={name}>
  <defs><linearGradient id={`portrait-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={female?"#f5d0fe":"#bae6fd"}/><stop offset="100%" stopColor={female?"#c4b5fd":"#99f6e4"}/></linearGradient><linearGradient id={`shirt-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={female?"#a855f7":"#0f766e"}/><stop offset="100%" stopColor={female?"#6d28d9":"#164e63"}/></linearGradient></defs>
  <rect width="160" height="180" rx="20" fill={`url(#portrait-${id})`}/>
  <circle cx="24" cy="30" r="13" fill="#fff" opacity=".28"/><circle cx="139" cy="48" r="20" fill="#fff" opacity=".2"/>
  <path d="M17 180c3-39 27-57 63-57s60 18 63 57" fill={`url(#shirt-${id})`}/>
  <path d="M68 111h24v25H68z" fill={skin}/>
  {long&&<path d="M35 79c-5 33-3 64 9 79l18-7-7-70zm90 0c5 33 3 64-9 79l-18-7 7-70z" fill={hair}/>}
  <ellipse cx="80" cy="76" rx="43" ry="51" fill={skin}/>
  {!bald&&<path d="M37 75c-7-38 12-62 43-62 31 0 51 23 43 62-9-16-20-25-39-27-16 10-29 13-47 11z" fill={hair}/>}
  {!bald&&<path d="M38 68c-7 14-5 29 0 37l11-9-2-25zm84 0c7 14 5 29 0 37l-11-9 2-25z" fill={hair}/>}
  <ellipse cx="64" cy="77" rx="4" ry="5" fill={eyes}/><ellipse cx="96" cy="77" rx="4" ry="5" fill={eyes}/>
  <circle cx="65" cy="76" r="1.4" fill="#fff"/><circle cx="97" cy="76" r="1.4" fill="#fff"/>
  <path d="M80 83l-4 13h8" fill="none" stroke="#a86f58" strokeWidth="2.5" strokeLinecap="round"/>
  <path d="M67 105q13 10 26 0" fill="none" stroke="#8c4c4b" strokeWidth="3" strokeLinecap="round"/>
  {beard&&<path d="M48 99q3 32 32 35 29-3 32-35-13 12-32 9-19 3-32-9z" fill={hair} opacity=".96"/>}
  {glasses&&<g fill="none" stroke="#253047" strokeWidth="4"><rect x="48" y="68" width="29" height="22" rx="7"/><rect x="83" y="68" width="29" height="22" rx="7"/><path d="M77 76h6"/></g>}
  {hat&&<g><path d="M37 47q4-34 43-34t43 34z" fill="#7257e8"/><path d="M29 47h102q-1 9-9 10H38q-8-1-9-10z" fill="#4934a8"/></g>}
  <path d="M49 143q31 18 62 0" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="4"/>
 </svg>;
}
