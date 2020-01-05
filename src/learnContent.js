const learnContent = [
  {
    title: 'Basics',
    subtitle: 'How to play',
    text: [
      'Playing Puyo Puyo is simple. All you have to do is connect four or more Puyo of the same color and they’ll pop! By clearing groups of Puyo, you can send Nuisance Puyo (a.k.a. "garbage") to your opponent.',
      'When the third column from the left is filled up, the player will lose. So the objective of the game is to make chains that will fill up your opponent\'s board with garbage.',
    ],
  },
  {
    title: 'Chaining',
    subtitle: 'Key mechanism',
    text: [
      'The question here is, how do you build a chain? There are many different ways which vary in degrees of efficiency, simplicity and versatility, however for the purposes of this article, we will only be looking at the easiest method and the one which most beginners find it simplest to conceptualise: sequential chaining. Since a chain is composed of a series of links which react directly with one another, sequential chaining aims to build the links in the order that they will pop.',
      'To start, you will create a group of three Puyo of one colour which are connected, then you will introduce a group of a second colour which will block the first group, either from above or to the side. You then place a Puyo of the first colour on top of the group of the second colour such that when you pop the second group, the single Puyo will complete the first group. Once you have become good at this, you can introduce a third group, a fourth group, a fifth group and so on. This by no means the best way to build a chain, but it works fine and lets you keep track of exactly where each group sits within your overall chain.',
      'With this method, you will essentially be building your chain backwards (ie. the first link you build will be the last link to pop).',
    ],
  },
  {
    title: 'GTR',
    subtitle: 'Chaining on the second level',
    text: [
      'GTR stands for Great Tanaka Rensa. It\'s an incredibly famous transition that you\'ll find 90% of players spamming. Typical transitions require you to make a really high tower to bring the chain up to the next floor, but GTR\'s structure circumvents that.',
      'GTR is useful because it\'s really flat, making the trigger (the greens) easily accessible. At that point, you can just do whatever you want on top of it to extend.',
      'GTR also makes building your first floor really easy. Common patterns to use with GTR are 2-2 Stairs and Sandwich.',
    ],
  },
  {
    title: 'Stairs',
    subtitle: 'First key form',
    text: [
      'Think of Stairs as cascading Puyo, if that makes any sense. The general idea behind Stairs is to place Puyo in such a way that the falling Puyo connect to each other on the side. Taking the above chains as an example, you can see that this is the case after the first chain pops.',
    ],
  },
  {
    title: 'Sandwich',
    subtitle: 'Second key form',
    text: [
      'Although Stairs can be an intuitive pattern to build, it can be slow and clunky in execution. Since there\'s really only 2 forms of Stairs that are reasonable to use, you\'ll sometimes find yourself running out of ways to place your pieces. That\'s why we\'re going to learn a different pattern called Sandwich. Sandwich is a bit more complicated to build than Stairs, but it can be a lot more efficient and versatile.',
      'These patterns are called Sandwiches because they all involve sandwiching one color in between a different one.',
    ],
  },
  {
    title: 'Harrassment',
    subtitle: 'Multiplayer strategies',
    text: [
      'To execute any of the above points, you need to be really good at observing your opponent. How should you do this, and what should you be looking for? Well, for starters, you should consider:',
      'The length of your opponent\'s chain. Your ability to size-up your opponent\'s chain is dependent on your own knowledge of chaining forms. I hope you\'ve been studying.',
      'Potential sources of harassment. If you feel some harassment coming, get ready to (1) counter-harass, (2) build upwards to absorb the impact, or (3) fire your main chain. (See: Garbage Management)',
      'Your opponent\'s NEXT pieces. Depending on what colors they\'re getting, you can determine whether you can get away with harassing or not. You can also use the NEXT pieces to predict your opponent\'s moves based on the current state of their field.',
    ],
  },
];

export default learnContent;
