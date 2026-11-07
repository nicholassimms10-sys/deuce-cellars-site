/*
  DEUCE CELLARS — WINE LIST
  ------------------------------------------------------------------
  Every price, tasting note and buy link on the site comes from this
  one file. Change a number here and it changes on every page.

  purchaseMode
    'reserve' — every button opens an email to reserve the wine.
                Nothing is paid on the website.
    'square'  — wines that have a squareLink get a "Buy" button that
                opens the Square checkout. Wines without a link still
                show "Reserve".
    Check with your licensing before switching to 'square': a payment
    link on the website counts as selling online, even though the
    payment itself runs through Square.

  To add a Square link for another wine: in Square, create a payment
  link for that vintage, copy it, and paste it as squareLink below.

  Bottle pictures live in images/bottles/. Each year has a small one
  (bottle-2017.webp) and a large one that opens when the bottle is
  tapped (bottle-2017-lg.webp).

  A wine with price: null shows "Ask for price" and can still be
  reserved by email.

  Vertical sets have no price of their own. Each set adds up the
  bottle prices of the years listed, so it updates by itself.
*/
window.DEUCE = {
  purchaseMode: 'reserve',
  email: 'deucecellars@gmail.com',
  phone: '(503) 201-8868',

  wines: [
    {
      year: 2019,
      status: 'current',            // current | library | coming
      price: 45,
      squareLink: 'https://checkout.square.site/merchant/F6SX1KN9A56CY/checkout/25ETUIPCKQPWUEGSN3Y6M5XX',
      image: 'images/bottles/bottle-2019.webp',
      region: 'Walla Walla Valley',
      cases: 190,
      oak: '34 months in Missouri oak',
      alcohol: '14.8%',
      note: 'A satin texture opens to Bing cherry, star anise, lavender and a hint of saltwater taffy. Missouri oak tannins are fully woven in after 34 months in barrel, with bright acid and a long, long finish. A real crowd pleaser.'
    },

    // Limited Availability of Older Vintages — listed oldest first
    {
      year: 2011,
      status: 'library',
      price: 75,
      limit: 'Limit 1 per guest',
      image: 'images/bottles/bottle-2011.webp',
      region: 'Columbia Valley',
      note: 'The oldest bottles in our library.'
    },
    {
      year: 2012,
      status: 'library',
      price: 75,
      limit: 'Limit 1 per guest',
      image: 'images/bottles/bottle-2012.webp',
      region: 'Walla Walla Valley',
      note: 'A library vintage with very few bottles left.'
    },
    {
      year: 2014,
      status: 'library',
      price: 65,
      limit: 'Limit 1 per guest',
      image: 'images/bottles/bottle-2014.webp',
      region: 'Walla Walla Valley',
      cases: 285,
      oak: '32 months in Missouri oak',
      note: 'Not for the meek. Cigar box, lavender and huckleberry. Open-bin fermented, hand punched and unfiltered.'
    },
    {
      year: 2016,
      status: 'library',
      price: 60,
      image: 'images/bottles/bottle-2016.webp',
      region: 'Walla Walla Valley',
      cases: 390,
      oak: 'Almost three years in Missouri oak',
      note: 'Satin texture with boysenberry, fig, lavender and cigar box. Integrated oak tannins and solid acid for a long finish.'
    },
    {
      year: 2017,
      status: 'library',
      price: 50,
      image: 'images/bottles/bottle-2017.webp',
      region: 'Walla Walla Valley',
      cases: 187,
      oak: '32 months in Missouri oak',
      alcohol: '14.8%',
      award: 'Double Gold',
      awardSource: 'San Francisco Chronicle · Gold, Critics Challenge',
      note: 'Black cherry, plum and vanilla, with soft notes of sweet Missouri oak and lavender. A long finish with a hint of green apple.'
    },
    {
      year: 2018,
      status: 'library',
      price: 50,
      image: 'images/bottles/bottle-2018.webp',
      region: 'Walla Walla Valley',
      cases: 165,
      oak: '34 months in Missouri oak',
      alcohol: '14.8%',
      award: '97 pts · Best of Class',
      awardSource: 'SavorNW Wine Awards 2025',
      note: 'One of the best Walla Walla vintages in twenty years. Huckleberry, black raspberry and unsweetened chocolate, with a finish that keeps going.'
    },

    {
      year: 2020,
      status: 'coming',
      price: null,
      image: 'images/bottles/bottle-2020.webp',
      region: 'Walla Walla Valley',
      cases: 96,
      oak: '30 months in Missouri oak',
      alcohol: '14.9%',
      note: 'A tiny harvest — only 96 cases. Boysenberry, white chocolate and cigar box. Beautiful fruit, an elegant wine.'
    },
    {
      year: 2022,
      status: 'coming',
      price: null,
      image: 'images/bottles/bottle-2022.webp',
      region: 'Walla Walla Valley',
      cases: 175,
      oak: 'Three years in Missouri oak',
      alcohol: '14.8%',
      note: 'Black cherry, licorice, cigar box and honeysuckle. Bold and expressive, yet remarkably elegant.'
    }
  ],

  // Each set's price is the bottle prices of its years added together
  verticals: [
    {
      name: 'The Vertical Library',
      years: [2011, 2012, 2014, 2016, 2017, 2018],
      note: 'One bottle of every older vintage we have left. Only a handful of sets exist.'
    },
    {
      name: 'The Early Years',
      years: [2011, 2012, 2014],
      note: 'The three oldest vintages in our library, side by side.'
    },
    {
      name: 'The Award Trio',
      years: [2017, 2018, 2019],
      note: 'Double Gold, 97 points and the current release.'
    }
  ]
};
