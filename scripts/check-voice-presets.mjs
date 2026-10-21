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
const expected = ['ChloeTutor','Alice','Irene','Sam','Tom','Ethan','Yuna','Joon','Haruka','Hiro','XiaoYuTaiwan','YuChen','Nicha','Niran','Mei','Hao','Rahul','Anika','Ramon','Sofia','Amelie','Julien','Ari','Noa','Hans','Lena','Newton','Ada','Olga','Maxim','Luca','Marco'];
assert.deepEqual(roster, expected, 'Roster order differs from English > Asian > other requested order');
for (const removed of ['Defne','Karim','Reza','Ines']) assert.ok(!roster.includes(removed), removed + ' must be removed from selector');
const checks = {
  Yuna: 'Leda',
  Hiro: 'Iapetus',
  XiaoYuTaiwan: 'Leda',
  Nicha: 'Leda',
  Luca: 'Aoede',
  Mei: 'Leda',
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
for (const id of ['yuna','hiro','xiaoyu_tw','nicha_th','luca']) {
  assert.ok(intros.includes('  ' + id + ': {'), 'Unique introduction missing for ' + id);
}
console.log('PASS: ' + roster.length + ' companions, 16 validated male voice styles, feminine presets and greetings');

// Optional Fish integration must never embed API credentials in browser code.
const fishProxy = readFileSync('api/fish-tts.ts', 'utf8');
const liveHook = readFileSync('hooks/media/use-live-api.ts', 'utf8');
assert.match(fishProxy, /process\.env\.FISH_AUDIO_API_KEY/, 'Fish API key must stay on server');
assert.match(fishProxy, /s2\.1-pro-free/, 'Request free Fish Audio model explicitly');
assert.match(liveHook, /fishMode\.current/, 'Live audio must support per-character Fish route');
assert.match(liveHook, /fishFallbackAudio/, 'Live audio must retain Gemini playback fallback');
