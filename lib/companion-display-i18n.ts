import type { Agent } from './presets/agents';
import { getCharacterIntroduction } from './presets/character-intros';
import type { UiLanguage } from './ui-i18n';

/** Display-only localizations. Never change the character's voice or prompt. */
const french: Record<string, string> = {
  chloe_tutor: 'Tutrice douce, amie attentive et compagne du quotidien',
  chloe_math: 'Partenaire patiente en sciences et mathématiques',
  chloe_quiz: 'Compagne de quiz enjouée et encourageante',
  chloe_scholar: 'Guide en sciences humaines, à votre écoute',
  alice: 'Écrivaine douce et compagne à l’écoute',
  sam: 'Compagnon détendu et débrouillard',
  irene: 'Compagne pétillante, joueuse et encourageante',
  tom: 'Compagnon fiable avec qui il est facile de parler',
  rahul: 'Compagnon chaleureux en hindi et en anglais',
  ramon: 'Compagnon créatif et attentionné en espagnol',
  amelie: 'Compagne douce et créative en français',
  ari: 'Compagnon attentionné parlant hébreu',
  tian_xi_wei: 'Compagne pétillante parlant mandarin · Fish Audio',
  xiaoyu_tw: 'Voix apaisante en mandarin taïwanais · Leda',
  nicha_th: 'Compagne douce en thaï · Leda',
  hiro: 'Voix japonaise douce et légère · Achernar',
  yuna: 'Voix coréenne tendre et joyeuse · Leda',
  hans: 'Compagnon calme en allemand pour parler et apprendre',
  newton: 'Esprit scientifique curieux et compagnon',
  defne: 'Compagne chaleureuse parlant turc',
  karim: 'Compagnon bienveillant en arabe',
  reza: 'Compagnon chaleureux en persan',
  ines: 'Compagne attentionnée en portugais',
  olga: 'Compagne douce et créative en russe',
  luca: 'Voix féminine chaleureuse en italien · Aoede',
  ethan_en: 'Compagnon anglophone attentionné',
  joon_ko: 'Compagnon coréen chaleureux',
  haruka_ja: 'Douce compagne japonaise',
  hao_zh: 'Compagnon mandarin plein de charme · Fish Audio',
  yuchen_tw: 'Compagnon en mandarin taïwanais',
  niran_th: 'Compagnon thaï chaleureux',
  anika_hi: 'Compagne douce parlant hindi',
  sofia_es: 'Compagne enjouée en espagnol',
  julien_fr: 'Compagnon français attentionné',
  noa_he: 'Compagne douce parlant hébreu',
  lena_de: 'Compagne chaleureuse parlant allemand',
  maxim_ru: 'Compagnon russe calme et attentionné',
  marco_it: 'Compagnon italien chaleureux',
  ada_math: 'Compagne passionnée de mathématiques',
};

type VoiceLanguage = 'English' | 'Korean' | 'Japanese' | 'Mandarin' | 'Taiwan Mandarin' | 'Chinese' | 'Thai' | 'Hindi' | 'Spanish' | 'French' | 'German' | 'Russian' | 'Italian' | 'Hebrew' | 'Portuguese' | 'Arabic' | 'Turkish' | 'Persian';
const spokenLanguageById: Record<string, VoiceLanguage> = {
  chloe_tutor:'English',chloe_math:'English',chloe_quiz:'English',chloe_scholar:'English',
  alice:'English',sam:'English',irene:'English',tom:'English',ethan_en:'English',
  yuna:'Korean',joon_ko:'Korean',hiro:'Japanese',haruka_ja:'Japanese',
  tian_xi_wei:'Chinese',hao_zh:'Chinese',xiaoyu_tw:'Taiwan Mandarin',yuchen_tw:'Taiwan Mandarin',
  nicha_th:'Thai',niran_th:'Thai',rahul:'Hindi',anika_hi:'Hindi',
  ramon:'Spanish',sofia_es:'Spanish',amelie:'French',julien_fr:'French',
  hans:'German',lena_de:'German',olga:'Russian',maxim_ru:'Russian',
  luca:'Italian',marco_it:'Italian',ari:'Hebrew',noa_he:'Hebrew',
  ines:'Portuguese',karim:'Arabic',defne:'Turkish',reza:'Persian',
};

const labels: Record<UiLanguage, Partial<Record<VoiceLanguage, string>>> = {
  en: {},
  fr: {English:'anglais',Korean:'coréen',Japanese:'japonais',Mandarin:'mandarin',Chinese:'chinois', 'Taiwan Mandarin':'mandarin taïwanais',Thai:'thaï',Hindi:'hindi',Spanish:'espagnol',French:'français',German:'allemand',Russian:'russe',Italian:'italien',Hebrew:'hébreu',Portuguese:'portugais',Arabic:'arabe',Turkish:'turc',Persian:'persan'},
  'zh-CN': {English:'英语',Korean:'韩语',Japanese:'日语',Mandarin:'普通话',Chinese:'中文','Taiwan Mandarin':'台湾华语',Thai:'泰语',Hindi:'印地语',Spanish:'西班牙语',French:'法语',German:'德语',Russian:'俄语',Italian:'意大利语',Hebrew:'希伯来语',Portuguese:'葡萄牙语',Arabic:'阿拉伯语',Turkish:'土耳其语',Persian:'波斯语'},
  'zh-TW': {English:'英語',Korean:'韓語',Japanese:'日語',Mandarin:'華語',Chinese:'中文','Taiwan Mandarin':'臺灣華語',Thai:'泰語',Hindi:'印地語',Spanish:'西班牙語',French:'法語',German:'德語',Russian:'俄語',Italian:'義大利語',Hebrew:'希伯來語',Portuguese:'葡萄牙語',Arabic:'阿拉伯語',Turkish:'土耳其語',Persian:'波斯語'},
  ms: {English:'Inggeris',Korean:'Korea',Japanese:'Jepun',Mandarin:'Mandarin',Chinese:'Cina','Taiwan Mandarin':'Mandarin Taiwan',Thai:'Thai',Hindi:'Hindi',Spanish:'Sepanyol',French:'Perancis',German:'Jerman',Russian:'Rusia',Italian:'Itali',Hebrew:'Ibrani',Portuguese:'Portugis',Arabic:'Arab',Turkish:'Turki',Persian:'Parsi'},
  ja: {English:'英語',Korean:'韓国語',Japanese:'日本語',Mandarin:'中国語',Chinese:'中国語','Taiwan Mandarin':'台湾華語',Thai:'タイ語',Hindi:'ヒンディー語',Spanish:'スペイン語',French:'フランス語',German:'ドイツ語',Russian:'ロシア語',Italian:'イタリア語',Hebrew:'ヘブライ語',Portuguese:'ポルトガル語',Arabic:'アラビア語',Turkish:'トルコ語',Persian:'ペルシャ語'},
  ko: {English:'영어',Korean:'한국어',Japanese:'일본어',Mandarin:'중국어',Chinese:'중국어','Taiwan Mandarin':'대만 중국어',Thai:'태국어',Hindi:'힌디어',Spanish:'스페인어',French:'프랑스어',German:'독일어',Russian:'러시아어',Italian:'이탈리아어',Hebrew:'히브리어',Portuguese:'포르투갈어',Arabic:'아랍어',Turkish:'튀르키예어',Persian:'페르시아어'},
  es: {English:'inglés',Korean:'coreano',Japanese:'japonés',Mandarin:'mandarín',Chinese:'chino','Taiwan Mandarin':'mandarín taiwanés',Thai:'tailandés',Hindi:'hindi',Spanish:'español',French:'francés',German:'alemán',Russian:'ruso',Italian:'italiano',Hebrew:'hebreo',Portuguese:'portugués',Arabic:'árabe',Turkish:'turco',Persian:'persa'},
};

const generic: Record<Exclude<UiLanguage, 'en' | 'fr'>, { companion: string; learning: string; voice: string }> = {
  'zh-CN': {companion:'温柔友好的聊天伙伴',learning:'贴心的学习与交流伙伴',voice:'语音伙伴'},
  'zh-TW': {companion:'溫柔親切的聊天夥伴',learning:'貼心的學習與交流夥伴',voice:'語音夥伴'},
  ms: {companion:'Teman yang mesra dan penyayang',learning:'Teman berbual dan belajar yang prihatin',voice:'Teman suara'},
  ja: {companion:'優しく親しみやすい会話パートナー',learning:'勉強と会話の心強いパートナー',voice:'音声キャラクター'},
  ko: {companion:'다정하고 친근한 대화 친구',learning:'친절한 학습 및 대화 친구',voice:'음성 캐릭터'},
  es: {companion:'Compañía amable y cercana',learning:'Compañero atento para aprender y conversar',voice:'Compañero de voz'},
};

export function localizedCompanionTagline(agent: Agent, language: UiLanguage): string {
  if (language === 'en') return getCharacterIntroduction(agent).tagline;
  if (language === 'fr') return french[agent.id] || 'Compagnon sympathique pour apprendre et discuter';
  const prefix = generic[language];
  const spoken = spokenLanguageById[agent.id];
  const suffix = spoken ? labels[language][spoken] : undefined;
  const isSpecial = agent.id.includes('math') || agent.id === 'newton' || agent.id === 'chloe_scholar';
  const base = isSpecial ? prefix.learning : prefix.companion;
  return suffix ? `${base} · ${suffix}` : base;
}

export function localizedCompanionName(agent: Agent, language: UiLanguage): string {
  if (language === 'en') return agent.name;
  return agent.name.replace(/ \((English|Korean|Japanese|Chinese|Taiwan Mandarin|Mandarin|Thai|Hindi|Spanish|French|German|Russian|Italian|Hebrew|Portuguese|Arabic|Turkish|Persian)\)/, (_, english: VoiceLanguage) =>
    ' (' + (labels[language][english] || english) + ')'
  );
}
