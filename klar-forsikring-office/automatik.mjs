// Klar Forsikring — skriver de kommandoer ud, der får kontoret og CRM-importen til at køre
// af sig selv, med jeres egne stier sat ind.
//
//   node <fuld sti>/klar-forsikring-office/automatik.mjs
//
// Den ændrer INGENTING. Den viser, hvad du skal køre, så du kan læse det først og kopiere det
// bagefter. Stierne herunder er maskinens egne — de er hentet fra den Node, der kører lige nu.
//
//   --windows --mac --linux   vis opskriften til et andet styresystem
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACK = path.dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;
const KOER = path.join(PACK, 'koer.mjs');
const VAGT = path.join(PACK, 'vaerktoj', 'importer-vagt.mjs');
const UDTRAEK = path.join(PACK, 'privat', 'udtraek');
const fed = s => `\u001b[1m${s}\u001b[0m`;

const valgt = ['windows', 'mac', 'linux'].find(p => process.argv.includes('--' + p))
  || { win32: 'windows', darwin: 'mac' }[process.platform] || 'linux';

console.log(fed('\nSådan kører det hele af sig selv\n'));
console.log(`Kontoret:     ${KOER}`);
console.log(`Importen:     ${VAGT}`);
console.log(`Udtrækkene:   ${UDTRAEK}`);
console.log(`Node:         ${NODE}\n`);
console.log('To ting skal på en tidsplan: kontoret skal køre hele tiden, og bestanden skal');
console.log('hentes ind hver morgen, så rutinerne regner på noget friskt.\n');

if (valgt === 'windows') {
  console.log(fed('Windows — kør de to linjer i PowerShell som administrator\n'));
  console.log('1) Kontoret starter, når du logger ind:\n');
  console.log(`schtasks /create /tn "Klarforsikring kontor" /sc onlogon /tr '"${NODE}" "${KOER}" --uden-opdatering'\n`);
  console.log('2) Bestanden hentes ind hver morgen kl. 05.30:\n');
  console.log(`schtasks /create /tn "Klarforsikring import" /sc daily /st 05:30 /tr '"${NODE}" "${VAGT}"'\n`);
  console.log(fed('Husk\n'));
  console.log('· Maskinen skal logge automatisk ind efter en genstart, ellers starter opgave 1 ikke.');
  console.log('· Sæt maskinen til aldrig at gå i dvale (Indstillinger → System → Strøm).');
  console.log('· Se dem bagefter i Opgavestyring, eller med:  schtasks /query /tn "Klarforsikring kontor"');
  console.log('· Fjern dem igen med:  schtasks /delete /tn "Klarforsikring kontor" /f\n');
} else if (valgt === 'mac') {
  const plist = (navn, args, ekstra) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>dk.klarforsikring.${navn}</string>
  <key>ProgramArguments</key><array>${args.map(a => `\n    <string>${a}</string>`).join('')}
  </array>
${ekstra}
  <key>StandardErrorPath</key><string>${path.join(PACK, 'privat', navn + '.log')}</string>
</dict></plist>`;
  console.log(fed('Mac — læg to filer i ~/Library/LaunchAgents/\n'));
  console.log(fed('~/Library/LaunchAgents/dk.klarforsikring.kontor.plist'));
  console.log(plist('kontor', [NODE, KOER, '--uden-opdatering'], '  <key>RunAtLoad</key><true/>\n  <key>KeepAlive</key><true/>') + '\n');
  console.log(fed('~/Library/LaunchAgents/dk.klarforsikring.import.plist'));
  console.log(plist('import', [NODE, VAGT], '  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>5</integer><key>Minute</key><integer>30</integer></dict>') + '\n');
  console.log(fed('Tænd dem\n'));
  console.log('launchctl load -w ~/Library/LaunchAgents/dk.klarforsikring.kontor.plist');
  console.log('launchctl load -w ~/Library/LaunchAgents/dk.klarforsikring.import.plist\n');
  console.log('· Slå dvale fra i Systemindstillinger → Batteri, ellers fyrer rutinerne ikke om natten.');
  console.log('· Sluk dem igen med  launchctl unload -w <filen>\n');
} else {
  console.log(fed('Linux — to systemd-enheder for din bruger\n'));
  console.log(fed('~/.config/systemd/user/klarforsikring-kontor.service'));
  console.log(`[Unit]
Description=Klarforsikring kontor
[Service]
ExecStart=${NODE} ${KOER} --uden-opdatering
Restart=always
[Install]
WantedBy=default.target\n`);
  console.log(fed('~/.config/systemd/user/klarforsikring-import.service'));
  console.log(`[Unit]
Description=Klarforsikring CRM-import
[Service]
Type=oneshot
ExecStart=${NODE} ${VAGT}\n`);
  console.log(fed('~/.config/systemd/user/klarforsikring-import.timer'));
  console.log(`[Unit]
Description=Klarforsikring CRM-import hver morgen
[Timer]
OnCalendar=*-*-* 05:30:00
Persistent=true
[Install]
WantedBy=timers.target\n`);
  console.log(fed('Tænd dem\n'));
  console.log('systemctl --user enable --now klarforsikring-kontor.service');
  console.log('systemctl --user enable --now klarforsikring-import.timer');
  console.log('loginctl enable-linger $USER    # så de kører, også når du ikke er logget ind\n');
}

console.log(fed('Når det kører\n'));
console.log(`· Læg CRM-udtrækket som .csv i  ${UDTRAEK}`);
console.log('  Importen tager den nyeste fil. Er der ikke kommet en ny, laver den ingenting.');
console.log(`· Logbogen over importerne står i  ${path.join(PACK, 'privat', 'import-log.txt')}`);
console.log('· Kontoret svarer på http://localhost:4520 — også når ingen har det åbent.');
console.log('· Rutiner, der vil sende noget, venter på dit tryk under WAITING ON APPROVAL.\n');
console.log(`Hele billedet står i ${path.join(PACK, 'AUTOMATIK.md')}\n`);
