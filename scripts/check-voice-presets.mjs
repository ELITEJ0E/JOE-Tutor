import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const agents = readFileSync('lib/presets/agents.ts', 'utf8');
const state = readFileSync('lib/state.ts', 'utf8');
const intros = readFileSync('lib/presets/character-intros.ts', 'utf8');
const rosterMatch = state.match(/availablePresets:\s*\[([\s\S]*?)\],/);
assert.ok(rosterMatch, 'Main companion roster must exist');
const roster = rosterMatch[1].split('\n')
  .map(line => line.replace(/\/\/.*$/, '').trim().replace(/,$/, ''))
  .filter(Boolean);
const expected = ['ChloeTutor','Alice','Sam','Irene','Tom', 'Yuna','Hiro','XiaoYuTaiwan','Nicha','Mei', 'Rahul','Ramon','Amelie','Ari','Hans','Newton','Olga','Luca'];
assert.deepEqual(roster, expected, 'Roster order differs from English > Asian > other requested order');
for (const removed of ['Defne','Karim','Reza','Ines']) assert.ok(!roster.includes(removed), removed + ' must be removed from selector');
const checks = {
  Yuna: 'Leda',
  Hiro: 'Achernar',
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
assert.match(agents, /name: 'Lucia \(Italian\)'/, 'Italian must be introduced as Lucia');
assert.match(agents, /'Achernar'/, 'Voice options must include Achernar');
for (const id of ['yuna','hiro','xiaoyu_tw','nicha_th','luca']) {
  assert.ok(intros.includes('  ' + id + ': {'), 'Unique introduction missing for ' + id);
}
console.log('PASS: ' + roster.length + ' ordered companions, 4 removed, 2 added, 5 validated softer/female voices and greetings');
