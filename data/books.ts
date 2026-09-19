export type Book = {
  id: string;
  title: string;
  cover: string;
  blurb: string;
};

export const books: Book[] = [
  {
    id: "just-getting-up-on-computers",
    title: "Just Getting Up On Computers",
    cover: "/covers/just-getting-up-on-computers.jpg",
    blurb: "By Ghettolink",
  },
  {
    id: "a-toast-to-the-dance-hood",
    title: "A Toast to the Dance Hood",
    cover: "/covers/a-toast-to-the-dance-hood.jpg",
    blurb: "Dr. Funk, Steel Seville, Ace Washington",
  },
  {
    id: "knowing-the-game-and-how-to-play",
    title: "Knowing the Game and How to Play",
    cover: "/covers/knowing-the-game-and-how-to-play.jpg",
    blurb: "It's not what you know… it's how you play it.",
  },
  {
    id: "modern-gangster",
    title: "Modern Gangster",
    cover: "/covers/modern-gangster.jpg",
    blurb: "SF Western Edition",
  },
  {
    id: "black-tony",
    title: "Black Tony",
    cover: "/covers/black-tony.jpg",
    blurb: "Brother man just got out of the pen.",
  },
  {
    id: "money-truck",
    title: "Money Truck",
    cover: "/covers/money-truck.png",
    blurb: "By Ghettolink",
  },
  {
    id: "getting-at-my-homeboys-girl",
    title: "Getting at My Homeboy's Girl",
    cover: "/covers/getting-at-my-homeboys-girl.png",
    blurb: "I did not know this was his girlfriend.",
  },
  {
    id: "my-one-day-pimp-day",
    title: "My One Day Pimp Day",
    cover: "/covers/my-one-day-pimp-day.png",
    blurb: "By Ghettolink",
  },
  {
    id: "square-gone-gangster",
    title: "Square Gone Gangster",
    cover: "/covers/square-gone-gangster.jpg",
    blurb: "By Ghettolink",
  },
  {
    id: "playing-the-girls",
    title: "Playing the Girls",
    cover: "/covers/playing-the-girls.png",
    blurb: "And know how to play.",
  },
  {
    id: "back-in-ya-so-soon",
    title: "Back in Y.A. So Soon",
    cover: "/covers/back-in-ya-so-soon.jpg",
    blurb: "By GhettoLink",
  },
  {
    id: "first-time-for-all-things",
    title: "First Time for All Things",
    cover: "/covers/first-time-for-all-things.jpg",
    blurb: "By GhettoLink",
  },
  {
    id: "midnight-run",
    title: "Midnight Run",
    cover: "/covers/midnight-run.png",
    blurb: "A Fillmore horror story",
  },
  {
    id: "i-went-to-jail-to-fellowship-with-god",
    title: "I Went to Jail to Fellowship with God",
    cover: "/covers/i-went-to-jail-to-fellowship-with-god.jpg",
    blurb: "By GhettoLink",
  },
];

export function getBooksByIds(ids: string[]): Book[] {
  const byId = new Map(books.map((book) => [book.id, book]));
  return ids.flatMap((id) => {
    const book = byId.get(id);
    return book ? [book] : [];
  });
}

export function getBooksByTitles(titles: string[]): Book[] {
  const wanted = new Set(titles);
  return books.filter((book) => wanted.has(book.title));
}
