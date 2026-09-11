# For You — a personal story, built as a web app

## What's in here
- `index.html` — the page structure
- `style.css` — all visual design (olive/cream theme, light + dark)
- `config.js` — **all your personal content lives here.** Name, story text, feelings, the letter, photo captions, and your WhatsApp number/message. Edit this file whenever you want to change wording — nothing else needs to change.
- `app.js` — the flipbook, animations, theme switching, and the yes/no logic
- `images/` — the four photos, already placed and sized for the web

Her name is already set to **Vaibhavi** everywhere in `config.js`.

## How to open it yourself first
Just double-click `index.html` — it opens in any browser. Check it on your phone too before sending (copy the whole folder to your phone, or use the hosting option below, which is easier to test on mobile).

## How to send it to her
This is a folder of files, not a single link, so you need to host it somewhere free so she can open it as a normal webpage on her phone:

1. **Netlify Drop** (easiest, no account needed): go to https://app.netlify.com/drop and drag the whole `love-app` folder in. It gives you a live link in seconds.
2. **GitHub Pages**: push the folder to a GitHub repo, enable Pages in repo settings, and use the link it gives you.
3. **Vercel**: `vercel` CLI or vercel.com, drag-and-drop deploy works too.

Once you have the link, send it to her however you'd like.

## Things worth checking before sending
- Read through `config.js` once — the story and letter are written from what you told me; adjust any phrase that doesn't sound like your own voice.
- Open it on your own phone and tap through every page, both YES and NO paths, and confirm the WhatsApp button opens a chat with your number and the pre-filled message.
- Try light, dark, and system theme.
