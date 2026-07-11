import type { UrriEntry } from '../types';

// The call pool for Chiriya Urri. Grammar follows Urdu gender agreement:
// feminine nouns take "Urri", masculine take "Urra".
// Emoji and notes are revealed only after a round is scored.
export const answers: UrriEntry[] = [
  // ── Birds and other true flyers ────────────────────────────────
  { id: 'chiriya', prompt: 'Chiriya Urri', meaning: 'Sparrow', emoji: '🐦', canFly: true },
  { id: 'kawwa', prompt: 'Kawwa Urra', meaning: 'Crow', emoji: '🐦‍⬛', canFly: true },
  { id: 'tota', prompt: 'Tota Urra', meaning: 'Parrot', emoji: '🦜', canFly: true },
  { id: 'kabootar', prompt: 'Kabootar Urra', meaning: 'Pigeon', emoji: '🕊️', canFly: true },
  { id: 'baaz', prompt: 'Baaz Urra', meaning: 'Falcon', emoji: '🦅', canFly: true },
  { id: 'uqaab', prompt: 'Uqaab Urra', meaning: 'Eagle', emoji: '🦅', canFly: true },
  { id: 'cheel', prompt: 'Cheel Urri', meaning: 'Kite (the bird)', emoji: '🦅', canFly: true },
  { id: 'bulbul', prompt: 'Bulbul Urri', meaning: 'Nightingale', emoji: '🐦', canFly: true },
  { id: 'koyal', prompt: 'Koyal Urri', meaning: 'Cuckoo', emoji: '🐦', canFly: true },
  { id: 'faakhta', prompt: 'Faakhta Urri', meaning: 'Dove', emoji: '🕊️', canFly: true },
  { id: 'abaabeel', prompt: 'Abaabeel Urri', meaning: 'Swallow', emoji: '🐦', canFly: true },
  { id: 'mynah', prompt: 'Mynah Urri', meaning: 'Myna bird', emoji: '🐦', canFly: true },
  { id: 'batakh', prompt: 'Batakh Urri', meaning: 'Duck', emoji: '🦆', canFly: true, note: 'Ducks waddle, but they fly too!' },
  { id: 'hans', prompt: 'Hans Urra', meaning: 'Swan', emoji: '🦢', canFly: true },
  { id: 'bagula', prompt: 'Bagula Urra', meaning: 'Heron', emoji: '🦩', canFly: true },
  { id: 'ullu', prompt: 'Ullu Urra', meaning: 'Owl', emoji: '🦉', canFly: true },
  { id: 'parinda', prompt: 'Parinda Urra', meaning: 'Bird', emoji: '🐦', canFly: true },
  { id: 'murghi', prompt: 'Murghi Urri', meaning: 'Hen', emoji: '🐔', canFly: true, trick: true, note: 'Contested in every gali — but hens really can flutter-fly onto a wall!' },
  { id: 'mor', prompt: 'Mor Urra', meaning: 'Peacock', emoji: '🦚', canFly: true, trick: true, note: 'A classic trick — peacocks DO fly, up into trees at dusk.' },

  // ── Insects and small flyers ───────────────────────────────────
  { id: 'titli', prompt: 'Titli Urri', meaning: 'Butterfly', emoji: '🦋', canFly: true },
  { id: 'machhar', prompt: 'Machhar Urra', meaning: 'Mosquito', emoji: '🦟', canFly: true },
  { id: 'makkhi', prompt: 'Makkhi Urri', meaning: 'Housefly', emoji: '🪰', canFly: true },
  { id: 'shehd-makkhi', prompt: 'Shehd ki Makkhi Urri', meaning: 'Honeybee', emoji: '🐝', canFly: true },
  { id: 'bhirr', prompt: 'Bhirr Urri', meaning: 'Wasp', emoji: '🐝', canFly: true },
  { id: 'jugnu', prompt: 'Jugnu Urra', meaning: 'Firefly', emoji: '✨', canFly: true },
  { id: 'tiddi', prompt: 'Tiddi Urri', meaning: 'Locust', emoji: '🦗', canFly: true },
  { id: 'patanga', prompt: 'Patanga Urra', meaning: 'Moth', emoji: '🦋', canFly: true },
  { id: 'chamgadar', prompt: 'Chamgadar Urri', meaning: 'Bat', emoji: '🦇', canFly: true, trick: true, note: 'Not a bird at all — but the only mammal that truly flies.' },

  // ── Machines and things that fly ───────────────────────────────
  { id: 'hawai-jahaz', prompt: 'Hawai Jahaz Urra', meaning: 'Aeroplane', emoji: '✈️', canFly: true },
  { id: 'helicopter', prompt: 'Helicopter Urra', meaning: 'Helicopter', emoji: '🚁', canFly: true },
  { id: 'rocket', prompt: 'Rocket Urra', meaning: 'Rocket', emoji: '🚀', canFly: true },
  { id: 'drone', prompt: 'Drone Urra', meaning: 'Drone', emoji: '🛸', canFly: true },
  { id: 'patang', prompt: 'Patang Urri', meaning: 'Kite (the toy)', emoji: '🪁', canFly: true, note: 'Basant approved.' },
  { id: 'ghubara', prompt: 'Ghubara Urra', meaning: 'Balloon', emoji: '🎈', canFly: true },
  { id: 'superman', prompt: 'Superman Urra', meaning: 'Superman', emoji: '🦸', canFly: true, trick: true, note: 'Insaan nahi urta... lekin Superman urta hai!' },

  // ── Animals that definitely do not fly ─────────────────────────
  { id: 'billi', prompt: 'Billi Urri', meaning: 'Cat', emoji: '🐱', canFly: false },
  { id: 'kutta', prompt: 'Kutta Urra', meaning: 'Dog', emoji: '🐶', canFly: false },
  { id: 'gadha', prompt: 'Gadha Urra', meaning: 'Donkey', emoji: '🫏', canFly: false },
  { id: 'ghora', prompt: 'Ghora Urra', meaning: 'Horse', emoji: '🐴', canFly: false },
  { id: 'gaye', prompt: 'Gaye Urri', meaning: 'Cow', emoji: '🐄', canFly: false },
  { id: 'bhains', prompt: 'Bhains Urri', meaning: 'Buffalo', emoji: '🐃', canFly: false },
  { id: 'bakri', prompt: 'Bakri Urri', meaning: 'Goat', emoji: '🐐', canFly: false },
  { id: 'oont', prompt: 'Oont Urra', meaning: 'Camel', emoji: '🐪', canFly: false },
  { id: 'haathi', prompt: 'Haathi Urra', meaning: 'Elephant', emoji: '🐘', canFly: false },
  { id: 'sher', prompt: 'Sher Urra', meaning: 'Lion', emoji: '🦁', canFly: false },
  { id: 'bandar', prompt: 'Bandar Urra', meaning: 'Monkey', emoji: '🐵', canFly: false, note: 'It swings, it leaps — it does not fly.' },
  { id: 'lomri', prompt: 'Lomri Urri', meaning: 'Fox', emoji: '🦊', canFly: false },
  { id: 'chuha', prompt: 'Chuha Urra', meaning: 'Mouse', emoji: '🐭', canFly: false, trick: true, note: 'Easy to confuse with its flying cousin, the chamgadar.' },
  { id: 'gilehri', prompt: 'Gilehri Urri', meaning: 'Squirrel', emoji: '🐿️', canFly: false, note: 'Flying squirrels glide — they do not fly. Stay put!' },
  { id: 'machhli', prompt: 'Machhli Urri', meaning: 'Fish', emoji: '🐟', canFly: false, trick: true, note: 'Flying fish only glide. In this gali, machhli does not fly.' },
  { id: 'mendak', prompt: 'Mendak Urra', meaning: 'Frog', emoji: '🐸', canFly: false, trick: true, note: 'Jumping is not flying!' },
  { id: 'saanp', prompt: 'Saanp Urra', meaning: 'Snake', emoji: '🐍', canFly: false },
  { id: 'kachwa', prompt: 'Kachwa Urra', meaning: 'Turtle', emoji: '🐢', canFly: false },
  { id: 'kangaroo', prompt: 'Kangaroo Urra', meaning: 'Kangaroo', emoji: '🦘', canFly: false, trick: true, note: 'Big jumps, zero flight.' },
  { id: 'shutar-murgh', prompt: 'Shutar Murgh Urra', meaning: 'Ostrich', emoji: '🪶', canFly: false, trick: true, note: 'The king of trick calls — a bird that cannot fly!' },
  { id: 'penguin', prompt: 'Penguin Urra', meaning: 'Penguin', emoji: '🐧', canFly: false, trick: true, note: 'A bird, yes. A flyer, no. It swims instead.' },

  // ── Vehicles that stay on the ground (or water) ────────────────
  { id: 'car', prompt: 'Car Urri', meaning: 'Car', emoji: '🚗', canFly: false },
  { id: 'bus', prompt: 'Bus Urri', meaning: 'Bus', emoji: '🚌', canFly: false },
  { id: 'train', prompt: 'Train Urri', meaning: 'Train', emoji: '🚂', canFly: false },
  { id: 'truck', prompt: 'Truck Urra', meaning: 'Truck', emoji: '🚚', canFly: false },
  { id: 'cycle', prompt: 'Cycle Urri', meaning: 'Bicycle', emoji: '🚲', canFly: false },
  { id: 'rickshaw', prompt: 'Rickshaw Urra', meaning: 'Rickshaw', emoji: '🛺', canFly: false },
  { id: 'kashti', prompt: 'Kashti Urri', meaning: 'Boat', emoji: '⛵', canFly: false },
  { id: 'pani-jahaz', prompt: 'Pani ka Jahaz Urra', meaning: 'Ship', emoji: '🚢', canFly: false, trick: true, note: '"Jahaz" cuts both ways — the hawai one flies, the pani one floats.' },

  // ── Everyday things a sneaky caller will try ───────────────────
  { id: 'mez', prompt: 'Mez Urri', meaning: 'Table', emoji: '🪵', canFly: false },
  { id: 'kursi', prompt: 'Kursi Urri', meaning: 'Chair', emoji: '🪑', canFly: false },
  { id: 'kitab', prompt: 'Kitab Urri', meaning: 'Book', emoji: '📖', canFly: false },
  { id: 'joota', prompt: 'Joota Urra', meaning: 'Shoe', emoji: '👟', canFly: false, note: 'Only when thrown. Does not count.' },
  { id: 'topi', prompt: 'Topi Urri', meaning: 'Cap', emoji: '🧢', canFly: false },
  { id: 'darakht', prompt: 'Darakht Urra', meaning: 'Tree', emoji: '🌳', canFly: false },
  { id: 'pahar', prompt: 'Pahar Urra', meaning: 'Mountain', emoji: '⛰️', canFly: false },
  { id: 'patthar', prompt: 'Patthar Urra', meaning: 'Stone', emoji: '🪨', canFly: false },
  { id: 'patta', prompt: 'Patta Urra', meaning: 'Leaf', emoji: '🍂', canFly: false, trick: true, note: 'It drifts on the wind — but falling with style is not flying.' },
  { id: 'badal', prompt: 'Badal Urra', meaning: 'Cloud', emoji: '☁️', canFly: false, trick: true, note: 'Clouds float and drift. They do not fly. House rule!' },
  { id: 'chand', prompt: 'Chand Urra', meaning: 'Moon', emoji: '🌙', canFly: false },
  { id: 'taara', prompt: 'Taara Urra', meaning: 'Star', emoji: '⭐', canFly: false, note: 'A shooting star falls, it does not fly.' },
  { id: 'chai', prompt: 'Chai Urri', meaning: 'Tea', emoji: '☕', canFly: false },
  { id: 'samosa', prompt: 'Samosa Urra', meaning: 'Samosa', emoji: '🥟', canFly: false },
  { id: 'aam', prompt: 'Aam Urra', meaning: 'Mango', emoji: '🥭', canFly: false },
  { id: 'kela', prompt: 'Kela Urra', meaning: 'Banana', emoji: '🍌', canFly: false },

  // ── People (see: Superman) ─────────────────────────────────────
  { id: 'insaan', prompt: 'Insaan Urra', meaning: 'Human', emoji: '🧍', canFly: false, trick: true, note: 'No cape, no flight.' },
  { id: 'dadi', prompt: 'Dadi Urri', meaning: 'Grandmother', emoji: '👵', canFly: false },
  { id: 'ustad', prompt: 'Ustad Urra', meaning: 'Teacher', emoji: '🧑‍🏫', canFly: false },
  { id: 'doctor', prompt: 'Doctor Urra', meaning: 'Doctor', emoji: '🧑‍⚕️', canFly: false },
];
