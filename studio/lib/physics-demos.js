const number=x=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(Math.abs(x)<1e-12?0:x);
export const PHYSICS_DEMOS=['manometer','flux','attenuation'];
export function physicsDemoValue(kind,value) {
  if(kind==='manometer')return {difference:1000*9.8*value/100,absolute:100000+1000*9.8*value/100};
  if(kind==='flux')return {flux:100*.02*Math.cos(value*Math.PI/180)};
  if(kind==='attenuation')return {transmitted:100*Math.exp(-.2*value),removed:100*(1-Math.exp(-.2*value))};
  throw new Error('Schema non disponibile');
}
function graphic(kind,value) {
  const result=physicsDemoValue(kind,value);
  if(kind==='manometer'){
    const left=140+value,right=140-value;
    return `<svg viewBox="0 0 400 280" role="img" aria-label="Schema del tubo a U: il lato con pressione maggiore ha il livello del liquido più basso.">
      <text x="40" y="25">Gas da misurare</text><text x="235" y="25">Atmosfera</text>
      <path d="M100 55 V215 Q100 240 125 240 H275 Q300 240 300 215 V55" fill="none" stroke="#b6c2bd" stroke-width="34"/>
      <path d="M100 ${left} V215 Q100 240 125 240 H275 Q300 240 300 215 V${right}" fill="none" stroke="#4c98b3" stroke-width="26"/>
      <path d="M115 ${left} H335 M285 ${right} H335" fill="none" stroke="#345a50" stroke-dasharray="5 4"/>
      <path d="M335 ${left} V${right}" stroke="#a35522" stroke-width="3"/>
      <text x="143" y="90">h = ${number(value)} cm</text><text x="135" y="190">acqua in quiete</text>
      </svg><p><strong>p gas − p atmosfera = ${number(result.difference)} Pa</strong><br>p gas assoluta = ${number(result.absolute)} Pa</p>
      <p class="reading-note">h positivo: superficie destra più alta, gas a pressione maggiore. h negativo: superficie sinistra più alta. Atmosfera fissata a 100.000 Pa; g=9,8 m/s². Schema non in scala.</p>`;
  }
  if(kind==='flux'){
    return `<svg viewBox="0 0 400 280" role="img" aria-label="Il campo elettrico punta a destra. La superficie e la sua normale ruotano insieme; il flusso dipende dall’angolo tra normale e campo.">
      ${[80,140,200].map(y=>`<path d="M25 ${y} H375 l-10 -5 m10 5 l-10 5" stroke="#4c98b3" stroke-width="3" fill="none"/>`).join('')}
      <text x="20" y="38">Campo E →</text>
      <g transform="rotate(${-value} 200 140)"><path d="M200 65 V215" stroke="#a35522" stroke-width="7"/><path d="M200 140 H280 l-12 -6 m12 6 l-12 6" stroke="#174b42" stroke-width="3" fill="none"/><text x="260" y="125">n</text></g>
      <text x="110" y="260">θ fra campo e normale: ${number(value)}°</text></svg>
      <p><strong>Φ = 100 × 0,02 × cos(${number(value)}°) = ${number(result.flux)} N·m²/C</strong></p>
      <p class="reading-note">Superficie piana aperta di 0,02 m², vista di taglio in arancione; campo uniforme 100 N/C. Verde: normale orientata n. Ruotare la normale oltre 90° cambia il segno del flusso.</p>`;
  }
  const x=45+value*30,y=235-result.transmitted*1.8;
  const points=Array.from({length:101},(_,i)=>`${45+i*3},${235-180*Math.exp(-.02*i)}`).join(' ');
  return `<svg viewBox="0 0 400 280" role="img" aria-label="Grafico della trasmissione esponenziale: la percentuale diminuisce all’aumentare dello spessore.">
    <path d="M45 45 V235 H355" stroke="#345a50" stroke-width="2" fill="none"/>
    <text x="2" y="58">100%</text><text x="12" y="239">0%</text><text x="45" y="258">0</text><text x="325" y="258">10 cm</text>
    <text x="90" y="25">Intensità trasmessa / iniziale</text>
    <polyline points="${points}" fill="none" stroke="#174b42" stroke-width="3"/>
    <path d="M${x} 235 V${y} H45" stroke="#a35522" stroke-dasharray="4 4" fill="none"/>
    <circle cx="${x}" cy="${y}" r="6" fill="#a35522"/></svg>
    <p><strong>Trasmissione: ${number(result.transmitted)}%</strong> · Rimossa dal fascio: ${number(result.removed)}%</p>
    <p class="reading-note">μ=0,20 cm⁻¹; x=${number(value)} cm. Fascio monoenergetico stretto, materiale uniforme, radiazione diffusa raccolta trascurata. Il grafico mostra un modello didattico.</p>`;
}
export function physicsDemoHTML(kind) {
  if(!PHYSICS_DEMOS.includes(kind))return '';
  const config={manometer:['Dislivello orientato (cm)',-30,30,1,12],flux:['Angolo fra campo e normale (gradi)',0,180,15,60],attenuation:['Spessore (cm)',0,10,.5,5]}[kind];
  return `<div class="physics-demo" data-physics-demo="${kind}"><h3>Esplora lo schema</h3>
    <p class="reading-note no-print">Modifica un parametro e prevedi il risultato prima di leggerlo. Questa esplorazione non riceve un voto.</p>
    <label class="no-print">${config[0]}<input type="range" data-demo-control min="${config[1]}" max="${config[2]}" step="${config[3]}" value="${config[4]}"></label>
    <div class="physics-demo-view">${graphic(kind,config[4])}</div>
    <p class="reading-note">Schema originale incorporato, disponibile anche senza Internet.</p></div>`;
}
export function updatePhysicsDemo(input) {
  const panel=input.closest('[data-physics-demo]');
  if(!panel)return;
  const value=Number(input.value),min=Number(input.min),max=Number(input.max);
  if(!Number.isFinite(value)||value<min||value>max)return;
  panel.querySelector('.physics-demo-view').innerHTML=graphic(panel.dataset.physicsDemo,value);
}
