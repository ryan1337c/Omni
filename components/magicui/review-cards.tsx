import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";


const reviews = [
  {
    name: "Leo Martins",
    username: "@leo.codes.late",
    body: "Pasted my messy lecture notes in at 1am and got flashcards back before my coffee finished brewing. Passed my data structures midterm. Not saying it's magic, but…",
    img: "/avatars/gojo.jpeg",
  },
  {
    name: "Aya Nakamura",
    username: "@ayainkpots",
    body: "I use the image generator for my D&D campaign and the chat to untangle my bio readings. Weird combo, works perfectly.",
    img: "/avatars/girl.jpg",
  },
  {
    name: "Finn O'Connell",
    username: "@finnishedyet",
    body: "The quiz mode is brutal in the best way. It caught every topic I'd been quietly skipping. My prof would be proud. Or concerned.",
    img: "/avatars/boy.jpg",
  },
  {
    name: "Chloe Sun",
    username: "@chloe_sunnyside",
    body: "Ran my resume through the tailor before applying to an internship and actually got a callback this time. Coincidence? I'm choosing to believe no.",
    img: "/avatars/girl2.jpeg",
  },
  {
    name: "Marco Rossi",
    username: "@marco_rossi_irl",
    body: "I had five tabs open for studying: notes, ChatGPT, Quizlet, a PDF, and regret. Now it's just Omni. Okay, and maybe still a little regret.",
    img: "/avatars/ashe.jpeg",
  },
  {
    name: "Zara Ahmed",
    username: "@zara.zzz",
    body: "Clean UI, no clutter, and it doesn't make me feel dumb for asking the same question three times. 10/10 study buddy.",
    img: "/avatars/neko.jpeg",
  },
];
const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img className="size-8 rounded-full object-cover shrink-0" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

export function MarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-landingPageLight dark:from-landingPage to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-landingPageLight dark:from-landingPage to-transparent"></div>
    </div>
  );
}