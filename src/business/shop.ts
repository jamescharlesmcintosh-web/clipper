export type Poster = {
  name: string
  kind: string
  accent: string
}

export type RoomConfig = {
  label: string
  title: string
  blurb: string
  hint: string
  chair: string
  shelf: string
  posters: Poster[]
}

export type Service = {
  name: string
  desc: string
  price: string
  time: string
}

export type PortfolioItem = {
  title: string
  desc: string
  tag: string
}

export type StudioFeature = {
  name: string
  desc: string
  icon: string
}

export type Shop = {
  id: string
  name: string
  word: string
  kicker: string
  since: string
  tagline: string
  note: string
  phone: string
  phoneHref: string
  email: string
  street: string
  city: string
  hours: { day: string; time: string }[]
  socials: { label: string; href: string }[]
  bookingLabel: string
  bookingHref: string
  accent: string
  services: Service[]
  portfolio: PortfolioItem[]
  studio: StudioFeature[]
  room: RoomConfig
}

export const shops: Record<string, Shop> = {
  clipper: {
    id: 'clipper',
    name: 'Clipper & Co.',
    word: 'CLIPPER',
    kicker: 'Barbershop · Brooklyn',
    since: 'Est. 2019',
    tagline: 'Precision cuts. Hot towels. No rush.',
    note: 'Fades, scissor work, and beard line-ups cut to the head in the chair — not the trend.',
    phone: '+1 (718) 555-0142',
    phoneHref: 'tel:+17185550142',
    email: 'book@clipperandco.com',
    street: '418 Franklin Avenue',
    city: 'Bed-Stuy, Brooklyn NY 11238',
    hours: [
      { day: 'Tue — Fri', time: '10:00 — 19:00' },
      { day: 'Saturday', time: '09:00 — 18:00' },
      { day: 'Sun — Mon', time: 'Closed' },
    ],
    socials: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Booksy', href: 'https://booksy.com' },
    ],
    bookingLabel: 'Book the chair',
    bookingHref: 'mailto:book@clipperandco.com',
    accent: '#E8A84E',
    services: [
      { name: 'Signature Fade', desc: 'Taper fade to skin with hot towel finish', price: '$45', time: '45 min' },
      { name: 'Skin Fade', desc: 'Bald fade from crown to neckline, blade-clean', price: '$55', time: '60 min' },
      { name: 'Scissor Crop', desc: 'Textured cut with shears, customized to face shape', price: '$50', time: '50 min' },
      { name: 'Line-Up', desc: 'Precision neckline and sideburn shaping', price: '$30', time: '20 min' },
      { name: 'Beard Trim', desc: 'Grooming and shape, hot oil finish', price: '$35', time: '30 min' },
      { name: 'Full Groom', desc: 'Cut + line-up + beard + hot towel treatment', price: '$75', time: '90 min' },
    ],
    portfolio: [
      { title: 'Low Taper', desc: 'Tight, clean taper with a matte seal. Blade-first, zero compromise.', tag: 'Clipper work' },
      { title: 'Scissor Crop', desc: 'Shears do the heavy lifting. Texture from root to tip.', tag: 'Shears' },
      { title: 'Skin Fade', desc: 'From high-and-tight to bare skin. Every layer accounted for.', tag: 'Foil + blade' },
      { title: 'Line-Up', desc: 'Sharp perimeter work. Straight lines, no wobble.', tag: 'Detail' },
      { title: 'Burst Fade', desc: 'Circular gradient fade. The kind that takes 3 passes to get right.', tag: 'Clipper work' },
      { title: 'Razor Finish', desc: 'Straight-edge cleanup with a vintage blade. Final pass only.', tag: 'Straight razor' },
    ],
    studio: [
      { name: 'The Chair', desc: 'A single hydraulic chair, centered. No background noise.', icon: '🪑' },
      { name: 'The Bench', desc: 'Waiting area with old magazines and cold water.', icon: '🪑' },
      { name: 'The Wall', desc: 'Frames from every cut we have ever done.', icon: '📷' },
      { name: 'The Room', desc: 'Step inside the lounge. Every frame on the wall is a cut we stand behind.', icon: '🚪' },
    ],
    room: {
      label: 'The Room',
      title: 'Step inside the lounge.',
      blurb: 'A quiet room for loud detail. Look around — every frame on the wall is a cut we stand behind.',
      hint: 'Drag to look · Hover a frame',
      chair: 'The Chair',
      shelf: 'The Bench',
      posters: [
        { name: 'Low Taper', kind: 'Clipper work', accent: '#E8A84E' },
        { name: 'Scissor Crop', kind: 'Shears', accent: '#D4A574' },
        { name: 'Skin Fade', kind: 'Foil + blade', accent: '#C9C4BB' },
        { name: 'Line-Up', kind: 'Detail', accent: '#F2D6A2' },
      ],
    },
  },
}

export const shop: Shop = shops.clipper
