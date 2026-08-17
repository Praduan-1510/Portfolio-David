# CareBridge — interactive prototype

A multi-specialty healthcare platform prototype: 11 screens' worth of flows
built on the Aurora design system.

## Running it

Every page is self-contained — all CSS and JavaScript is inlined. There is no
build step, no package manager and no external request: the prototype works
with the network off.

Serve the folder over HTTP and open `index.html`:

    python3 -m http.server 8000

then visit http://localhost:8000/index.html

Opening the files directly with `file://` mostly works, but the theme switch
and the SVG icon sprites rely on document-origin behaviour, so a plain static
server is the reliable way to view it. Any static host works — GitHub Pages,
Netlify, Vercel, S3, or a subfolder of an existing portfolio site.

## What is where

| File | Screen |
|---|---|
| `index.html` | Walkthrough hub — start here |
| `app.html` | Patient home |
| `auth.html` | Sign-in and onboarding |
| `book.html` | Find a doctor and book |
| `care.html` | Prescriptions, medicines, store locator |
| `records.html` | Health records |
| `clinician.html` | Clinician-side views |
| `ops.html` | Operations views |
| `more.html` | Settings, household, billing |
| `showcase.html` | Feature showcase |
| `styleguide.html` | The Aurora design system |

`assets/` holds the photography and logo files the pages reference.

## Notes

All clinical data, names, doctors, pharmacies and prices are fictional.
The maps are drawn as inline SVG — no tiles and no map provider.
