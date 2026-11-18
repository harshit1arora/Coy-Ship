const names =
  "Maya Theo Aria Omar Iris Leo Nina Luca Zoe Arun Freya Hugo Riya Ezra June Nico Tara Sami Mira Finn Anya Remy Cleo Axel Hana Ben Lila Max Ada Dev Rosa Eli".split(
    " ",
  );
const places = ["Brooklyn", "Queens", "Manhattan", "Brooklyn", "Jersey City"];
const hobbies = [
  [
    "Photography",
    "Coffee",
    "Bookshops",
    "Always taking the scenic route. Looking for a coffee spot worth waking up early for.",
  ],
  [
    "Climbing",
    "Jazz",
    "Cooking",
    "Learning a new route or a new recipe most weekends. Tell me your favorite record.",
  ],
  [
    "Ceramics",
    "Cinema",
    "Walking",
    "I make slightly wonky mugs and keep a very long list of films to watch.",
  ],
  [
    "Running",
    "Vinyl",
    "Baking",
    "Early runs, late listening sessions, and a sourdough starter with a name.",
  ],
  [
    "Gardening",
    "Art",
    "Hiking",
    "My windowsill is a tiny jungle. Happiest on a trail with a sketchbook.",
  ],
  [
    "Cycling",
    "Design",
    "Tacos",
    "I plan bike rides around lunch stops. Currently searching for the perfect taco.",
  ],
  [
    "Books",
    "Dance",
    "Tea",
    "My ideal Sunday starts at a used bookstore and ends on a dance floor.",
  ],
];
export const profiles = names.map((name, i) => {
  const [a, b, c, bio] = hobbies[i % hobbies.length];
  return {
    id: "p" + (i + 1),
    name,
    age: 24 + (i % 9),
    photo: "/photos/" + (i + 1) + ".jpg",
    bio,
    city: places[i % places.length],
    interests: [a, b, c],
  };
});
export const incomingLikes = new Set([
  "p1",
  "p4",
  "p9",
  "p14",
  "p19",
  "p23",
  "p28",
  "p32",
]);
