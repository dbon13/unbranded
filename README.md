
# Unbranded Kiosk (React + Vite)

App kiosk per personalizzare l'etichetta di un flacone durante una fiera.
- Anteprima live su canvas
- Testi, font, palette, pattern, logo, QR
- Esporta PNG a dimensioni in mm e DPI

## Requisiti
- Node.js 18+
- (Opzionale) account Vercel

## Avvio locale
```bash
npm install
npm run dev
```

## Deploy su Vercel
1. Crea un nuovo repo su GitHub (es. `unbranded-kiosk`) e carica questi file.
2. Vai su https://vercel.com/new → **Continue with GitHub** → scegli il repo → **Deploy**.
3. Apri l'URL pubblico generato.

## Note
- Le dipendenze UI sono componenti leggeri locali, niente backend.
- Se serve aggiungere salvataggio su DB/Sheets o esportazione PDF con bleed, apri una issue o scrivimi e lo integriamo.
