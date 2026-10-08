// ============================================================
// Business content — separated from shared page structure.
// This module contains all copy, services, portfolio, and studio data.
// Swap this file to reuse the template for a different barber shop.
// ============================================================

export const businessContent = {
  tagline: 'Precision cuts. Hot towels. No rush.',
  note: 'Fades, scissor work, and beard line-ups cut to the head in the chair — not the trend.',
  services: [
    { name: 'Signature Fade', desc: 'Taper fade to skin with hot towel finish', price: '$45', time: '45 min' },
    { name: 'Skin Fade', desc: 'Bald fade from crown to neckline, blade-clean', price: '$55', time: '60 min' },
    { name: 'Scissor Crop', desc: 'Textured cut with shears, customized to face shape', price: '$50', time: '50 min' },
    { name: 'Line-Up', desc: 'Precision neckline and sideburn shaping', price: '$30', time: '20 min' },
    { name: 'Beard Trim', desc: 'Grooming and shape, hot oil finish', price: '$35', time: '30 min' },
    { name: 'Full Groom', desc: 'Cut + line-up + beard + hot towel treatment', price: '$75', time: '90 min' },
  ],
  portfolio: [
    { title: 'Low Taper', desc: 'Tight, clean taper with a matte seal.', tag: 'Clipper work' },
    { title: 'Scissor Crop', desc: 'Shears do the heavy lifting.', tag: 'Shears' },
    { title: 'Skin Fade', desc: 'From high-and-tight to bare skin.', tag: 'Foil + blade' },
    { title: 'Line-Up', desc: 'Sharp perimeter work. Straight lines.', tag: 'Detail' },
    { title: 'Burst Fade', desc: 'Circular gradient fade. 3 passes.', tag: 'Clipper work' },
    { title: 'Razor Finish', desc: 'Straight-edge cleanup. Final pass.', tag: 'Straight razor' },
  ],
  studio: [
    { name: 'The Chair', desc: 'A single hydraulic chair, centered. No background noise.' },
    { name: 'The Bench', desc: 'Waiting area with old magazines and cold water.' },
    { name: 'The Wall', desc: 'Frames from every cut we have ever done.' },
    { name: 'The Studio', desc: 'Creative Space Studio — book a session, shoot a look.' },
  ],
}
