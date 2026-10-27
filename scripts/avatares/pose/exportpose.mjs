import { chromium } from 'playwright'; import fs from 'fs';
const jobs = [["antonio_final.glb","M","antonio",JSON.parse(fs.readFileSync('ik_final.json'))[0]],["lucia_final.glb","F","lucia",JSON.parse(fs.readFileSync('ik_lucia.json'))[1]]];
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const out = {};
for (const [m,body,id,P] of jobs) {
  const pg = await b.newPage({ viewport:{width:720,height:720} });
  pg.on('pageerror', e => console.log('PAGEERR', e.message));
  await pg.goto(`http://127.0.0.1:8765/pose2.html?m=${m}&b=${body}`);
  await pg.waitForFunction(() => window.ready || window.err, null, {timeout:180000});
  const tpl = await pg.evaluate((P) => { solve(P); const t=head.poseTemplates['cruzados'];
     const r={standing:true, props:{}}; for (const [k,v] of Object.entries(t.props)) r.props[k]=Object.fromEntries(Object.entries(v).map(([a,b])=>[a, typeof b==='number'? +b.toFixed(4): b])); return r; }, P);
  out[id] = tpl;
  // Prueba: como lo hará la app (todas las poses de mood -> cruzados, sin manos al hablar), mood enfadado, y versión reflejada
  await pg.evaluate(() => { const t=head.poseTemplates['cruzados']; for (const n of ['side','hip','straight','wide','turn']) head.poseTemplates[n]=t;
     head.speakWithHands=()=>{}; head.setMood('angry'); });
  await pg.waitForTimeout(6000); await pg.screenshot({ path:`final_${id}_angry.png` });
  await pg.evaluate(() => { head.setPoseFromTemplate(head.poseTemplates['cruzados'], 300); });
  await pg.waitForTimeout(2000); await pg.screenshot({ path:`final_${id}_mirror.png` });
  await pg.close();
}
fs.writeFileSync('poses_cruzados.json', JSON.stringify(out, null, 1));
await b.close();
