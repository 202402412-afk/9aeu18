// Texture coordinates are measured on a 580 × 858 reference of each portfolio PNG.
// A rectangle uses left, top, right, bottom. A quadrilateral lists its corners clockwise from top left.
const face = (page, left, top, right, bottom) => ({
  page, corners: [[left, top], [right, top], [right, bottom], [left, bottom]],
});
const quad = (page, ...corners) => ({ page, corners });

// The supplied spreads run from back to front. These are their panel boundaries
// in source pixels, before conversion to WebP.
function originalJacket(number, width, height, [left, spineStart, spineEnd, right]) {
  const file = `assets/jacket-${number}.webp`;
  const panel = (start, end) => ({
    ...face(null, start * 580 / width, 0, end * 580 / width, 858),
    file,
  });

  if (spineStart === undefined) return { front: panel(left, width) };

  const spine = panel(spineStart, spineEnd);
  spine.corners.push(spine.corners.shift());
  return {
    rear: panel(left, spineStart),
    spine,
    front: panel(spineEnd, right),
    thicknessRatio: (spineEnd - spineStart) / height,
  };
}

const jackets = {
  'films-we-called-love': {
    size: [160, 230], color: '#f8e7ed', ink: '#72214b',
    ...originalJacket('01', 4179, 2787, [0, 1939, 2240, 4179]),
  },
  'book-makers': {
    size: [182, 257], color: '#ffea00',
    ...originalJacket('02', 4506, 3035, [0, 2150, 2356, 4506]),
  },
  'leaving-traces': {
    size: [182, 257], color: '#f1efea',
    ...originalJacket('03', 4476, 3035, [0, 2150, 2326, 4476]),
  },
  'city-edit': {
    size: [182, 257], thickness: 10,
    ...originalJacket('04', 2150, 3035, [0]),
  },
  jeju: {
    size: [150, 210], color: '#ee7936',
    ...originalJacket('05', 3697, 2480, [0, 1772, 1925, 3697]),
  },
  'crochet-sea': {
    size: [120, 188], color: '#8ebec8',
    ...originalJacket('06', 1750, 1304, [0, 812, 937, 1750]),
  },
  'reinventing-life': {
    aspect: 1307 / 2102, color: '#0e2a28',
    ...originalJacket('07', 4594, 2102, [944, 2251, 2343, 3650]),
  },
  gwihyanggil: {
    size: [182, 257], color: '#fff', ink: '#36362f',
    ...originalJacket('08', 4335, 3035, [0, 2150, 2185, 4335]),
  },
  tutoring: {},
  millie: { front: face(21, 0, 0, 580, 858), thickness: 10 },
  'reading-korea': {},
  'forest-library': {
    size: [210, 297], thickness: 7, color: '#e9e9df',
    front: quad(27, [149, 770], [149, 540], [448, 540], [448, 770]),
  },
  'fruit-fridge': {
    size: [210, 297], thickness: 16, color: '#f3f0e9',
    front: quad(31, [425, 240], [578, 333], [448, 757], [160, 566]),
    spine: quad(31, [391, 219], [132, 544], [160, 566], [425, 240]),
    partial: true,
  },
  'field-notes': {},
  'jiullim-web': {},
  'to-jieun': {
    size: [814, 4630], unit: 'px', thickness: 6,
    front: face(71, 93, 97, 309, 858),
    partial: true,
  },
  'summer-taste': { size: [600, 1800], thickness: 6 },
  'seoul-jazz': {
    size: [297, 420], thickness: 7, color: '#323131',
    front: face(75, 91, 157, 491, 740),
  },
  'sunny-pasta': {
    size: [210, 297], folded: [99, 210], thickness: 6,
    front: quad(77, [412, 306], [579, 379], [440, 736], [233, 639]),
    partial: true,
  },
};
