// Shared mock data for the blindspot interface.
// All copy and figures here are placeholder demo content.

export type LaneGrade = 'good' | 'ok' | 'bad'

export type LaneSegment = {
  id: string
  name: string
  grade: LaneGrade
  // rough GPS path drawn over the city
  path: [number, number][]
  detections: number
  note: string
}

// A loose grid of streets around a downtown core (lat/lng near Portland, OR).
export const laneSegments: LaneSegment[] = [
  {
    id: 'seg-01',
    name: 'NE Alberta St',
    grade: 'good',
    detections: 1284,
    note: 'Protected lane, fresh paint, clear sharrows.',
    path: [
      [45.5588, -122.665],
      [45.5588, -122.648],
    ],
  },
  {
    id: 'seg-02',
    name: 'N Williams Ave',
    grade: 'good',
    detections: 2041,
    note: 'Buffered lane, high ridership, well maintained.',
    path: [
      [45.5495, -122.6668],
      [45.5352, -122.6668],
    ],
  },
  {
    id: 'seg-03',
    name: 'SE Hawthorne Blvd',
    grade: 'bad',
    detections: 1672,
    note: 'Faded lines, frequent door-zone conflicts.',
    path: [
      [45.5122, -122.654],
      [45.5122, -122.628],
    ],
  },
  {
    id: 'seg-04',
    name: 'SW Broadway',
    grade: 'ok',
    detections: 988,
    note: 'Shared lane, sharrows present but worn.',
    path: [
      [45.5188, -122.6815],
      [45.5078, -122.6815],
    ],
  },
  {
    id: 'seg-05',
    name: 'NE Going St Greenway',
    grade: 'good',
    detections: 1530,
    note: 'Neighborhood greenway, low traffic, diverters.',
    path: [
      [45.5618, -122.668],
      [45.5618, -122.638],
    ],
  },
  {
    id: 'seg-06',
    name: 'SE Powell Blvd',
    grade: 'bad',
    detections: 2210,
    note: 'No buffer, heavy freight, lane drops out.',
    path: [
      [45.5012, -122.66],
      [45.5012, -122.62],
    ],
  },
  {
    id: 'seg-07',
    name: 'N Vancouver Ave',
    grade: 'ok',
    detections: 742,
    note: 'Painted lane, intermittent parking conflicts.',
    path: [
      [45.5495, -122.6655],
      [45.5352, -122.6655],
    ],
  },
  {
    id: 'seg-08',
    name: 'SE Clinton St',
    grade: 'good',
    detections: 1190,
    note: 'Quiet greenway, recently restriped.',
    path: [
      [45.5036, -122.654],
      [45.5036, -122.626],
    ],
  },
  {
    id: 'seg-09',
    name: 'W Burnside St',
    grade: 'bad',
    detections: 1875,
    note: 'No dedicated lane, fast traffic, blind merges.',
    path: [
      [45.5231, -122.682],
      [45.5231, -122.64],
    ],
  },
  {
    id: 'seg-10',
    name: 'NE Tillamook Greenway',
    grade: 'ok',
    detections: 656,
    note: 'Greenway with several uncontrolled crossings.',
    path: [
      [45.5408, -122.66],
      [45.5408, -122.632],
    ],
  },
]

export const laneGradeMeta: Record<
  LaneGrade,
  { label: string; token: string; description: string }
> = {
  good: {
    label: 'Clear',
    token: 'var(--lane-good)',
    description: 'Protected or well-marked. Recommended.',
  },
  ok: {
    label: 'Caution',
    token: 'var(--lane-ok)',
    description: 'Usable but degraded markings or conflicts.',
  },
  bad: {
    label: 'Avoid',
    token: 'var(--lane-bad)',
    description: 'Hazardous, missing, or heavily worn infrastructure.',
  },
}

export const mapCenter: [number, number] = [45.5272, -122.652]

export type Ride = {
  id: string
  title: string
  date: string
  distanceKm: number
  durationMin: number
  elevationM: number
  avgSpeed: number
  laneScore: number
  detections: number
  photos: number
}

export const rides: Ride[] = [
  {
    id: 'r-204',
    title: 'Morning loop — Eastside greenways',
    date: 'Jun 12',
    distanceKm: 24.6,
    durationMin: 71,
    elevationM: 184,
    avgSpeed: 20.8,
    laneScore: 88,
    detections: 142,
    photos: 6,
  },
  {
    id: 'r-203',
    title: 'Commute home via Williams',
    date: 'Jun 11',
    distanceKm: 11.2,
    durationMin: 34,
    elevationM: 62,
    avgSpeed: 19.7,
    laneScore: 74,
    detections: 58,
    photos: 2,
  },
  {
    id: 'r-202',
    title: 'River route + bridge climbs',
    date: 'Jun 9',
    distanceKm: 41.3,
    durationMin: 128,
    elevationM: 540,
    avgSpeed: 19.3,
    laneScore: 81,
    detections: 233,
    photos: 11,
  },
  {
    id: 'r-201',
    title: 'Powell test — flagging bad lanes',
    date: 'Jun 7',
    distanceKm: 18.0,
    durationMin: 59,
    elevationM: 120,
    avgSpeed: 18.3,
    laneScore: 52,
    detections: 96,
    photos: 4,
  },
  {
    id: 'r-200',
    title: 'Sunset shakeout',
    date: 'Jun 5',
    distanceKm: 9.4,
    durationMin: 28,
    elevationM: 44,
    avgSpeed: 20.1,
    laneScore: 90,
    detections: 37,
    photos: 3,
  },
]

export type FeedItem = {
  id: string
  user: string
  handle: string
  avatarColor: string
  time: string
  type: 'ride' | 'flag' | 'photo' | 'badge'
  title: string
  body: string
  stat?: string
  kudos: number
  comments: number
}

export const feed: FeedItem[] = [
  {
    id: 'f-1',
    user: 'Mara Okafor',
    handle: 'mararides',
    avatarColor: 'var(--lane-good)',
    time: '12m',
    type: 'flag',
    title: 'Flagged a degraded lane on SE Hawthorne Blvd',
    body: 'Lines basically gone east of 30th. Detector caught it three passes in a row — rerouting to Clinton.',
    stat: 'Avoid · 1,672 detections',
    kudos: 42,
    comments: 9,
  },
  {
    id: 'f-2',
    user: 'Theo Lindqvist',
    handle: 'theo_l',
    avatarColor: 'var(--primary)',
    time: '48m',
    type: 'ride',
    title: 'Logged a 41.3 km ride — River route + bridge climbs',
    body: 'Hands-free captured 11 shots crossing Tilikum. Lane score held at 81 the whole way.',
    stat: '41.3 km · 540 m · score 81',
    kudos: 118,
    comments: 21,
  },
  {
    id: 'f-3',
    user: 'Priya Raman',
    handle: 'priyaspins',
    avatarColor: 'var(--chart-3)',
    time: '2h',
    type: 'photo',
    title: 'Captured fresh sharrows on N Williams',
    body: 'City restriped overnight. blindspot already bumped the segment from Caution to Clear.',
    stat: 'Williams Ave · Clear',
    kudos: 76,
    comments: 5,
  },
  {
    id: 'f-4',
    user: 'Dani Brooks',
    handle: 'danib',
    avatarColor: 'var(--lane-ok)',
    time: '5h',
    type: 'badge',
    title: 'Earned the Cartographer badge',
    body: 'Contributed lane data on 50 unique segments this month. That data routes the whole network.',
    stat: '50 segments mapped',
    kudos: 203,
    comments: 34,
  },
]

export type Rider = {
  rank: number
  name: string
  handle: string
  detections: number
  km: number
  segments: number
  you?: boolean
}

export const leaderboard: Rider[] = [
  { rank: 1, name: 'Theo Lindqvist', handle: 'theo_l', detections: 18420, km: 2140, segments: 312 },
  { rank: 2, name: 'Mara Okafor', handle: 'mararides', detections: 16980, km: 1875, segments: 288 },
  { rank: 3, name: 'Dani Brooks', handle: 'danib', detections: 15240, km: 1990, segments: 274 },
  { rank: 4, name: 'Priya Raman', handle: 'priyaspins', detections: 13110, km: 1620, segments: 241 },
  { rank: 5, name: 'You', handle: 'rider', detections: 11890, km: 1488, segments: 207, you: true },
  { rank: 6, name: 'Sam Whitfield', handle: 'samw', detections: 10750, km: 1402, segments: 198 },
  { rank: 7, name: 'Ines Costa', handle: 'inescosta', detections: 9980, km: 1310, segments: 176 },
  { rank: 8, name: 'Kofi Mensah', handle: 'kofim', detections: 9120, km: 1255, segments: 164 },
]

export type RidePhoto = {
  id: string
  ride: string
  location: string
  grade: LaneGrade
  prompt: string
}

export const ridePhotos: RidePhoto[] = [
  {
    id: 'p-1',
    ride: 'River route',
    location: 'Tilikum Crossing',
    grade: 'good',
    prompt:
      'POV from a bicycle handlebar mount crossing a modern cable-stayed bridge bike path at golden hour, painted green bike lane, motion blur, cinematic, overcast sky',
  },
  {
    id: 'p-2',
    ride: 'Powell test',
    location: 'SE Powell Blvd',
    grade: 'bad',
    prompt:
      'Handlebar POV of a faded worn bike lane on a busy arterial road next to freight trucks, cracked asphalt, no buffer, gritty documentary style, daytime',
  },
  {
    id: 'p-3',
    ride: 'Morning loop',
    location: 'NE Going St Greenway',
    grade: 'good',
    prompt:
      'Handlebar POV riding down a quiet tree-lined neighborhood greenway with fresh sharrow markings on the pavement, dappled morning light, green leaves',
  },
  {
    id: 'p-4',
    ride: 'Commute',
    location: 'N Williams Ave',
    grade: 'ok',
    prompt:
      'POV bicycle handlebar shot of an urban buffered bike lane during evening commute, parked cars on the right, soft dusk light, city buildings',
  },
  {
    id: 'p-5',
    ride: 'River route',
    location: 'Eastbank Esplanade',
    grade: 'good',
    prompt:
      'Handlebar POV cruising a waterfront paved bike path beside a river, skyline across the water, clear blue sky, smooth asphalt, summer',
  },
  {
    id: 'p-6',
    ride: 'Sunset shakeout',
    location: 'SE Clinton St',
    grade: 'good',
    prompt:
      'Handlebar POV on a calm residential bike greenway at sunset, long shadows, orange sky, freshly painted bike symbol on road',
  },
]

export type WeeklyStat = { day: string; km: number; detections: number }

export const weekly: WeeklyStat[] = [
  { day: 'Mon', km: 11.2, detections: 58 },
  { day: 'Tue', km: 0, detections: 0 },
  { day: 'Wed', km: 18.0, detections: 96 },
  { day: 'Thu', km: 9.4, detections: 37 },
  { day: 'Fri', km: 24.6, detections: 142 },
  { day: 'Sat', km: 41.3, detections: 233 },
  { day: 'Sun', km: 14.8, detections: 71 },
]
