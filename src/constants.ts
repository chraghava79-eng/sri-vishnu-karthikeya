import { FearType, ExposureTask } from './types';

export const APP_LOGO = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop";

export const CORE_FEARS: FearType[] = [
  'Unknown',
  'Failure',
  'Judgement',
  'Rejection',
  'Darkness',
  'Being Alone',
  'Loss of Control'
];

export const INITIAL_FEARS = CORE_FEARS.map(type => ({
  type,
  score: 0,
  lastUpdated: new Date().toISOString()
}));

export const MOCK_TASKS: ExposureTask[] = [
  // Unknown
  { id: 'u1', fearType: 'Unknown', difficulty: 'easy', description: 'Try a new food you have never tasted before.', points: 10 },
  { id: 'u2', fearType: 'Unknown', difficulty: 'medium', description: 'Take a different route to work or school without using GPS.', points: 20 },
  { id: 'u3', fearType: 'Unknown', difficulty: 'easy', description: 'Listen to a genre of music you usually avoid.', points: 10 },
  { id: 'u4', fearType: 'Unknown', difficulty: 'hard', description: 'Attend a meetup or event where you know absolutely no one.', points: 30 },
  { id: 'u5', fearType: 'Unknown', difficulty: 'medium', description: 'Order a "surprise" drink or meal at a restaurant.', points: 20 },
  { id: 'u6', fearType: 'Unknown', difficulty: 'easy', description: 'Watch a movie in a language you don\'t speak without subtitles.', points: 10 },
  { id: 'u7', fearType: 'Unknown', difficulty: 'medium', description: 'Start a conversation with someone wearing an interesting accessory.', points: 20 },
  { id: 'u8', fearType: 'Unknown', difficulty: 'hard', description: 'Sign up for a class in a subject you know nothing about.', points: 30 },
  { id: 'u9', fearType: 'Unknown', difficulty: 'easy', description: 'Read a book from a section of the library you never visit.', points: 10 },
  { id: 'u10', fearType: 'Unknown', difficulty: 'medium', description: 'Try a hobby that requires a skill you don\'t currently have.', points: 20 },
  { id: 'u11', fearType: 'Unknown', difficulty: 'easy', description: 'Walk into a store you have never entered before and look around for 5 minutes.', points: 10 },
  { id: 'u12', fearType: 'Unknown', difficulty: 'medium', description: 'Ask a librarian or bookseller for their most unusual recommendation.', points: 20 },
  { id: 'u13', fearType: 'Unknown', difficulty: 'hard', description: 'Take a bus or train to a random stop and explore the area for an hour.', points: 30 },
  { id: 'u14', fearType: 'Unknown', difficulty: 'easy', description: 'Try a fruit or vegetable you can\'t name at the grocery store.', points: 10 },
  { id: 'u15', fearType: 'Unknown', difficulty: 'medium', description: 'Go to a restaurant and ask the waiter to bring you their favorite dish.', points: 20 },

  // Failure
  { id: 'f1', fearType: 'Failure', difficulty: 'easy', description: 'Play a game you are bad at and focus on the fun, not the score.', points: 10 },
  { id: 'f2', fearType: 'Failure', difficulty: 'medium', description: 'Apply for a job or role you feel slightly underqualified for.', points: 20 },
  { id: 'f3', fearType: 'Failure', difficulty: 'hard', description: 'Start a small project (like a drawing or a poem) and intentionally leave it imperfect.', points: 30 },
  { id: 'f4', fearType: 'Failure', difficulty: 'medium', description: 'Share a mistake you made today with a friend or colleague.', points: 20 },
  { id: 'f5', fearType: 'Failure', difficulty: 'hard', description: 'Try a complex recipe that you have never attempted before.', points: 30 },
  { id: 'f6', fearType: 'Failure', difficulty: 'easy', description: 'Attempt a difficult puzzle and walk away if you can\'t solve it.', points: 10 },
  { id: 'f7', fearType: 'Failure', difficulty: 'medium', description: 'Learn a tongue twister and try to say it fast in front of someone.', points: 20 },
  { id: 'f8', fearType: 'Failure', difficulty: 'hard', description: 'Enter a competition where the odds of winning are very low.', points: 30 },
  { id: 'f9', fearType: 'Failure', difficulty: 'easy', description: 'Try to draw a portrait of someone in 30 seconds.', points: 10 },
  { id: 'f10', fearType: 'Failure', difficulty: 'medium', description: 'Ask for feedback on a piece of work you are nervous about.', points: 20 },
  { id: 'f11', fearType: 'Failure', difficulty: 'easy', description: 'Try to build a house of cards and let it fall without getting frustrated.', points: 10 },
  { id: 'f12', fearType: 'Failure', difficulty: 'medium', description: 'Attempt a difficult yoga pose or physical exercise you know you can\'t do yet.', points: 20 },
  { id: 'f13', fearType: 'Failure', difficulty: 'hard', description: 'Submit a piece of writing or art to a publication or contest.', points: 30 },
  { id: 'f14', fearType: 'Failure', difficulty: 'easy', description: 'Try to learn a simple magic trick and perform it poorly for a friend.', points: 10 },
  { id: 'f15', fearType: 'Failure', difficulty: 'medium', description: 'Set a challenging goal for the day and be okay if you only reach 50% of it.', points: 20 },

  // Judgement
  { id: 'j1', fearType: 'Judgement', difficulty: 'easy', description: 'Wear a slightly mismatched outfit in public.', points: 10 },
  { id: 'j2', fearType: 'Judgement', difficulty: 'medium', description: 'Hum or sing quietly to yourself while walking in a public space.', points: 20 },
  { id: 'j3', fearType: 'Judgement', difficulty: 'hard', description: 'Give a compliment to a complete stranger.', points: 30 },
  { id: 'j4', fearType: 'Judgement', difficulty: 'medium', description: 'Post a photo on social media without any filters or editing.', points: 20 },
  { id: 'j5', fearType: 'Judgement', difficulty: 'hard', description: 'Ask for a discount at a store where prices are usually fixed.', points: 30 },
  { id: 'j6', fearType: 'Judgement', difficulty: 'easy', description: 'Sit in a crowded cafe without looking at your phone or a book.', points: 10 },
  { id: 'j7', fearType: 'Judgement', difficulty: 'medium', description: 'Dance for 10 seconds in a place where people might see you.', points: 20 },
  { id: 'j8', fearType: 'Judgement', difficulty: 'hard', description: 'Give a short speech or toast at a small gathering.', points: 30 },
  { id: 'j9', fearType: 'Judgement', difficulty: 'easy', description: 'Ask a question in a large meeting or class.', points: 10 },
  { id: 'j10', fearType: 'Judgement', difficulty: 'medium', description: 'Walk backwards for a short distance in a public park.', points: 20 },
  { id: 'j11', fearType: 'Judgement', difficulty: 'easy', description: 'Wear your hat sideways or backwards in a professional-looking setting.', points: 10 },
  { id: 'j12', fearType: 'Judgement', difficulty: 'medium', description: 'Eat a messy food (like a large burger) in a crowded public place.', points: 20 },
  { id: 'j13', fearType: 'Judgement', difficulty: 'hard', description: 'Stand in the middle of a busy sidewalk and look up at the sky for 30 seconds.', points: 30 },
  { id: 'j14', fearType: 'Judgement', difficulty: 'easy', description: 'Carry a slightly unusual object (like a rubber duck) in your hand while walking.', points: 10 },
  { id: 'j15', fearType: 'Judgement', difficulty: 'medium', description: 'Ask a stranger for the time even if you have a watch or phone.', points: 20 },

  // Rejection
  { id: 'r1', fearType: 'Rejection', difficulty: 'easy', description: 'Ask a coworker or friend for a small favor.', points: 10 },
  { id: 'r2', fearType: 'Rejection', difficulty: 'medium', description: 'Invite someone you haven\'t spoken to in a while for coffee.', points: 20 },
  { id: 'r3', fearType: 'Rejection', difficulty: 'hard', description: 'Ask a stranger for a small favor you expect them to say no to.', points: 30 },
  { id: 'r4', fearType: 'Rejection', difficulty: 'medium', description: 'Apply for a competitive program or contest.', points: 20 },
  { id: 'r5', fearType: 'Rejection', difficulty: 'hard', description: 'Ask for a "free" item at a cafe (like a sample) even if not offered.', points: 30 },
  { id: 'r6', fearType: 'Rejection', difficulty: 'easy', description: 'Ask a shop assistant for a recommendation and then don\'t buy it.', points: 10 },
  { id: 'r7', fearType: 'Rejection', difficulty: 'medium', description: 'Ask to join a group of people having a conversation.', points: 20 },
  { id: 'r8', fearType: 'Rejection', difficulty: 'hard', description: 'Ask someone out on a date (or for their number).', points: 30 },
  { id: 'r9', fearType: 'Rejection', difficulty: 'easy', description: 'Ask for a seat next to someone in a crowded area.', points: 10 },
  { id: 'r10', fearType: 'Rejection', difficulty: 'medium', description: 'Pitch an idea to your boss or a group of peers.', points: 20 },
  { id: 'r11', fearType: 'Rejection', difficulty: 'easy', description: 'Ask for a water cup at a fast food place and then ask for a refill of soda (and accept the "no").', points: 10 },
  { id: 'r12', fearType: 'Rejection', difficulty: 'medium', description: 'Ask a stranger if you can take their photo (for a "project").', points: 20 },
  { id: 'r13', fearType: 'Rejection', difficulty: 'hard', description: 'Ask a store manager for a job even if there are no "hiring" signs.', points: 30 },
  { id: 'r14', fearType: 'Rejection', difficulty: 'easy', description: 'Ask to pet someone\'s dog and be okay if they say no.', points: 10 },
  { id: 'r15', fearType: 'Rejection', difficulty: 'medium', description: 'Ask a neighbor for a cup of sugar or a small tool.', points: 20 },

  // Darkness
  { id: 'd1', fearType: 'Darkness', difficulty: 'easy', description: 'Sit in a dark room for 5 minutes without any lights or devices.', points: 10 },
  { id: 'd2', fearType: 'Darkness', difficulty: 'medium', description: 'Walk through your home at night with all the lights off.', points: 20 },
  { id: 'd3', fearType: 'Darkness', difficulty: 'hard', description: 'Spend 15 minutes in a completely dark, unfamiliar space (like a basement).', points: 30 },
  { id: 'd4', fearType: 'Darkness', difficulty: 'easy', description: 'Listen to a spooky podcast in the dark.', points: 10 },
  { id: 'd5', fearType: 'Darkness', difficulty: 'medium', description: 'Sit outside at night for 10 minutes without a flashlight.', points: 20 },
  { id: 'd6', fearType: 'Darkness', difficulty: 'easy', description: 'Close your eyes and try to navigate your room for 2 minutes.', points: 10 },
  { id: 'd7', fearType: 'Darkness', difficulty: 'medium', description: 'Sleep without any nightlight or hallway light for one night.', points: 20 },
  { id: 'd8', fearType: 'Darkness', difficulty: 'hard', description: 'Go for a walk in a safe but dimly lit park at night.', points: 30 },
  { id: 'd9', fearType: 'Darkness', difficulty: 'easy', description: 'Watch a horror movie trailer in the dark.', points: 10 },
  { id: 'd10', fearType: 'Darkness', difficulty: 'medium', description: 'Sit in a dark closet for 5 minutes and focus on your breathing.', points: 20 },
  { id: 'd11', fearType: 'Darkness', difficulty: 'easy', description: 'Walk from one room to another with your eyes closed.', points: 10 },
  { id: 'd12', fearType: 'Darkness', difficulty: 'medium', description: 'Sit in your car at night with all the lights off for 10 minutes.', points: 20 },
  { id: 'd13', fearType: 'Darkness', difficulty: 'hard', description: 'Explore a safe, familiar outdoor area at night without any artificial light.', points: 30 },
  { id: 'd14', fearType: 'Darkness', difficulty: 'easy', description: 'Listen to ambient "night sounds" in a dark room.', points: 10 },
  { id: 'd15', fearType: 'Darkness', difficulty: 'medium', description: 'Try to find a specific object in a dark room using only your hands.', points: 20 },

  // Being Alone
  { id: 'a1', fearType: 'Being Alone', difficulty: 'easy', description: 'Eat a meal alone without using your phone or a book.', points: 10 },
  { id: 'a2', fearType: 'Being Alone', difficulty: 'medium', description: 'Go to a movie or restaurant by yourself.', points: 20 },
  { id: 'a3', fearType: 'Being Alone', difficulty: 'hard', description: 'Spend a whole weekend day alone without any social plans.', points: 30 },
  { id: 'a4', fearType: 'Being Alone', difficulty: 'medium', description: 'Go for a long walk in a park by yourself.', points: 20 },
  { id: 'a5', fearType: 'Being Alone', difficulty: 'hard', description: 'Travel to a nearby city or town for a solo day trip.', points: 30 },
  { id: 'a6', fearType: 'Being Alone', difficulty: 'easy', description: 'Spend 30 minutes in a cafe alone without any digital devices.', points: 10 },
  { id: 'a7', fearType: 'Being Alone', difficulty: 'medium', description: 'Go to a museum or art gallery by yourself.', points: 20 },
  { id: 'a8', fearType: 'Being Alone', difficulty: 'hard', description: 'Go camping or hiking alone for a few hours.', points: 30 },
  { id: 'a9', fearType: 'Being Alone', difficulty: 'easy', description: 'Sit on a park bench alone for 20 minutes and just observe.', points: 10 },
  { id: 'a10', fearType: 'Being Alone', difficulty: 'medium', description: 'Attend a concert or show by yourself.', points: 20 },
  { id: 'a11', fearType: 'Being Alone', difficulty: 'easy', description: 'Go to a park and sit on a bench for 15 minutes without any distractions.', points: 10 },
  { id: 'a12', fearType: 'Being Alone', difficulty: 'medium', description: 'Take yourself on a "date" to a place you usually go with others.', points: 20 },
  { id: 'a13', fearType: 'Being Alone', difficulty: 'hard', description: 'Go on a solo hike in a well-marked trail for at least 2 hours.', points: 30 },
  { id: 'a14', fearType: 'Being Alone', difficulty: 'easy', description: 'Spend 20 minutes in a library reading a book alone.', points: 10 },
  { id: 'a15', fearType: 'Being Alone', difficulty: 'medium', description: 'Go to a shopping mall alone and just people-watch for 30 minutes.', points: 20 },

  // Loss of Control
  { id: 'l1', fearType: 'Loss of Control', difficulty: 'easy', description: 'Let a friend choose the music for a whole car ride.', points: 10 },
  { id: 'l2', fearType: 'Loss of Control', difficulty: 'medium', description: 'Order a meal by asking the server for their recommendation.', points: 20 },
  { id: 'l3', fearType: 'Loss of Control', difficulty: 'hard', description: 'Let someone else choose the route or activity for the entire day.', points: 30 },
  { id: 'l4', fearType: 'Loss of Control', difficulty: 'medium', description: 'Delegate a task you usually do yourself to someone else.', points: 20 },
  { id: 'l5', fearType: 'Loss of Control', difficulty: 'hard', description: 'Close your eyes and let someone lead you around for 5 minutes.', points: 30 },
  { id: 'l6', fearType: 'Loss of Control', difficulty: 'easy', description: 'Use a random number generator to decide what to wear today.', points: 10 },
  { id: 'l7', fearType: 'Loss of Control', difficulty: 'medium', description: 'Let your partner or a friend plan a surprise evening for you.', points: 20 },
  { id: 'l8', fearType: 'Loss of Control', difficulty: 'hard', description: 'Go to the airport or train station and take the next available trip within your budget.', points: 30 },
  { id: 'l9', fearType: 'Loss of Control', difficulty: 'easy', description: 'Let someone else drive you to a destination without asking for the route.', points: 10 },
  { id: 'l10', fearType: 'Loss of Control', difficulty: 'medium', description: 'Try a "mystery" box or subscription service.', points: 20 },
  { id: 'l11', fearType: 'Loss of Control', difficulty: 'easy', description: 'Flip a coin to decide between two small options (like what to eat).', points: 10 },
  { id: 'l12', fearType: 'Loss of Control', difficulty: 'medium', description: 'Let a child or younger sibling choose the activity for an hour.', points: 20 },
  { id: 'l13', fearType: 'Loss of Control', difficulty: 'hard', description: 'Go to a restaurant and tell the waiter to bring you "anything" within a price range.', points: 30 },
  { id: 'l14', fearType: 'Loss of Control', difficulty: 'easy', description: 'Use a random playlist on shuffle and don\'t skip any songs.', points: 10 },
  { id: 'l15', fearType: 'Loss of Control', difficulty: 'medium', description: 'Let a friend or partner choose a movie for you to watch without looking at the trailer.', points: 20 },
];

export const ALTERNATIVE_ACTIVITIES: any[] = [
  {
    id: 'mr1',
    type: 'Mind Reframe',
    title: 'Cognitive Shift',
    description: 'Transform a fear-based thought into a constructive action plan.',
    isPremium: false
  },
  {
    id: 'mc1',
    type: 'Micro-Challenges',
    title: '60-Second Courage',
    description: 'A rapid, low-stakes challenge to spike your resilience.',
    isPremium: false
  },
  {
    id: 'rf1',
    type: 'Reflection',
    title: 'Neural Journal',
    description: 'Deep dive into the root of a specific fear through guided writing.',
    isPremium: true
  }
];

export const MICRO_CHALLENGES = [
  "Hold eye contact with yourself in a mirror for 30 seconds without looking away.",
  "Take 5 deep, audible breaths in a quiet space, focusing only on the sound.",
  "Write down three specific things you're proud of today, no matter how small.",
  "Stand perfectly still for 60 seconds, observing every sensation in your body.",
  "Smile at yourself in the mirror for 30 seconds, even if it feels forced.",
  "Text someone you trust and tell them one thing you appreciate about them.",
  "Sit in total silence for 60 seconds without checking any devices.",
  "Identify 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
  "Say 'I am capable of handling this' out loud 5 times with conviction.",
  "Clench your fists as tight as you can for 10 seconds, then release and feel the tension leave."
];
