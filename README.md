<div align="center">

<img src="public/logos/rigtrack.svg" alt="RigTrack" width="88" />
&nbsp;&nbsp;
<img src="public/logos/jef-tile.png" alt="JEF Production" width="88" />

# Nivtec kalkulačka pódia

**Zadáš rozmer a výšku, kalkulačka ti povie, koľko čoho treba a ako to postaviť.**

*Časť budúcej aplikácie **RigTrack**, ktorá je vo vývoji.*

</div>

---

## Čo to je

Webová kalkulačka pre pódiový systém **Nivtec**. Z rozmerov pódia vypočíta zoznam dielov
a nakreslí pôdorys s rozložením dosiek. Netreba nič inštalovať ani sa prihlasovať, beží celá v prehliadači.

Pôvodne je to jedna z funkcií aplikácie **RigTrack** (evidencia techniky, kufrov, výpožičiek,
servisu a eventov). Tu je vytiahnutá samostatne, aby si ju mohol vyskúšať ktokoľvek.

## Čo vie

- 🟫 **Dosky:** rozloženie hlavných aj menších dosiek po 0,5 m, automaticky alebo s otočením podľa teba
- 🦵 **Nohy:** podľa výšky pódia; susedné dosky sa delia o spoločnú nohu
- 🪜 **Schody:** stupne po 20 cm, schodiskové nohy, spojky k pódiu aj zábradlie
- 🎭 **Plachty a štipce:** na zvolené strany, okolo mola aj rizerov
- 🛡️ **Zábradlie:** diely, spojky a rohové spojky
- ➕ **Lišty:** na pero a na drážku, každá na jednu dosku
- 🌀 **Výstuhy („vrtule“)** od výšky 80 cm
- 🛤️ **Molo** (výbežok do publika) a **rizery** (napr. pre bicie, aj na kolieskach)
- 🗺️ **Pôdorys:** kde je pero, ktorou doskou začať stavať, kde idú lišty, plachta a zábradlie
- 📋 **Kopírovanie zoznamu** do správy a **tlač**
- ⚙️ **Nastavenie:** vlastné rozmery dosiek, nôh, plachiet či príslušenstva
- ☁️ **Prihlásenie (Supabase):** nastavenie sa uloží do účtu a je rovnaké na každom zariadení
- 🌙 Svetlý aj tmavý režim, funguje na mobile

## Spustenie u seba

Treba [Node.js](https://nodejs.org/) 22 alebo novší.

```bash
npm install
npm run dev
```

Ďalšie príkazy:

| Príkaz          | Čo robí                                      |
| --------------- | -------------------------------------------- |
| `npm test`      | spustí testy výpočtu                         |
| `npm run build` | pripraví hotovú stránku do priečinka `dist/` |

## Nasadenie na GitHub Pages

Stránka sa nasadzuje sama cez GitHub Actions (`.github/workflows/deploy.yml`) pri každom pushi do `main`.

1. Nahraj projekt do repozitára na GitHube.
2. V repozitári otvor **Settings → Pages** a ako **Source** vyber **GitHub Actions**.
3. Po dobehnutí akcie bude stránka na `https://<používateľ>.github.io/<repozitár>/`.

## Údaje a Supabase

Kalkulačka funguje aj **bez databázy**: nastavenie sa vtedy ukladá len do prehliadača (localStorage).
Po pripojení vlastného projektu na [supabase.com](https://supabase.com) pribudne v hlavičke **Prihlásiť**
a prihlásený používateľ má nastavenie uložené v databáze.

Ide o **samostatný Supabase projekt**, nie o databázu aplikácie RigTrack.

### Nastavenie Supabase

1. Na [supabase.com](https://supabase.com) vytvor nový projekt.
2. V **SQL Editor** spusti celý súbor [`supabase/schema.sql`](supabase/schema.sql). Vytvorí tabuľku `nivtec_configs`
   s RLS: každý používateľ vidí a mení len svoje nastavenie a anonymný návštevník nemá k tabuľke prístup.
3. V **Authentication → Sign In / Providers** vypni **Allow new users to sign up**, aby si účty nemohol zakladať hocikto.
4. V **Authentication → Users → Add user** pridaj účty (e-mail a heslo, zaškrtni *Auto Confirm User*).
5. Z **Project Settings → API** si skopíruj **Project URL** a **publishable (anon) key**.

### Kľúče

Lokálne skopíruj `.env.example` do `.env.local` a vyplň:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Pre GitHub Pages zadaj tie isté dve hodnoty v repozitári ako **Settings → Secrets and variables → Actions → New repository secret**.
Pri ďalšom nasadení sa vložia do stránky.

> Publishable (anon) kľúč je verejný, je v stránke vidieť a to je v poriadku: dáta chráni RLS.
> **Service role kľúč do stránky ani do GitHubu nikdy nedávaj.**

## Technológie

React 19 · TypeScript · Vite · Tailwind CSS · Supabase · Zod · Vitest

---

<div align="center">

Made with ❤️ by **DejvoLD**

[Instagram](https://www.instagram.com/david.babjarcik/) ·
[Discord](https://discord.com/users/521259942204932096) ·
[LinkedIn](https://www.linkedin.com/in/d%C3%A1vid-babjar%C4%8D%C3%ADk-45814a387/) ·
[GitHub](https://github.com/davidbabjarcik)

© 2026 DejvoLD · Nivtec je značka svojho výrobcu; tento projekt s ním nie je spojený.

</div>
