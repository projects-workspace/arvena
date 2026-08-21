// ═══════════════════════════════════════════════════════════════
// PDF DOWNLOAD MATRIX — single authoritative source of truth
//
// Maps each download button (by element id) to the real PDF files
// that exist per language. A language key that is absent means the
// document genuinely does not exist in that language — the UI must
// show an "unavailable" state instead of downloading another
// language's file or pointing to a missing path.
//
// Available today:
//   Bioflora        — RU / UA / CZ / EN
//   Spheres of Life — RU / UA
//   Santiago Protocol — RU / UA
//   Tubazh          — RU / UA
// ═══════════════════════════════════════════════════════════════
const PDF_MATRIX = {
    "btn-pdf-bioflora-top": {
        "ru": "PDFbiom/Inner_Ecology RU.pdf",
        "ua": "PDFbiom/Holobiont_Systems_Restoration UA.pdf",
        "cz": "PDFbiom/The_Holobiont_Blueprint_CZ.pdf",
        "en": "PDFbiom/The_Holobiont_Blueprint EN.pdf"
    },
    "btn-pdf-bioflora-bottom": {
        "ru": "PDFbiom/Inner_Ecology RU.pdf",
        "ua": "PDFbiom/Holobiont_Systems_Restoration UA.pdf",
        "cz": "PDFbiom/The_Holobiont_Blueprint_CZ.pdf",
        "en": "PDFbiom/The_Holobiont_Blueprint EN.pdf"
    },
    "btn-pdf-lifemap": {
        "ru": "PDFlife/Spheres_of_Life_RU.pdf",
        "ua": "PDFlife/Spheres_of_Life_UA.pdf"
    },
    "btn-pdf-protocol": {
        "ru": "PFDmeto/Santiago_Protocol_RU.pdf",
        "ua": "PFDmeto/Santiago_Protocol_UA.pdf"
    },
    "btn-pdf-tyubazh": {
        "ru": "PFDmeto/Tyubazh_Ritual_RU.pdf",
        "ua": "PFDmeto/Tyubazh_Ritual_UA.pdf"
    }
};
