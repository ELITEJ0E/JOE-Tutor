import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const agents = readFileSync('lib/presets/agents.ts', 'utf8');
const state = readFileSync('lib/state.ts', 'utf8');
const intros = readFileSync('lib/presets/character-intros.ts', 'utf8');
const rosterMatch = state.match(/availablePresets:\s*\[([\s\S]*?)\],/);
assert.ok(rosterMatch, 'Main companion roster must exist');
const roster = rosterMatch[1].split('\n')
  .flatMap(line => line.replace(/\/\/.*$/, '').split(',').map(item => item.trim()).filter(Boolean))
  .filter(Boolean);
const expected = ['ChloeTutor','Alice','Irene','Sam','Tom','Ethan','Yuna','Karina','Joon','Haruka','Hiro','XiaoYuTaiwan','YuChen','Nicha','Niran','TianXiWei','JuJingyi','Hao','Rahul','Anika','Ramon','Sofia','Amelie','Julien','Ari','Noa','Hans','Lena','Newton','Ada','Olga','Maxim','Luca','Marco'];
assert.deepEqual(roster, expected, 'Roster order differs from English > Asian > other requested order');
for (const removed of ['Defne','Karim','Reza','Ines']) assert.ok(!roster.includes(removed), removed + ' must be removed from selector');
const checks = {
  Yuna: 'Leda',
  Karina: 'Leda',
  JuJingyi: 'Leda',
  Hiro: 'Iapetus',
  XiaoYuTaiwan: 'Leda',
  Nicha: 'Leda',
  Luca: 'Aoede',
};
for (const [name, voice] of Object.entries(checks)) {
  const m = agents.match(new RegExp('export const ' + name + ': Agent = \\{([\\s\\S]*?)\\n\\};'));
  assert.ok(m, name + ' agent is missing');
  assert.ok(m[1].includes("voice: '" + voice + "'"), name + ' must use voice ' + voice);
}
const maleVoices = {
  Sam: 'Achird', Tom: 'Umbriel', Ethan: 'Puck', Joon: 'Algieba',
  Hiro: 'Iapetus', YuChen: 'Algieba', Niran: 'Achird', Hao: 'Iapetus',
  Rahul: 'Achird', Ramon: 'Zubenelgenubi', Julien: 'Algieba', Ari: 'Umbriel',
  Hans: 'Iapetus', Newton: 'Charon', Maxim: 'Umbriel', Marco: 'Achird',
};
const voiceDirections = readFileSync('lib/presets/male-voice-direction.ts', 'utf8');
const prompts = readFileSync('lib/prompts.ts', 'utf8');
for (const [name, voice] of Object.entries(maleVoices)) {
  const match = agents.match(new RegExp('export const ' + name + ': Agent = \\{([\\s\\S]*?)\\n\\};'));
  assert.ok(match, name + ' male companion must exist');
  assert.ok(match[1].includes("voice: '" + voice + "'"), name + ' must use voice ' + voice);
  assert.ok(match[1].includes("gender: 'male'"), name + ' must be explicitly masculine');
  const id = match[1].match(/id: '([^']+)'/)?.[1];
  assert.ok(id && voiceDirections.includes(id + ':'), name + ' must have a voice style');
}
assert.ok(prompts.includes("agent.gender === 'male' ? 'calm' : 'cute'"), 'Male default emotion must not be cute');
assert.ok(prompts.includes('buildMaleVoiceDirection(agent)'), 'System prompt must include male voice direction');

// Regression: male Chinese personas must not inherit the female Chinese voice prompts.
for (const name of ['Hao', 'YuChen']) {
  const match = agents.match(new RegExp('export const ' + name + ': Agent = \\{([\\s\\S]*?)\\n\\};'));
  assert.ok(match, name + ' must exist');
  assert.ok(!match[1].includes('${Mei.personality}') && !match[1].includes('${XiaoYuTaiwan.personality}'),
    name + ' must not inherit a female personality');
}
assert.ok(readFileSync('lib/prompts.ts', 'utf8').includes("agent.id === 'yuchen_tw' || agent.id === 'hao_zh'"),
  'Mandarin male companions must have stable calm emotion defaults');

assert.match(agents, /name: 'Lucia \(Italian\)'/, 'Italian must be introduced as Lucia');
assert.match(agents, /'Achernar'/, 'Voice options must include Achernar');
for (const id of ['yuna','karina_aespa','ju_jingyi','hiro','xiaoyu_tw','nicha_th','luca']) {
  assert.ok(intros.includes('  ' + id + ': {'), 'Unique introduction missing for ' + id);
}
console.log('PASS: ' + roster.length + ' companions, 16 validated male voice styles, feminine presets and greetings');

// Optional Fish integration must never embed API credentials in browser code.
const fishProxy = readFileSync('api/fish-tts.ts', 'utf8');
const liveHook = readFileSync('hooks/media/use-live-api.ts', 'utf8');
assert.match(fishProxy, /process\.env\.FISH_AUDIO_API_KEY/, 'Fish API key must stay on server');
assert.match(fishProxy, /s2\.1-pro-free/, 'Request free Fish Audio model explicitly');
assert.match(liveHook, /fishMode\.current/, 'Live audio must support per-character Fish route');
assert.match(liveHook, /fishMode\.current \|\| activeId === 'tian_xi_wei'/, 'New characters must be allowed Gemini fallback until Fish is configured');
for (const id of ['ju_jingyi', 'karina_aespa']) {
  assert.ok(fishProxy.includes(id + ':'), id + ' must be registered in the server-side Fish proxy');
  assert.ok(liveHook.includes("id === '" + id + "'"), id + ' must participate in Fish preflight');
}
assert.ok(fishProxy.includes('FISH_VOICE_JU_JINGYI_ID'), 'Ju Jingyi must have a voice env variable');
assert.ok(fishProxy.includes('FISH_VOICE_KARINA_AESPA_ID'), 'Karina must have a voice env variable');


// Volume boost applies only to Ju Jingyi and Karina, in both Fish and Gemini paths.
const streamerCode = readFileSync('lib/audio-streamer.ts', 'utf8');
assert.match(liveHook, /BOOSTED_COMPANION_GAIN_MULTIPLIER = 1\.45/, 'New companion gain factor must be declared');
assert.match(liveHook, /id === 'ju_jingyi' \|\| id === 'karina_aespa'/, 'Only two new agents get the boost');
assert.match(liveHook, /gain\.gain\.value = isBoostedCompanionVoice\(voice\)/, 'Fish MP3 playback must use per-character gain');
assert.match(liveHook, /estimateSpeechPlaybackGain\(audio\)[\s\S]*?isBoostedCompanionVoice\(voice\)/, 'Fish streaming chunks must use per-character boost');
assert.match(liveHook, /streamer\.setPlaybackGainMultiplier\([\s\S]*?isBoostedCompanionVoice\(activeId\)/, 'Gemini fallback must use character-specific boost');
assert.match(streamerCode, /setPlaybackGainMultiplier\(multiplier: number\)/, 'Gemini streamer must support output-gain changes');
assert.match(streamerCode, /this\.outputGain \* this\.playbackGainMultiplier/, 'Gemini streamer must retain gain between playback sessions');

// The saved intro and personality must agree: Fish Audio speaks the exact greeting text.
const tianGreeting = '哈喽～我是田曦薇呀！今天过得怎么样？有没有什么好玩的事想跟我分享？';
const introSource = readFileSync('lib/presets/character-intros.ts', 'utf8');
assert.ok(agents.includes("firstGreeting: '" + tianGreeting + "'"), 'Tian Xiwei agent should greet with Mandarin 哈喽');
assert.ok(introSource.includes("firstGreeting: '" + tianGreeting + "'"), 'Tian Xiwei intro should use the same spoken welcome');
assert.ok(agents.includes('GREETING: On the first startup, begin with a bright, natural Mandarin "哈喽～"'), 'Tian Xiwei startup persona should prefer 哈喽');
