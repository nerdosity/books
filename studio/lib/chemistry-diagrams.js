export const CHEMISTRY_DIAGRAMS=['chair-flip','redox-shuttles'];
function chair(flipped) {
  // D3d chair coordinates: alternating heights give tetrahedral C–C–C angles.
  // This is a schematic orthographic projection, not an energy simulation.
  const h=Math.sqrt(1/32),sign=flipped?-1:1;
  const atoms=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3),Math.sin(i*Math.PI/3),sign*(i%2?-h:h)]);
  // View off the symmetry axes so adjacent bonds do not collapse into one line.
  const azimuth=10*Math.PI/180,elevation=15*Math.PI/180;
  const project=([x,y,z])=>[130+75*(Math.cos(azimuth)*x-Math.sin(azimuth)*y),
    120+75*(Math.sin(elevation)*(Math.sin(azimuth)*x+Math.cos(azimuth)*y)-Math.cos(elevation)*z)];
  const points=atoms.map(project),start=atoms[0];
  const end=flipped?[start[0]+.85,start[1],start[2]+.30]:[start[0],start[1],start[2]+.90];
  const a=points[0],b=project(end),f=n=>n.toFixed(1);
  return `<svg viewBox="0 0 300 210" role="img" aria-label="${flipped?'Sedia invertita: lo stesso sostituente su C1 è equatoriale e resta sopra.':'Prima sedia: il sostituente su C1 è assiale e rivolto sopra.'}">
    <polyline points="${[...points,points[0]].map(p=>p.map(f).join(',')).join(' ')}" fill="none" stroke="#405e55" stroke-width="4" stroke-linejoin="round"/>
    <path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}" stroke="#a35522" stroke-width="4"/>
    <circle cx="${f(a[0])}" cy="${f(a[1])}" r="6" fill="#174b42"/>
    <text x="${f(a[0]-18)}" y="${f(a[1]+24)}">C1</text>
    <text x="${f(b[0]+5)}" y="${f(b[1]-6)}" fill="#a35522">R</text>
    <text x="150" y="195" text-anchor="middle">${flipped?'Equatoriale · sopra':'Assiale · sopra'}</text>
  </svg>`;
}
export function chemistryDiagramHTML(kind) {
  if(kind==='chair-flip')return `<figure class="chemistry-diagram" data-chemistry-diagram="${kind}">
    <figcaption><strong>Lo stesso sostituente dopo l’inversione della sedia</strong></figcaption>
    <div class="chemistry-panels"><div><h3>Prima</h3>${chair(false)}</div><div><h3>Dopo</h3>${chair(true)}</div></div>
    <p>Il punto verde segue lo stesso carbonio C1. R, in arancione, passa da assiale a equatoriale ma resta sul lato “sopra”. Gli altri idrogeni sono omessi.</p>
    <p class="reading-note">Proiezioni schematiche originali di due sedie di un anello carbociclico. “Sopra” indica il lato rispetto al piano medio dell’anello, non la sola altezza sullo schermo. Non è un disegno del glucosio e non assegna α/β.</p>
    </figure>`;
  if(kind==='redox-shuttles')return `<figure class="chemistry-diagram" data-chemistry-diagram="${kind}">
    <figcaption><strong>Due percorsi per gli equivalenti del NADH citosolico</strong></figcaption>
    <div class="chemistry-panels">
      <div class="shuttle-path"><h3>Malato-aspartato</h3>
      <p><b>Citosol</b><br>NADH → NAD⁺<br>Ossalacetato → malato</p>
      <p class="shuttle-crossing">↓ Malato entra; il circuito si chiude con trasporti e transaminazioni</p>
      <p><b>Matrice</b><br>Malato → ossalacetato<br>NAD⁺ → NADH</p>
      <p class="shuttle-result">Complesso I → Q → catena<br>≈ 2,5 ATP per equivalente*</p></div>
      <div class="shuttle-path"><h3>Glicerolo-3-fosfato</h3>
      <p><b>Citosol</b><br>NADH → NAD⁺<br>DHAP → glicerolo-3-fosfato</p>
      <p class="shuttle-crossing">↓ Enzima mitocondriale FAD-dipendente riossida il glicerolo-3-fosfato</p>
      <p><b>Membrana interna</b><br>Elettroni al coenzima Q<br>Il complesso I è saltato</p>
      <p class="shuttle-result">Q → catena<br>≈ 1,5 ATP per equivalente*</p></div>
    </div>
    <p class="reading-note">Schema originale dei collegamenti redox, non della topologia completa. Le frecce seguono gli equivalenti riducenti: non indicano passaggio diretto del NADH. *Rapporti convenzionali del modello didattico; trasporti e accoppiamento rendono variabile la resa reale.</p>
    </figure>`;
  return '';
}
