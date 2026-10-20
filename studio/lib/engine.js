export const ENGINE_VERSION = 1;
export function random(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function shuffled(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export const fmt = n => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3, useGrouping: false }).format(n);
const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
const numberQuestion = (prompt, answer, unit, steps, hint, diagnoses = [], params = {}) =>
  ({ type: 'numeric', prompt, answer, answerUnit: unit, steps, hint, diagnoses, params, tolerance: 0.01 });
const d = (value, message, help) => ({ value, message, help });

export const generators = {
  adenylateCharge(r) {
    const atp=int(r,2,12),adp=int(r,2,8),amp=int(r,1,6),total=atp+adp+amp;
    const answer=(atp+adp/2)/total,help='metabolismo-controllo/carica';
    return {...numberQuestion(`Nello stesso compartimento si misurano ATP = ${atp}, ADP = ${adp} e AMP = ${amp} mmol/L. Calcola la carica energetica degli adenilati come numero fra 0 e 1, non in percentuale. Usa almeno tre decimali quando servono.`,answer,'adimensionale',
      [`Totale degli adenilati: ${atp} + ${adp} + ${amp} = ${total} mmol/L.`,
       `Numeratore ponderato: ${atp} + 0,5 × ${adp} = ${fmt(atp+adp/2)} mmol/L.`,
       `Carica = ${fmt(atp+adp/2)}/${total} = ${fmt(answer)}. Le unità si cancellano.`],
      'Somma tutti e tre gli adenilati al denominatore; al numeratore conta ATP per intero e ADP per metà.',
      [d(atp/total,'Il risultato coincide con ATP/totale: manca il contributo di metà ADP al numeratore.',help),
       d((atp+adp)/total,'Il risultato coincide con ADP contato per intero al numeratore: il suo peso è 0,5.',help),
       d(answer*100,'Il risultato coincide con la percentuale: viene richiesto il rapporto fra 0 e 1.',help)],
      {atp,adp,amp}),tolerance:0.001};
  },
  manometerOpen(r) {
    const density=[800,1000][int(r,0,1)],heightCm=int(r,2,30),sign=int(r,0,1)?1:-1,g=9.8,atmosphere=100000;
    const difference=sign*density*g*heightCm/100,answer=atmosphere+difference;
    return numberQuestion(`Un manometro a U aperto contiene liquido di densità ${density} kg/m³. Nel ramo del gas la superficie è ${heightCm} cm più ${sign>0?'bassa':'alta'} di quella nel ramo aperto. Con pressione atmosferica ${atmosphere} Pa e g = 9,8 m/s², calcola la pressione assoluta del gas in Pa. Trascurane la colonna e considera il liquido in quiete.`,answer,'Pa',
      [`Il livello del gas è più ${sign>0?'basso: il gas ha pressione maggiore':'alto: il gas ha pressione minore'} dell’atmosfera.`,
        `Il dislivello è ${heightCm}/100 = ${fmt(heightCm/100)} m; |Δp| = ρgh = ${fmt(Math.abs(difference))} Pa.`,
        `p gas = ${atmosphere} ${sign>0?'+':'−'} ${fmt(Math.abs(difference))} = ${fmt(answer)} Pa.`],
      'Prima individua quale pressione è maggiore; poi aggiungi la differenza al riferimento atmosferico con il segno corretto.',
      [d(atmosphere-difference,'Il risultato coincide con il dislivello interpretato col segno opposto. Una pressione maggiore spinge il liquido più in basso nel proprio ramo.','fisica-idrostatica/manometro'),
       d(difference,'Questo è il valore della pressione relativa: viene chiesta quella assoluta, che comprende il riferimento atmosferico.','fisica-idrostatica/pressioni')],{density,heightCm,sign,g,atmosphere});
  },
  floatingFraction(r) {
    const bodyDensity=int(r,2,9)*100,fluidDensity=[1000,1200][int(r,0,1)],answer=100*bodyDensity/fluidDensity;
    return numberQuestion(`Un corpo omogeneo di densità ${bodyDensity} kg/m³ galleggia liberamente fermo in un liquido di densità ${fluidDensity} kg/m³. Quale percentuale del volume totale è immersa? Trascurare aria e tensione superficiale; nessun contatto o altro sostegno.`,answer,'%',
      ['Equilibrio verticale: ρ fluido g V immerso = ρ corpo g V totale.',
        `V immerso/V totale = ${bodyDensity}/${fluidDensity} = ${fmt(answer/100)}.`,
        `La percentuale immersa è ${fmt(answer)}%. Il rapporto inferiore a uno è compatibile con il galleggiamento parziale.`],
      'La densità del corpo va al numeratore; per la percentuale moltiplica il rapporto per 100.',
      [d(100*fluidDensity/bodyDensity,'Il risultato coincide con il rapporto invertito e supera il 100%: non è una frazione immersa possibile per questo galleggiante.','fisica-idrostatica/galleggia'),
       d(answer/100,'Il valore coincide con la frazione decimale: il campo richiede la percentuale.','fisica-idrostatica/galleggia')],{bodyDensity,fluidDensity});
  },
  apparentWeight(r) {
    const liters=int(r,1,5),mass=liters*int(r,2,4),density=1000,g=9.8,buoyancy=density*g*liters/1000,answer=mass*g-buoyancy;
    return numberQuestion(`Un corpo di massa ${mass} kg e volume ${liters} L è appeso fermo a un dinamometro e completamente immerso in acqua (ρ = 1000 kg/m³). Non tocca fondo o pareti e non trattiene bolle. Con g = 9,8 m/s², quale tensione legge lo strumento in N? Trascurare la spinta dell’aria.`,answer,'N',
      [`V = ${liters} L = ${fmt(liters/1000)} m³; peso mg = ${fmt(mass*g)} N.`,
        `Spinta: ρgV = ${fmt(buoyancy)} N.`,
        `T + F_A = mg, quindi T = ${fmt(mass*g)} − ${fmt(buoyancy)} = ${fmt(answer)} N.`],
      'Disegna peso verso il basso, tensione e spinta verso l’alto. Il litro va convertito in m³.',
      [d(mass*g,'Questo è il peso mg: manca la spinta verso l’alto esercitata dall’acqua.','fisica-idrostatica/apparente'),
       d(mass*g+buoyancy,'Il valore coincide con peso più spinta: la spinta riduce la tensione necessaria, non la aumenta.','fisica-idrostatica/apparente')],{liters,mass,density,g});
  },
  gaussFlux(r) {
    const insideNanoC=int(r,1,9),outsideNanoC=int(r,1,6),epsilon=8.854e-12,answer=insideNanoC*1e-9/epsilon;
    return numberQuestion(`Una superficie chiusa nel vuoto racchiude carica netta +${insideNanoC} nC; una carica +${outsideNanoC} nC si trova all’esterno. Calcola il flusso elettrico netto uscente in N·m²/C. Usa ε₀ = 8,854×10⁻¹² C²/(N·m²) e almeno due decimali.`,answer,'N·m²/C',
      ['Gauss: Φ_E = Q interna/ε₀; la carica esterna non aggiunge flusso netto.',
        `Q interna = ${insideNanoC} × 10⁻⁹ C.`,
        `Φ_E = (${insideNanoC} × 10⁻⁹)/(8,854 × 10⁻¹²) = ${fmt(answer)} N·m²/C.`],
      'Conta soltanto la carica netta interna, poi converti nC in C.',
      [d((insideNanoC+outsideNanoC)*1e-9/epsilon,'Il risultato coincide con la somma di carica interna ed esterna: la legge per la superficie chiusa usa soltanto quella interna.','fisica-campi/gauss'),
       d(-answer,'Il segno è opposto: con normale uscente e carica interna positiva il flusso netto è positivo.','fisica-campi/gauss')],{insideNanoC,outsideNanoC,epsilon});
  },
  faradayEmf(r) {
    const turns=int(r,1,5)*20,areaCm2=int(r,1,5)*20,initialMilliT=int(r,1,4)*10,deltaMilliT=int(r,1,5)*10,timeMs=int(r,1,5)*20;
    const answer=turns*areaCm2*deltaMilliT/(10*timeMs);
    return numberQuestion(`Una bobina fissa di ${turns} spire, ciascuna di area ${areaCm2} cm², è attraversata da un campo uniforme normale al piano. B aumenta linearmente da ${initialMilliT} a ${initialMilliT+deltaMilliT} mT in ${timeMs} ms. Calcola il modulo della fem indotta in mV. Tutte le spire sono attraversate dallo stesso flusso.`,answer,'mV',
      [`A = ${areaCm2}×10⁻⁴ m²; ΔB = ${deltaMilliT}×10⁻³ T; Δt = ${timeMs}×10⁻³ s.`,
        'Il campo è normale al piano: |ε| = N A |ΔB|/Δt.',
        `|ε| = ${fmt(answer/1000)} V = ${fmt(answer)} mV. Il verso si ricava separatamente con Lenz.`],
      'Serve la variazione di B, non B finale. Converti l’area, il tempo e infine volt in millivolt.',
      [d(answer/turns,'Il valore coincide con la fem di una sola spira: manca il numero di spire collegate.','fisica-campi/induzione'),
       d(turns*areaCm2*(initialMilliT+deltaMilliT)/(10*timeMs),'Il risultato coincide con l’uso di B finale al posto di ΔB.','fisica-campi/induzione'),
       d(answer*10000,'Il risultato coincide con la mancata conversione dell’area da cm² a m².','fisica-campi/induzione')],{turns,areaCm2,initialMilliT,deltaMilliT,timeMs});
  },
  attenuation(r) {
    const mu=int(r,1,5)/10,thickness=int(r,1,10)/2,answer=100*Math.exp(-mu*thickness);
    return numberQuestion(`Un fascio monoenergetico stretto attraversa un materiale uniforme con μ = ${fmt(mu)} cm⁻¹ e spessore x = ${fmt(thickness)} cm. Trascurando la radiazione diffusa raccolta dal rivelatore, quale percentuale dell’intensità primaria viene trasmessa? Usa I/I₀ = exp(−μx).`,answer,'%',
      [`Il prodotto μx = ${fmt(mu)} × ${fmt(thickness)} = ${fmt(mu*thickness)} è adimensionale.`,
        `I/I₀ = exp(−${fmt(mu*thickness)}) = ${fmt(answer/100)}.`,
        `Trasmissione = ${fmt(answer)}%; la frazione rimossa, diversa da quella richiesta, è ${fmt(100-answer)}%.`],
      'Usa l’esponenziale negativo e moltiplica la frazione trasmessa per 100.',
      [d(100-answer,'Il valore coincide con la percentuale rimossa dal fascio: viene chiesta quella trasmessa.','fisica-immagini/attenuazione'),
       d(100*Math.exp(mu*thickness),'L’esponente ha il segno opposto: nel modello passivo la trasmissione non supera il 100%.','fisica-immagini/attenuazione')],{mu,thickness});
  },
  bufferPH(r) {
    const pka=int(r,40,80)/10, acid=int(r,1,5)*10, ratio=[0.2,0.5,2,5][int(r,0,3)], base=acid*ratio;
    const answer=pka+Math.log10(base/acid);
    return numberQuestion(`Un tampone ideale contiene HA ${acid} mmol/L e A⁻ ${fmt(base)} mmol/L; pKa = ${fmt(pka)}. Usa Henderson–Hasselbalch, trascura le correzioni di attività e calcola il pH a due decimali. Inserisci “pH” nel campo unità come etichetta del risultato adimensionale.`,answer,'pH',
      ['pH = pKa + log₁₀([A⁻]/[HA]).',`Il rapporto base/acido è ${fmt(base)}/${acid} = ${fmt(ratio)}; le unità si semplificano.`,
        `pH = ${fmt(pka)} + (${fmt(Math.log10(ratio))}) = ${fmt(answer)}. Il pH è adimensionale.`],
      'Dividi la concentrazione della base coniugata per quella dell’acido; applica il logaritmo in base 10.',
      [d(pka-Math.log10(ratio),'Il risultato coincide con il rapporto acido/base invertito: nella formula compare [A⁻]/[HA].','chimica-equilibri/henderson'),
       d(pka+ratio,'Il valore coincide con pKa più il rapporto non trasformato: manca il logaritmo in base 10.','chimica-equilibri/henderson')],{pka,acid,base});
  },
  fattyAcidYield(r) {
    const carbons=14+2*int(r,0,3),acetyl=carbons/2,cycles=acetyl-1,answer=4*cycles+10*acetyl-2;
    return numberQuestion(`Calcola la resa convenzionale netta della completa ossidazione di un acido grasso libero, lineare, saturo C${carbons}, a catena pari. Includi attivazione, beta-ossidazione mitocondriale, Krebs e riossidazione dei coenzimi. Usa 2,5 ATP/NADH, 1,5 ATP per coppia elettronica FAD-dipendente e 10 ATP per acetil-CoA; attivazione = 2 equivalenti ATP.`,answer,'ATP',
      [`${carbons} carboni producono ${acetyl} acetil-CoA; i cicli sono ${acetyl} − 1 = ${cycles}.`,
        `Dalla spirale: ${cycles} × (2,5 + 1,5) = ${cycles*4} ATP equivalenti; dagli acetili: ${acetyl} × 10 = ${acetyl*10}.`,
        `Totale netto: ${cycles*4} + ${acetyl*10} − 2 = ${answer} ATP equivalenti. È la resa del modello dichiarato.`],
      'Conta prima acetili e cicli: nell’ultimo ciclo un frammento C4 dà due acetili.',
      [d(answer+2,'Il risultato coincide con il totale senza costo di attivazione: il problema parte da un acido grasso libero.','lipidi-ossidazione/ingresso'),
       d(answer+4,'Il risultato coincide con un ciclo di beta-ossidazione in più: i cicli sono uno in meno degli acetili.','lipidi-ossidazione/cicli')],{carbons,acetyl,cycles});
  },
  conversion(r) {
    const speed = int(r, 2, 12), kmh = speed * 3.6;
    return numberQuestion(`Un tapis roulant è impostato a ${fmt(kmh)} km/h. Esprimi la velocità in m/s.`, speed, 'm/s',
      ['1 km = 1000 m; 1 h = 3600 s.', 'Il fattore di conversione è 1000/3600 = 1/3,6.', `${fmt(kmh)} / 3,6 = ${speed} m/s.`],
      'Per passare da km/h a m/s dividi per 3,6.',
      [d(kmh * 3.6, 'Il risultato coincide con la moltiplicazione per 3,6: quella è la conversione inversa.', 'cinematica/unita'),
        d(kmh, 'Il valore è rimasto quello in km/h: controlla la conversione.', 'cinematica/unita')], { kmh });
  },
  speed(r) {
    const time = int(r, 8, 24), speed = int(r, 2, 8), distance = speed * time;
    return numberQuestion(`Un'atleta percorre ${distance} m in linea retta, senza cambiare verso, in ${time} s. Qual è il modulo della velocità media, in m/s?`, speed, 'm/s',
      [`Spostamento = ${distance} m; tempo = ${time} s.`, 'v media = spostamento / tempo.', `v = ${distance} / ${time} = ${speed} m/s.`],
      'Dividi lo spostamento per il tempo.',
      [d(time / distance, 'Il risultato coincide con tempo/spazio: controlla l’ordine della divisione.', 'cinematica/velocita'),
        d(distance * time, 'Il risultato coincide con spazio × tempo: qui serve un rapporto.', 'cinematica/velocita')], { distance, time });
  },
  acceleration(r) {
    const initial = int(r, 1, 4), time = int(r, 2, 5), acceleration = int(r, 1, 3), final = initial + time * acceleration;
    return numberQuestion(`Nel moto rettilineo di un carrello, la velocità passa da ${initial} a ${final} m/s in ${time} s, nello stesso verso positivo. Calcola l'accelerazione media in m/s².`, acceleration, 'm/s²',
      [`Δv = ${final} − ${initial} = ${final - initial} m/s.`, 'a media = Δv / Δt.', `a = ${final - initial} / ${time} = ${acceleration} m/s².`],
      'Sottrai prima la velocità iniziale a quella finale.',
      [d(final / time, 'Il valore coincide con v finale/tempo: potrebbe mancare la sottrazione della velocità iniziale.', 'cinematica/accelerazione'),
        d((final - initial) * time, 'Il valore coincide con Δv × tempo: controlla il denominatore.', 'cinematica/accelerazione')], { initial, final, time });
  },
  force(r) {
    const mass = int(r, 2, 12) * 5, acceleration = int(r, 1, 6) / 2;
    return numberQuestion(`Un corpo di massa ${mass} kg ha accelerazione di modulo ${fmt(acceleration)} m/s² in un riferimento inerziale. Quanto vale il modulo della forza risultante, in N?`, mass * acceleration, 'N',
      ['La seconda legge di Newton usa la forza risultante.', 'F = m × a.', `F = ${mass} × ${fmt(acceleration)} = ${fmt(mass * acceleration)} N.`],
      'Moltiplica la massa per l’accelerazione; non serve la gravità.',
      [d(mass * 9.81, 'Il risultato coincide con il peso mg, che non è la risultante richiesta.', 'forze/peso'),
        d(mass / acceleration, 'Il valore coincide con massa/accelerazione: la legge richiede un prodotto.', 'forze/newton')], { mass, acceleration });
  },
  kinetic(r) {
    const mass = int(r, 2, 10), speed = int(r, 2, 8);
    return numberQuestion(`Un oggetto di massa ${mass} kg si muove a ${speed} m/s. Calcola l'energia cinetica traslazionale, in J.`, .5 * mass * speed ** 2, 'J',
      ['Ec = 1/2 × m × v².', `v² = ${speed}² = ${speed ** 2} m²/s².`, `Ec = 0,5 × ${mass} × ${speed ** 2} = ${fmt(.5 * mass * speed ** 2)} J.`],
      'Eleva prima la velocità al quadrato; ricordati il fattore 1/2.',
      [d(.5 * mass * speed, 'Il valore coincide con mv/2: potrebbe mancare il quadrato della velocità.', 'forze/cinetica'),
        d(mass * speed ** 2, 'Il valore coincide con mv²: potrebbe mancare il fattore 1/2.', 'forze/cinetica')], { mass, speed });
  },
  torque(r) {
    const force = int(r, 2, 12) * 10, cm = int(r, 2, 8) * 5;
    return numberQuestion(`Una forza di ${force} N ha un braccio perpendicolare di ${cm} cm rispetto al fulcro. Calcola il modulo del momento in N·m.`, force * cm / 100, 'N·m',
      [`Converti il braccio: ${cm} cm = ${fmt(cm / 100)} m.`, 'M = F × b.', `M = ${force} × ${fmt(cm / 100)} = ${fmt(force * cm / 100)} N·m.`],
      'Il braccio va espresso in metri prima del prodotto.',
      [d(force * cm, 'Il valore coincide con forza × braccio in centimetri: manca probabilmente la conversione in metri.', 'cinematica/unita'),
        d(force / (cm / 100), 'Il risultato coincide con F/b: il momento è F × b.', 'leve/momento')], { force, cm });
  },
  lever(r) {
    const load = int(r, 2, 10) * 10, muscle = int(r, 3, 6), ratio = int(r, 3, 8), external = muscle * ratio;
    return numberQuestion(`Modello statico del gomito: carico ${load} N, braccio esterno perpendicolare ${external} cm, braccio muscolare perpendicolare ${muscle} cm. Trascurando il peso dell'avambraccio e altri momenti, quale forza muscolare in N equilibra il carico?`, load * ratio, 'N',
      ['Imposta momenti opposti uguali: F muscolo × b muscolo = F carico × b carico.',
        'Isola F muscolo = F carico × b carico / b muscolo.',
        `F muscolo = ${load} × ${external} / ${muscle} = ${load * ratio} N. I due bracci sono nella stessa unità e il rapporto è adimensionale.`],
      'La forza muscolare moltiplicata per il suo braccio deve bilanciare il momento del carico.',
      [d(load / ratio, 'Il risultato coincide con il rapporto dei bracci invertito: il braccio muscolare più corto richiede una forza maggiore.', 'leve/equilibrio'),
        d(load, 'La forza non coincide con il carico quando i bracci sono diversi.', 'leve/equilibrio')], { load, muscle, external });
  },
  genetics(r) {
    const cases = [
      { p1:'Aa', p2:'Aa', target:'aa', n:1, combinations:'AA, Aa, aA, aa' },
      { p1:'Aa', p2:'Aa', target:'Aa (incluso aA)', n:2, combinations:'AA, Aa, aA, aa' },
      { p1:'Aa', p2:'aa', target:'aa', n:2, combinations:'Aa, Aa, aa, aa' },
      { p1:'AA', p2:'aa', target:'Aa', n:4, combinations:'Aa, Aa, Aa, Aa' }
    ];
    const c = cases[int(r, 0, cases.length - 1)];
    return numberQuestion(`In un modello mendeliano autosomico, incrocia ${c.p1} × ${c.p2}. Qual è la probabilità percentuale del genotipo ${c.target}? Considera segregazione regolare e fecondazioni equiprobabili.`, c.n * 25, '%',
      ['Elenca gli alleli presenti nei gameti di ciascun genitore.', `Le quattro caselle equiprobabili del quadrato sono: ${c.combinations}.`,
        `${c.n} caselle favorevoli su 4: ${c.n}/4 × 100 = ${c.n * 25}%.`],
      'Costruisci le quattro caselle del quadrato di Punnett e conta il genotipo richiesto.',
      [d(c.n / 4, 'Il valore coincide con una probabilità frazionaria: il campo richiede la percentuale, quindi moltiplica per 100.', 'mendel/incrocio')], c);
  },
  atp(r) {
    const glucose = int(r, 2, 12);
    return numberQuestion(`Considera ${glucose} molecole di glucosio libero avviate alla glicolisi completa fino a piruvato. Quante molecole di ATP si guadagnano al netto dell'investimento iniziale? Escludi ogni produzione successiva.`, glucose * 2, 'ATP',
      ['Per ogni glucosio libero: 4 ATP prodotti e 2 investiti.', 'Guadagno netto = 2 ATP per glucosio.', `${glucose} × 2 = ${glucose * 2} molecole di ATP nette.`],
      'Usa il guadagno netto per molecola di glucosio, non la produzione lorda.',
      [d(glucose * 4, 'Il valore coincide con la produzione lorda: manca la sottrazione degli ATP investiti.', 'energia/glicolisi')], { glucose });
  },
  enzyme(r) {
    const vmax = int(r, 4, 20) * 10;
    return numberQuestion(`Un enzima segue il modello di Michaelis–Menten. Vmax = ${vmax} unità/min e [S] = Km. Calcola v in unità/min.`, vmax / 2, 'unità/min',
      ['v = Vmax[S]/(Km + [S]).', 'Con [S] = Km: v = Vmax Km/(2Km) = Vmax/2.', `v = ${vmax}/2 = ${vmax / 2} unità/min.`],
      'Quando [S] = Km la velocità è metà di quella massima.',
      [d(vmax, 'Hai inserito Vmax: con [S] = Km non si è alla velocità massima.', 'enzimi/saturazione'),
        d(vmax * 2, 'Il valore supera Vmax e non è compatibile con questo modello.', 'enzimi/saturazione')], { vmax });
  },
  molarity(r) {
    const mass = int(r,1,10)*9, molarMass=180, volume=int(r,1,5)/2, answer=mass/molarMass/volume;
    return numberQuestion(`Sciogli ${mass} g di glucosio (massa molare ${molarMass} g/mol) e porti la soluzione al volume finale di ${fmt(volume)} L. Calcola la concentrazione in mol/L.`,answer,'mol/L',
      [`n = m/M = ${mass}/${molarMass} = ${fmt(mass/molarMass)} mol.`,`Usa il volume finale della soluzione: ${fmt(volume)} L.`,`c = n/V = ${fmt(answer)} mol/L.`],
      'Prima converti i grammi in moli; poi dividi per il volume finale in litri.',
      [d(mass/volume,'Questo valore coincide con la concentrazione in g/L: manca la divisione per la massa molare.','chimica/moli')],{mass,molarMass,volume});
  },
  dilution(r) {
    const initial=int(r,2,8)/10, factor=int(r,2,10), finalVolume=int(r,2,10)*100, target=initial/factor, answer=finalVolume/factor;
    return numberQuestion(`Da una soluzione ${fmt(initial)} mol/L vuoi preparare ${finalVolume} mL finali a concentrazione esattamente ${factor} volte minore. Quanti mL di soluzione iniziale devi prelevare? Supponi assenza di reazioni e perdite.`,answer,'mL',
      ['Durante la diluizione si conservano le moli: c₁V₁ = c₂V₂.',`c₂/c₁ = 1/${factor}; V₁ = V₂/${factor}.`,`Preleva ${fmt(answer)} mL e aggiungi solvente fino al volume finale di ${finalVolume} mL.`],
      'Il volume prelevato è il volume finale diviso per il fattore di diluizione.',
      [d(finalVolume-answer,'Il valore coincide con la differenza fra volume finale e prelevato: viene richiesto il volume di soluzione iniziale.','chimica/diluizioni')],{initial,target,factor,finalVolume});
  },
  michaelis(r) {
    const vmax=int(r,5,20)*12, km=int(r,1,8), multiplier=int(r,2,5), substrate=km*multiplier, answer=vmax*substrate/(km+substrate);
    return numberQuestion(`Un enzima segue Michaelis–Menten: Vmax = ${vmax} unità/min, Km = ${km} mmol/L, [S] = ${substrate} mmol/L. Calcola la velocità iniziale in unità/min.`,answer,'unità/min',
      ['v = Vmax[S]/(Km + [S]).',`Il denominatore è ${km} + ${substrate} = ${km+substrate} mmol/L.`,`v = ${vmax} × ${substrate} / ${km+substrate} = ${fmt(answer)} unità/min.`],
      'Km e [S] sono già nella stessa unità. Sommale al denominatore.',
      [d(vmax/2,'Il valore coincide con Vmax/2, valido quando [S] = Km; qui le concentrazioni sono diverse.','cinetica-enzimi/michaelis')],{vmax,km,substrate});
  },
  krebsYield(r) {
    const acetyl=int(r,1,8), answer=acetyl*10;
    return numberQuestion(`Considera soltanto ${acetyl} giri di Krebs, uno per acetil-CoA. Ogni giro produce 3 NADH, 1 equivalente FADH₂ e 1 GTP. Usa 2,5 ATP/NADH, 1,5 ATP/FADH₂ e 1 ATP/GTP. Quanti ATP equivalenti convenzionali ottieni, includendo la riossidazione dei coenzimi? Escludi ogni altra tappa.`,answer,'ATP',
      ['Per giro: 3 × 2,5 + 1 × 1,5 + 1 = 10 ATP equivalenti.',`Per ${acetyl} giri: ${acetyl} × 10 = ${answer}.`,'È un bilancio convenzionale, non una resa esatta universale.'],
      'Calcola prima il contributo di un giro; poi moltiplica.',
      [d(acetyl*9,'Il valore coincide con i soli coenzimi ridotti: manca il GTP equivalente per giro.','mitocondri/bilancio')],{acetyl});
  },
  vectorMagnitude(r) {
    const scale=int(r,1,8), x=3*scale, y=4*scale, answer=5*scale;
    return numberQuestion(`Una forza ha componenti perpendicolari Fx = ${x} N e Fy = ${y} N. Calcola il modulo della forza in N.`,answer,'N',
      ['Per assi perpendicolari: F = √(Fx² + Fy²).',`F = √(${x}² + ${y}²) = √${x*x+y*y} = ${answer} N.`],
      'Usa Pitagora sulle componenti, non la somma dei moduli.',
      [d(x+y,'Il risultato coincide con Fx + Fy: le componenti sono perpendicolari, non concordi sulla stessa linea.','vettori/componenti')],{x,y});
  },
  impulseForce(r) {
    const mass=int(r,1,8), speed=int(r,2,8), time=int(r,2,10)/10, answer=mass*speed/time;
    return numberQuestion(`Un oggetto di massa ${mass} kg si arresta da ${speed} m/s in ${fmt(time)} s. Calcola il modulo della forza risultante media in N, lungo la direzione iniziale del moto. Non è richiesta una singola forza di contatto.`,answer,'N',
      [`Il modulo di Δp è m × |vf − vi| = ${mass} × ${speed} = ${mass*speed} kg·m/s.`,`|F media| = |Δp|/Δt = ${mass*speed}/${fmt(time)} = ${fmt(answer)} N.`,'Il verso della risultante media è opposto al moto iniziale.'],
      'Il modulo dell’impulso è massa per variazione del modulo della velocità in questo arresto rettilineo.',
      [d(mass*speed,'Questo valore coincide con l’impulso: per ottenere la forza media devi dividere per la durata.','impulso/impulso')],{mass,speed,time});
  },
  flowSpeed(r) {
    const area=int(r,2,10), speed=int(r,2,12), flow=area*speed;
    return numberQuestion(`Un fluido incomprimibile attraversa una sezione di area ${area} cm² con portata ${flow} cm³/s. Qual è la velocità media su quella sezione, in cm/s?`,speed,'cm/s',
      ['Q = A v, quindi v = Q/A.',`v = ${flow}/${area} = ${speed} cm/s.`,'Le unità cm³/s divise per cm² danno cm/s.'],
      'Dividi la portata per l’area; tutte le lunghezze sono già espresse in centimetri.',
      [d(flow*area,'Il valore coincide con Q × A: la velocità si ottiene dividendo per la sezione.','fluidodinamica/continuita')],{area,flow});
  },
  ohmCurrent(r) {
    const resistance=int(r,2,12), current=int(r,1,8)/2, voltage=resistance*current;
    return numberQuestion(`Un resistore ohmico ideale da ${resistance} Ω è sottoposto a ${fmt(voltage)} V. Calcola la corrente in A.`,current,'A',
      ['V = RI, quindi I = V/R.',`I = ${fmt(voltage)}/${resistance} = ${fmt(current)} A.`],
      'Isola I nella legge V = RI.',
      [d(voltage*resistance,'Il risultato coincide con V × R: la legge richiede V/R.','elettricita/ohm')],{resistance,voltage});
  }
};
export function makeQuestion(definition, seed = 1) {
  const rng = random(seed);
  const q = definition.generator
    ? { ...definition, ...generators[definition.generator](rng) }
    : { ...definition, options: shuffled(definition.options, rng) };
  return { ...q, seed, engineVersion: ENGINE_VERSION };
}
export function parseNumber(raw) {
  const text = String(raw).trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
export function expectedText(q) {
  return q.type === 'choice' ? q.options.find(o => o.id === q.answer).text : `${fmt(q.answer)} ${q.answerUnit}`;
}
export function checkAnswer(q, answer, unit) {
  if (q.type === 'choice') {
    const option = q.options.find(o => o.id === answer);
    if (!option) return { valid: false, message: 'Scegli una risposta prima di verificare.' };
    const correct = option.id === q.answer;
    return { valid: true, correct, answerText: option.text, message: correct ? q.explanation : option.feedback,
      help: correct ? q.help : option.help, steps: [q.explanation] };
  }
  const value = parseNumber(answer);
  if (value === null) return { valid: false, message: 'Inserisci un numero: puoi usare la virgola, il punto o la notazione 1e3. Scegli l’unità a parte.' };
  if (!unit) return { valid: false, message: 'Scegli anche l’unità di misura.' };
  if (unit !== q.answerUnit) return { valid: true, correct: false, answerText: `${answer} ${unit}`,
    message: `L'unità richiesta è ${q.answerUnit}. Controlla quale grandezza stai calcolando prima del valore numerico.`,
    help: ['cinematica','forze','leve'].includes(q.unit) ? 'cinematica/unita' : q.help, steps: q.steps };
  const correct = Math.abs(value - q.answer) <= q.tolerance + 1e-10;
  const diagnosis = !correct && q.diagnoses.find(diag => Math.abs(value - diag.value) <= q.tolerance + 1e-10);
  return { valid: true, correct, answerText: `${answer} ${unit}`, steps: q.steps,
    message: correct ? 'Risultato e unità corretti.' : diagnosis?.message || 'Il risultato non coincide. Dal solo numero non posso stabilire la causa: confronta formula, sostituzione dei dati e calcolo con i passaggi qui sotto.',
    help: diagnosis?.help || q.help };
}
export function sessionScore(attempts, total) {
  const correct = attempts.filter(a => a.correct).length;
  return { correct, total, answered: attempts.length, assisted: attempts.filter(a => a.assisted).length,
    grade: total ? Math.round(correct / total * 300) / 10 : 0 };
}
export function reviewQueue(attempts) {
  const last = new Map();
  for (const a of [...attempts].sort((a,b) => a.at.localeCompare(b.at))) last.set(a.qid, a);
  return [...last.values()].filter(a => !a.correct || a.assisted).reverse();
}
