# Studio · Scienze motorie

App di studio con lezioni, esercizi e tavole attribuite.

**Sviluppo in pausa su richiesta dell’utente il 21 ottobre 2026, dopo Informatica.** [Segnalibro e parti mancanti per esame](studio/SEGNALIBRO.txt). L’ultimo aggiornamento locale completa il confronto storico di Informatica: dieci lezioni, 104 quiz e sei laboratori, con limiti espliciti sui materiali ancora da verificare; la copertura integrale del primo anno non è ancora conclusa.

**Apri il sito: https://nerdosity.github.io/books/**

## Sviluppo e pubblicazione

Serve Node.js 22; non occorre installare dipendenze.

```sh
npm --prefix studio run check
npm --prefix studio test
npm --prefix studio run build
```

Il file `studio/pronto/index.html` funziona anche offline con un doppio clic.
Ogni push su `main` compila e pubblica su GitHub Pages. I test si eseguono soltanto in locale.
Pages deve usare **GitHub Actions** come sorgente in Settings → Pages.

## Dati personali

Il repository è pubblico. Non aggiungere credenziali, backup, appunti o profili del browser.
Le cartelle `.local`, i file di ambiente, i backup e la copia compilata sono esclusi dal versionamento.
Il workflow controlla i file e prepara una cartella di pubblicazione contenente soltanto l'HTML compilato.

Progressi, appunti e impostazioni rimangono nel browser. La compilazione non li legge.
Il token ElevenLabs facoltativo viene inserito da ciascun utente sul proprio dispositivo;
non è incluso nel sito o nei backup dei progressi. La generazione audio invia il brano e il token all'API ElevenLabs su richiesta.

Passando dal file locale al sito, esporta e importa il backup dalle preferenze: sono spazi di salvataggio distinti.
Conserva il backup sul dispositivo, fuori dal repository.

Le lezioni sono materiale didattico in sviluppo, non una certificazione della copertura del programma.
Le attribuzioni delle tavole e le fonti sono disponibili nell'app e nei dati del progetto.
