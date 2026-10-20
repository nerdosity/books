# Studio · Scienze motorie e sportive

Uno spazio locale per **studiare direttamente nelle pagine**, svolgere esercizi e capire gli errori. Non richiede account, servizi a pagamento o l'acquisto dei manuali per usare le lezioni presenti.

**Lavoro in pausa su richiesta dell’utente.** Il punto di ripresa e le parti mancanti per tutti e dieci gli esami sono in [SEGNALIBRO.txt](SEGNALIBRO.txt), nella scrivania e nelle schede degli esami. Ultimo blocco concluso: ampliamento di Anatomia su tronco, pelvi e rotatori profondi. Nessun esame è ancora marcato integralmente completato.

## Aprire

Distribuisci la cartella **`pronto`**. Contiene un solo file:

```text
pronto/
  index.html
```

**Doppio clic su `index.html` e si studia.** Serve solo un browser moderno. Non servono Node.js, installazioni, server o comandi per chi studia. Grafica, tavole, codice e contenuti scritti sono incorporati nel file. L’ascolto ElevenLabs è facoltativo: Internet serve per generare la prima copia di un audio, poi la cache consente di riascoltarlo offline.

## Compilare una nuova copia (solo per chi la prepara)

Dalla cartella `studio`:

```text
npm run build
```

Serve Node.js 20 o successivo sul tuo PC; nessun `npm install`. La compilazione verifica i contenuti e genera `pronto/index.html`. Per aggiornare la copia basta sostituire il `index.html` nella stessa cartella, mantenendo lo stesso nome. I progressi sono separati dal materiale didattico.

Il file è pronto anche per essere inviato da solo. Se arriva in uno ZIP, va estratto prima di aprirlo, così il percorso di salvataggio rimane stabile.

## Cosa contiene

- Scrivania organizzata sui **10 insegnamenti del primo anno UniBa 2026/27**, per 61 CFU; moduli interni ai corsi integrati.
- 149 lezioni originali, 580 sezioni e circa 114.200 parole di spiegazioni, esempi e punti da ricordare (esclusi tabelle, quiz e risposte aperte).
- 998 quiz, con feedback specifico per ogni risposta errata e selezione fra fondamenti e applicazione; comprese interpretazione di tavole anatomiche e comprensione di brani inglesi.
- 27 generatori numerici, compresi molarità, diluizioni, cinetica enzimatica, carica energetica, bilanci metabolici, meccanica, circuiti, pH dei tamponi, manometri, frazione immersa, peso apparente, flusso di Gauss, fem indotta e attenuazione.
- 129 prove aperte, con risposta ragionata e criteri di autoconfronto, comprese produzione scritta in inglese e progettazione educativa; nessun voto automatico al testo libero.
- Biochimica ampliata con digestione e ricambio proteico, vitamine/coenzimi, vie amminoacidiche e ammine biogene, catabolismo dell’eme, nucleotidi e difese redox: 5 nuove lezioni, 40 quiz e 5 prove aperte. Comprende bilanci GSH/NADPH e casi integrati con soluzioni.
- Due ulteriori lezioni coordinano isoenzimi, carica energetica, fermentazione alcolica, ciclo dei triacilgliceroli, forme A/B/Z, genoma, piccoli RNA e cAMP: 24 quiz, due prove aperte e calcoli a dati variabili. Il confronto mirato registra sette voci del programma storico.
- Composizione corporea, nutrienti, strutture cellulari, cloroplasti e genetica batterica/virale hanno tre capitoli con tabelle di confronto e casi. Lo sviluppo iniziale comprendeva 36 quiz e tre prove aperte; ulteriori verifiche sono state aggiunte durante il confronto del programma.
- Biologia applicata: confronto editoriale delle 44 voci del blocco 2016/17, una nuova lezione con pedigree originale e 36 ulteriori quiz. Divisioni, conteggi n/C, non-disgiunzione, probabilità condizionate e modelli di ereditarietà hanno casi svolti e prova aperta. Ampliati replicazione, trascrizione, maturazione dell’RNA, traduzione, apoptosi e calcoli di popolazione. L’audit storico di Biochimica è documentato separatamente; la corrispondenza al programma attuale resta aperta.
- Ulteriori 4 lezioni di chimica e metabolismo, 32 quiz e 4 prove aperte: Lewis e cariche, equilibrio e cinetica, concentrazioni e Henry, aromaticità e reazioni organiche, trasportatori e navette mitocondriali. Due schemi originali incorporati mostrano l’inversione della sedia e il confronto delle navette, anche negli aiuti e nella stampa.
- Biologia molecolare: 2 lezioni, 24 quiz e 2 prove aperte su chaperoni, traffico proteico, proteoma, PCR, clonaggio, librerie e sequenziamento. Un gel schematico originale con dati inventati insegna a interpretare bande e controlli; è incluso negli aiuti e nella stampa.
- Pedagogia speciale ampliata con fondamenti, ICD/ICF, PEI, casi sensoriali, motori, cognitivi e comunicativi; progetto educativo in quattro incontri, rubrica analitica e interpretazione dei risultati. Le quattro nuove lezioni includono 32 quiz e 4 prove aperte.
- Laboratorio di Informatica con 3 fogli interattivi, 21 celle da completare con formule e 3 report con criteri di autoconfronto. Verifica sui dati iniziali e su variazioni controllate, copia dei riferimenti, aiuti interni, salvataggio e backup.
- 12 tavole anatomiche: undici OpenStax con licenze individuali CC BY 3.0 o 4.0 e uno scheletro senza etichette di pubblico dominio, da Wikimedia Commons. Attribuzioni, guide italiane e immagini sono incorporate nel file. Lo scheletro ha dieci punti con lettere: la legenda compare nelle lezioni e negli aiuti, ma non nei test o nel loro ingrandimento.
- 3 schemi fisici interattivi originali: manometro a U, orientazione e flusso elettrico, grafico di attenuazione. Sono incorporati nelle lezioni e nei relativi aiuti, con una versione stampabile.
- Laboratorio inglese con 8 brani originali, trascrizione, traduzione, domande e dettato per autoconfronto. Sintesi ElevenLabs facoltativa, voci dell’account, velocità di riproduzione e cache MP3 locale.
- Mappa di 125 nuclei del programma, con fonti, anno di riferimento, collegamenti ai paragrafi e identificativi delle domande. Distingue nuclei introdotti, approfondimenti mancanti e parti non disponibili.
- Test guidato per ogni esame: una domanda per ciascun nucleo mappato disponibile, con correzione e rimando interno. Non è una simulazione certificata dell'esame universitario.
- Schemi sequenziali, tabelle regionali, prerequisiti collegati e fonti aperte nelle lezioni ampliate.
- Aiuto nella stessa pagina dell'esercizio: testo, esempio e formula del paragrafo collegato.
- Ripresa della sessione e della risposta ancora da inviare.
- Appunti per lezione, letture, cronologia dei tentativi, voti orientativi in trentesimi e lista di ripasso.
- Preferenze di lettura e backup JSON esportabile/importabile.
- Quaderni stampabili per esame o lezione, con esercizi e soluzioni separate: “I miei esami → esame → Quaderno di questo esame”.

Il piano del primo anno e i moduli dei corsi integrati sono stati letti nel [catalogo ufficiale UniBa 2026/27](https://uniba.coursecatalogue.cineca.it/corsi/2026/11437/insegnamenti/9999), il 20 ottobre 2026. Sono state aperte anche le schede dei singoli moduli. **Il piano è verificato; la copertura integrale del programma attuale non è certificata.** Le schede 2026/27 consultate non pubblicano un dettaglio analitico sufficiente. Per il confronto sono stati letti i syllabus ufficiali 2024/25, le schede analitiche 2025/26 di Scienze biologiche e Attività motorie e il programma di Informatica dell'archivio 2022/23.

Tutti i dieci esami hanno materiale: **Scienze biologiche** 49 lezioni, **Anatomia** 34, **Scienze di base** 22, **Scienze psicologiche e pedagogiche** 13, **Scienze giuridiche** 8, **Allenamento** 5, **Attività motorie** 4, **Gestione delle società sportive** 4, **Informatica** 5 e **Inglese scientifico** 6. Una lezione sui metodi didattici è condivisa da Allenamento e Attività motorie: i totali per esame non sono il numero di lezioni uniche.

Le mappe degli esami contengono **124 nuclei con lezioni e quiz**, dei quali **5 con approfondimenti esplicitamente incompleti**, e **1 nucleo non disponibile**: i materiali specificamente assegnati dal docente di diritto internazionale. Il laboratorio visuale comprende scheletro, sezione articolare generale, cuore aperto e pavimento pelvico, ma resta da estendere a viste regionali e ulteriori visceri. In Scienze biologiche sono ora presenti anche composizione corporea, strutture cellulari, cloroplasti, genoma, piccoli RNA e genetica microbica. Il laboratorio informatico verifica formule e report; restano da ampliare filtri, ordinamento e grafici. Per Fisica è completato il confronto editoriale delle voci della scheda 2024/25 e per Biologia applicata e Biochimica quelli dei rispettivi blocchi 2016/17; resta da verificare la corrispondenza con programma e dispense attuali. Anatomia viscerale e riconoscimento, lingua e autori psicopedagogici richiedono ulteriori approfondimenti; restano gli audit degli altri esami. “Lezione + quiz” attesta presenza di contenuto e verifica, non esaustività o padronanza. La copertura dell’intero primo anno è ancora incompleta; lo sviluppo è in pausa su richiesta dell’utente.

È stato letto anche il [programma analitico SAMS 2016/17](https://www.uniba.it/it/corsi/sams/studiare/didattica/insegnamenti/programmi-a.a.-2016-2017/corso-integrato-di-scienze-biologiche), comprendente Biochimica da 5 CFU e Biologia applicata, con docenti diversi da quelli attuali. Specifica dettagli che la scheda 2025/26 riunisce in nuclei ampi. È usato come confronto storico, non come prova del programma 2026/27. L’audit registra le voci sviluppate e quelle ancora mancanti: concentrazioni, aromaticità, navette, traffico proteico e tecniche del DNA sono ora insegnati e verificati. Sono completati i confronti dei blocchi storici Biologia applicata (44 voci) e Biochimica (69 voci). Le vie amminoacidiche sono rappresentative: il programma storico non richiede esplicitamente un catalogo di ogni enzima dei venti amminoacidi.

Il pedigree in **Dalle divisioni cellulari al pedigree** è un diagramma originale con famiglia inventata: i simboli mostrano il fenotipo, mentre il genotipo viene dedotto nel modello dichiarato. Compare nella lezione, negli aiuti e nella stampa. `tests/applied-biology-browser.mjs` verifica le 72 alternative errate dei 36 quiz aggiunti, il testo completo degli aiuti, la conservazione dei progressi precedenti, la resa mobile e i quaderni. Non è una prova di riconoscimento anatomico né una valutazione genetica di persone reali.

Sono confrontati anche i **12 nuclei e obiettivi biologici della scheda 2025/26**, separatamente dal dettaglio biochimico: comunicazione, differenziamento, ereditarietà, mutazioni e applicazione alle scienze motorie hanno riferimenti a testo e verifiche. La scheda indica “Orale” nel campo generale ma descrive uno scritto con quiz e/o domande aperte nella verifica dell’apprendimento; l’app conserva questa discrepanza nella mappa e non deduce da essa una modalità certa per l’anno corrente.

Due differenze del piano richiedono attenzione: la scheda psicopedagogica 2024/25 è da 12 CFU e non include **Didattica e pedagogia speciale**, presente nel piano attuale da 14 CFU; Informatica era al secondo anno nel programma d'archivio. È stato reperito e letto il [syllabus SAMS di Didattica e pedagogia speciale 2021/22](https://www.uniba.it/it/corsi/sams/studiare/didattica/insegnamenti/archivio/programmi-aa-2021-22-1/pedagogia-speciale-a-a-21-22): era un modulo da 2 CFU del terzo anno, con un altro docente. Le sue cinque voci sono confrontate con lezioni e verifiche in `data/development-audit.json`. I casi di adattamento sono rappresentativi, la normativa è trattata nei riferimenti essenziali e le letture assegnate non sono certificate: non viene dichiarata conformità al syllabus attuale. Il progetto in quattro incontri e i dati della rubrica sono esempi didattici originali, non risultati di una sperimentazione.

Gli argomenti sono stati ricostruiti da schede e indici pubblici; non sono stati acquisiti i testi integrali dei manuali commerciali. `data/library.json` registra fonte, edizione e limiti di ogni verifica, comprese le discrepanze fra copertine e didascalie delle foto. Le tavole riutilizzate provengono dalle versioni OpenStax pubblicate su Wikimedia Commons con licenza individuale verificata, mantenuta nelle didascalie. Il materiale non è presentato come validato da un docente.

I capitoli **Mano e polso** e **Piede e caviglia** aggiungono anatomia regionale: ossa e articolazioni, inserzioni tendinee, muscoli intrinseci ed estrinseci, nervi e casi sui rami distali. Le quattro tabelle sono sintesi da studiare insieme al testo; le varianti d’innervazione non sono trasformate in regole assolute. I 24 quiz hanno aiuti alle rispettive sezioni. `tests/distal-browser.mjs` verifica tutti i quiz, le tabelle scorrevoli su telefono, la persistenza e i quaderni con soluzioni.

Le lezioni **Arterie** e **Vene, circolo portale e passaggio alla vita neonatale** sviluppano i percorsi cardiovascolari richiesti nella scheda di Anatomia 2024/25. Comprendono 24 quiz, due prove aperte e uno schema originale dei tre shunt fetali, disponibile anche negli aiuti e in stampa. `tests/vascular-browser.mjs` controlla correzioni, aiuti, persistenza, lettura mobile e quaderni offline.

**Dentro il cuore** e **Dall’impulso al flusso** aggiungono anatomia interna e microscopica, pericardio, conduzione, ciclo cardiaco e pareti vascolari: 24 quiz, due prove aperte, tabella delle fasi e tavola OpenStax del cuore. Cinque domande chiedono di interpretare la tavola con etichette visibili: non sono presentate come riconoscimento senza nomi. Il nucleo cardiovascolare passa a `introduced` perché ogni voce della scheda storica ha contenuti e verifica; la conformità al syllabus 2026/27 resta da confermare. `tests/heart-browser.mjs` controlla correzioni, aiuti, tavola, persistenza e stampa.

**Spalla e braccio** e **Anca e coscia** aggiungono otto sezioni, sette tabelle con 37 righe, 24 quiz e due prove aperte. Attacchi, innervazione e articolazioni sono collegati a casi sul movimento, sull’appoggio monopodalico e sui muscoli biarticolari. La voce generale degli arti comprende ora anche avambraccio, gamba e rotatori profondi dell’anca; il riconoscimento su ulteriori viste regionali rimane parziale nella voce dedicata alle immagini. `tests/proximal-browser.mjs` verifica entrambe le alternative errate di ciascun quiz, aiuti completi, tabelle mobili, persistenza e quaderni offline.

**Avambraccio** e **Gamba** aggiungono 12 sezioni, 8 tabelle con 33 muscoli, 36 quiz e due prove aperte. Attacchi, compartimenti e passaggi tendinei sono collegati ai movimenti; i casi distinguono rami nervosi e livelli prossimali/distali. Le tabelle non sono prove di riconoscimento visivo. Il confronto con le voci generali del syllabus storico è registrato in otto righe dell’audit; `tests/forearm-leg-browser.mjs` verifica 72 feedback, aiuti, progressi preesistenti, mobile e stampa offline.

**Collo e dorso**, **Torace e addome** e **Pelvi e perineo** aggiungono 12 sezioni, dieci tabelle con 54 righe, 36 quiz e tre prove aperte. Comprendono attacchi e nervi, fasce, guaina del retto, passaggi inguinali, sfinteri e sei rotatori profondi dell’anca. La nuova tavola OpenStax CC BY 4.0 del pavimento pelvico ha guida italiana e sei quiz di interpretazione con etichette visibili. Le voci muscolari generali del tronco e degli arti sono introdotte; ciò non certifica il syllabus corrente né ogni dettaglio o variante. `tests/trunk-browser.mjs` verifica 72 feedback, aiuti con tavola, ingrandimento, lettura mobile, progressi e stampa offline.

L’audit di **Fisica** registra 79 voci della pagina 4 del syllabus 2024/25, con riferimenti alle sezioni e agli esercizi. Quattro nuove lezioni aggiungono 16 sezioni e quattro prove aperte; sono stati riscritti i contenuti sull’entropia e aggiunti 62 quiz complessivi. Le lacune affrontate comprendono azione e reazione, prodotti vettoriali, bilanci completi, proprietà/regimi dei fluidi, pressione sanguigna, termometri, scambi termici, teoria cinetica, alternata e campo terrestre. Gli esempi numerici sono originali; non sono acquisite le dispense Teams. `tests/physics-audit-browser.mjs` verifica correzioni e aiuti nel file offline. La mappa non garantisce il superamento dell’esame e non certifica il syllabus corrente.

I capitoli **Seguire il glucosio: reazioni e controllo** e **Dall’acetile all’ATP: reazioni e prove** aggiungono otto sezioni e sei tabelle sulle sequenze enzimatiche, gli aggiramenti gluconeogenetici, PDH/Krebs e l’accoppiamento mitocondriale. Insieme agli ampliamenti su proteine fibrose/globulari, inibizione e fosfocreatina introducono 32 quiz e due prove aperte. Il confronto mirato di 20 voci del syllabus storico è registrato nell’audit e confluisce nel confronto complessivo di 69 voci. `tests/biochem-central-browser.mjs` verifica i 64 feedback errati, gli aiuti completi, le tabelle su telefono, i progressi precedenti e i quaderni offline.

La lezione **Dal nervo alla forza: calcio, ATP e fibre** ricostruisce placca motrice, potenziale d’azione, accoppiamento al reticolo, ciclo dei ponti e differenze I/IIa/IIx, con due tabelle e due sequenze. Il completamento del confronto storico di Biochimica aggiunge inoltre spiegazioni su lipolisi e sintesi TAG, NAG/CPS I, beta-ossidazione, isomeria, anidridi, scheletro del DNA e colesterolo di membrana: 36 quiz e una prova aperta. `tests/biochem-full-browser.mjs` controlla i 72 feedback errati, gli aiuti integrali, il mantenimento dei progressi, la resa mobile e la stampa. Il confronto storico completo non certifica le dispense correnti né garantisce un voto.

## Ascolto ElevenLabs

In **Preferenze e backup → Ascolto inglese** incolla il tuo token API, carica le voci inglesi disponibili nell’account, scegli voce e modello e salva. Puoi ricordare il token sul dispositivo oppure tenerlo solo nella scheda corrente. George è un identificativo di esempio documentato da ElevenLabs, non una garanzia di disponibilità per qualsiasi account; l’elenco caricato dall’account permette di scegliere una voce effettivamente accessibile.

La chiave salvata è in un’area separata del localStorage (`studio-elevenlabs-v1`), **non cifrata** e accessibile a chi usa il profilo del browser. Non inserirla nel codice sorgente o nella copia da distribuire. Non entra nei backup dei progressi. Una chiave limitata alle funzioni necessarie e con un limite di spesa può essere impostata nell’account ElevenLabs.

Nella lezione **Laboratorio di ascolto e dettato**, “Riproduci audio salvato” legge soltanto la cache. “Genera e salva audio” controlla prima la cache e, solo se manca quella combinazione di testo, voce, modello e parametri, invia il brano all’API. Questa operazione usa i crediti del tuo account. Non ci sono generazioni all’apertura della pagina, né tentativi automatici dopo un errore.

Gli MP3 sono memorizzati in IndexedDB, database `studio-audio-v1`, nello stesso profilo e percorso locale. Una volta salvati si riascoltano anche senza token e senza Internet. Cambiare voce o modello richiede una registrazione diversa; cambiare velocità di riproduzione no. Puoi scaricare ciascun MP3 e cancellare la cache dalle preferenze. Il backup JSON dei progressi **non trasferisce** né audio né token.

Nelle domande di ascolto la trascrizione non è visibile inizialmente. “Mi serve un aiuto” apre il materiale interno con testo e traduzione e marca la risposta come assistita. Il dettato e la pronuncia hanno criteri di autoconfronto, non correzione automatica del parlato.

Il 20 ottobre 2026 è stato verificato senza credenziali che il preflight dell’endpoint TTS accetta l’origine `null` dei file locali. Le prove browser usano risposte API simulate e controllano salvataggio, cache, riapertura e assenza di richieste implicite. Non è stata eseguita una generazione reale con un account dell’utente. Cambi futuri di CORS, disponibilità delle voci o permessi del token sono riportati come errori nell’interfaccia.

## Come vengono creati e risolti gli esercizi

**Laboratorio di Informatica:** apri la lezione “Laboratorio: dai dati al report” e scegli uno dei tre fogli. Completa le celle evidenziate, premi Tab per ricalcolare e usa “Copia verso il basso” dove disponibile. La verifica accetta formule equivalenti sui casi provati e controlla variazioni degli ingressi, così una costante che coincide soltanto sul caso iniziale non basta. Non è un verificatore simbolico generale. Le soluzioni sono commentate, gli aiuti rimandano alla lezione interna e i report hanno criteri di autoconfronto. Il quaderno stampabile include dati, consegne e soluzioni separate.

**Salvataggio dei fogli:** formule, report, uso degli aiuti e fino a 100 verifiche per laboratorio entrano nel backup ordinario. Il registro dei laboratori compare anche nei progressi. Importando nello stesso browser, il foglio locale prevale su quello importato e le verifiche si uniscono senza duplicati; su un browser vuoto il ripristino è integrale. L’ambiente didattico supporta un sottoinsieme esplicito delle formule, non importa cartelle Excel e non sostituisce ogni funzione di un programma da ufficio.

**Teoria:** banca di domande originali già scritte, con risposta attesa e spiegazione di ogni distrattore. L'app seleziona e mescola le domande; non inventa nuova teoria durante lo studio.

**Esami:** le sessioni possono essere limitate all'esame, a una lezione e a un livello. Le barre contano soltanto le lezioni disponibili lette; non rappresentano percentuali del programma ufficiale, CFU acquisiti o esami superati. Gli ID e il formato dei progressi precedenti restano invariati.

**Test guidati:** dalla pagina dell'esame, il pulsante dedicato seleziona una domanda per ogni nucleo disponibile della mappa. Le domande non si ripetono e rimangono nell'esame selezionato. I nuclei parziali sono verificati soltanto nei contenuti presenti; i nuclei mancanti non entrano nel test. Gli aiuti restano disponibili e vengono annotati. Il test non certifica gli approfondimenti assenti né la produzione libera.

**Calcoli:** modelli a parametri controllati in `lib/engine.js`. Un seme numerico ricrea gli stessi dati. La soluzione viene calcolata con formule, e vengono costruiti i passaggi coerenti con quei dati. Non è un risolutore simbolico universale e non interpreta problemi arbitrari in linguaggio naturale. Non usa `eval`.

**Correzione:** il primo invio valido viene registrato una sola volta; una risposta vuota o non numerica non conta come tentativo. Per i numerici sono accettati virgola, punto e notazione scientifica. La tolleranza assoluta è mostrata nella domanda: normalmente ±0,01 nell'unità richiesta; per la carica energetica è ±0,001 e si chiedono tre decimali. Numero e unità vengono verificati separatamente. Alcuni risultati riconducibili a errori comuni hanno un rimando più specifico; gli altri ricevono una guida generale, senza fingere di conoscere il ragionamento dell'utente.

**Aiuti:** un esercizio o un distrattore contiene un riferimento come `"help": "leve/momento"`. Le due parti identificano esattamente una lezione e una sezione. L'app visualizza quel contenuto direttamente sotto la correzione. Se si chiede aiuto prima della risposta, il tentativo viene registrato come assistito.

**Voti:** `30 × risposte corrette / domande assegnate`, arrotondato a un decimale. Le domande lasciate senza risposta valgono zero. Gli aiuti non sottraggono punti, ma sono segnalati. È una misura dell'esercitazione, non una previsione del voto d'esame. Le ripetizioni di una stessa famiglia numerica possono comparire nella stessa sessione con dati diversi.

**Ripasso:** si considera l'ultimo tentativo per identificativo di domanda o famiglia numerica. Un errore o un successo assistito resta in lista; un successo senza aiuto lo rimuove. Questo è un registro semplice, non un algoritmo che certifica la padronanza o la memoria a lungo termine.

## Dove sono i dati

```text
studio/
  pronto/index.html     Unico file da consegnare, apribile con doppio clic
  index.template.html  Sorgente della struttura HTML
  styles.css            Aspetto, telefono e stampa
  app.js                Navigazione e interazione
  data/
    course.json         Esami, lezioni, fonti e mappa del programma
    exercises.json      Quiz e descrittori dei generatori
    library.json        Ricerca bibliografica e fonti
  lib/
    engine.js           Generazione, soluzioni e correzione
    state.js            Formato e validazione dei progressi
    validate.js         Controllo dei rimandi e dei contenuti
  scripts/check.mjs     Verifica del catalogo
  scripts/build.mjs     Generazione dell'HTML autonomo
  tests/                Controlli automatici
```

Il file HTML è autonomo per l'app e i contenuti. **I dati personali sono nel localStorage del browser**, chiave `studio-motorie-v1`: copiare il file non li trasferisce. Usa lo stesso browser e mantieni `index.html` nello stesso percorso. La gestione del salvataggio per i file locali può variare tra browser; spostare il file, cambiare browser o cancellare i dati di navigazione può rendere necessario importare il backup.

Prima di cambiare percorso o aggiornare la copia, esporta un backup. La compilazione non legge né incorpora progressi personali. Per passare dalla precedente versione su localhost alla nuova versione HTML, esporta i progressi dalla vecchia e importali nella nuova; il formato rimane compatibile.

Da “Preferenze e backup” esporta periodicamente un JSON. Su un browser vuoto l'importazione ripristina tutto; dove ci sono già dati, unisce i tentativi e le sessioni senza duplicati, mantenendo preferenze e appunti locali in caso di conflitto. Un identificativo con contenuti discordanti causa il rifiuto dell'importazione. Non c'è sincronizzazione cloud né scrittura automatica dei progressi nei file della cartella.

Usa una scheda attiva alla volta per studiare. Se l'app rileva modifiche ai progressi da un'altra scheda, blocca i salvataggi di quella corrente e avvisa; esporta eventuali dati nuovi prima di ricaricare.

## Manutenzione dei contenuti

Le pagine, gli indici e i rimandi vengono ricostruiti dai dati incorporati: aggiungere una lezione non richiede una pagina HTML dedicata. “Automantenuta” significa qui catalogo derivato dai dati e collegamenti controllati; non significa che il sito scriva nuove lezioni da solo.

1. Aggiungi la lezione a `course.json`: ID stabile, materia, obiettivi, sezioni complete, esempi, riferimenti.
2. Aggiungi gli esercizi a `exercises.json`, con aiuti verso sezioni esistenti.
3. Esegui `npm run check` e `npm test`.
4. Esegui `npm run build` e consegna il nuovo `pronto/index.html`.

Per nuove famiglie numeriche serve una funzione in `engine.js` e un controllo indipendente della formula. Per nuovi quiz non serve modificare JavaScript. Indicazioni dettagliate: [MANUTENZIONE.md](MANUTENZIONE.md).

L'AI può aiutare a redigere nuovi pacchetti di lezioni ed esercizi durante la manutenzione, che poi restano nei JSON. Il motore degli esercizi funziona localmente senza AI né costi API; la sintesi audio ElevenLabs facoltativa usa invece i crediti dell’account. Un tutor che valuti testo libero richiederebbe un'ulteriore integrazione e un controllo dell'affidabilità: non è incluso.

## Verifica

```text
npm run check
npm test
```

I test controllano i rimandi, 1000 semi per ciascun generatore con identità indipendenti, parsing, unità, errori tipici, punteggi, backup e compilazione dell'HTML autonomo.

Controllano anche che ciascun nucleo mappato abbia lezioni e domande coerenti, che le lacune siano esplicite e che i test guidati raggiungano tutti i nuclei disponibili senza uscire dall'esame. Questi controlli provano coerenza strutturale e comportamento del software, non una validazione didattica da parte dell'università.

`tests/browser.mjs` apre direttamente il file `file://` con la connessione disattivata: verifica anche riapertura, sostituzione del file, backup e assenza di richieste HTTP. Richiede Playwright già installato, configurabile con `PLAYWRIGHT_MODULE` e `CHROMIUM_EXECUTABLE`. Non è una dipendenza dell'app. Le sue schermate e il PDF di prova vengono scritti in `.local/`, esclusa dal versionamento.

`tests/sheet-browser.mjs` verifica tutte le 21 formule nel browser, copia relativa/assoluta, risposte costanti errate, recupero tramite lezione, backup e ripristino in un profilo vuoto, mobile e stampa. Il motore delle formule ha test separati su sintassi, riferimenti circolari, dati mancanti, tipi e condizioni al limite.

`tests/physics-browser.mjs` controlla i tre schemi interattivi, orientazione e segni, i sei generatori fisici aggiuntivi con aiuto e persistenza e la stampa senza controlli interattivi. I test numerici controllano 1000 semi per famiglia con identità fisiche indipendenti; questo verifica i calcoli dei modelli dichiarati, non certifica da solo la preparazione all’esame.
