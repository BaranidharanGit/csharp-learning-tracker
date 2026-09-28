/* ============================================================
   js/data/demo.js
   Optional example data ("Load sample data" on the Settings page,
   or the choice offered on first run).

   Everything is generated RELATIVE TO TODAY so the charts, streak
   and review queue always look alive, whenever you load it.
   Nothing here runs automatically - it is a function the store calls.
   ============================================================ */
window.App = window.App || {};

App.buildDemoData = function () {
  'use strict';

  var U = App.utils;
  var today = U.today();

  /** Topic id helper: tid('fundamentals', 'Data Types') -> 'fundamentals:data-types' */
  function tid(phaseId, name) { return phaseId + ':' + U.slug(name); }

  /* ---------- 1. Topic progress ---------- */

  var topicPatches = [];

  function patch(phaseId, name, values) {
    topicPatches.push({ id: tid(phaseId, name), values: values });
  }

  /** Bulk helper: give a list of topics the same status / score profile. */
  function bulk(phaseId, names, base) {
    names.forEach(function (name, i) {
      var v = Object.assign({}, base);
      // Nudge the scores a little so the demo does not look copy-pasted.
      if (v.understanding !== undefined) v.understanding = U.clamp(v.understanding - (i % 2), 0, 5);
      if (v.coding !== undefined) v.coding = U.clamp(v.coding - ((i + 1) % 2), 0, 5);
      patch(phaseId, name, v);
    });
  }

  // C# Fundamentals - finished, being kept warm by reviews.
  bulk('fundamentals',
    ['Variables', 'Data Types', 'Type Conversion', 'Operators', 'Strings',
     'Conditions', 'Loops', 'Methods', 'Parameters', 'Return Values'],
    { status: 'mastered', understanding: 5, coding: 5, problemSolving: 4,
      lastReviewed: U.addDays(today, -12), nextReview: U.addDays(today, 18),
      reviewStep: 4, reviewCount: 3,
      evidence: 'Rebuilt the console app from scratch without notes.' });

  bulk('fundamentals', ['Arrays', 'Lists', 'Dictionaries', 'HashSet'],
    { status: 'comfortable', understanding: 4, coding: 4, problemSolving: 3,
      lastReviewed: U.addDays(today, -6), nextReview: U.addDays(today, 1),
      reviewStep: 2, reviewCount: 2,
      notes: 'Dictionary lookup is O(1) average; remember TryGetValue over ContainsKey + indexer.' });

  patch('fundamentals', 'Debugging', {
    status: 'comfortable', understanding: 4, coding: 4, problemSolving: 4,
    lastReviewed: U.addDays(today, -3), nextReview: U.addDays(today, 4),
    reviewStep: 2, reviewCount: 1,
    notes: 'Conditional breakpoints and the Watch window save a lot of time.'
  });

  // Core C# - mostly done, a few still being practised.
  bulk('core',
    ['Classes', 'Objects', 'Constructors', 'Properties', 'Fields', 'Access Modifiers', 'Encapsulation'],
    { status: 'mastered', understanding: 5, coding: 4, problemSolving: 4,
      lastReviewed: U.addDays(today, -9), nextReview: U.addDays(today, 21),
      reviewStep: 4, reviewCount: 2 });

  bulk('core', ['Inheritance', 'Polymorphism', 'Abstraction', 'Interfaces'],
    { status: 'comfortable', understanding: 4, coding: 4, problemSolving: 3,
      lastReviewed: U.addDays(today, -8), nextReview: U.addDays(today, -1),
      reviewStep: 2, reviewCount: 2,
      mistakes: 'Still reach for inheritance when composition is the better answer.' });

  bulk('core', ['Structs', 'Enums', 'Records'],
    { status: 'practicing', understanding: 3, coding: 3, problemSolving: 2,
      lastReviewed: U.addDays(today, -4), nextReview: today,
      reviewStep: 1, reviewCount: 1 });

  patch('core', 'Nullable Reference Types', {
    status: 'practicing', understanding: 3, coding: 2, problemSolving: 2,
    lastReviewed: U.addDays(today, -5), nextReview: U.addDays(today, -2),
    reviewStep: 1, reviewCount: 1,
    mistakes: 'Sprinkling ! to silence warnings instead of fixing the nullability.'
  });

  patch('core', 'Value Types vs Reference Types', {
    status: 'practicing', understanding: 3, coding: 2, problemSolving: 2,
    lastReviewed: U.addDays(today, -2), nextReview: today,
    reviewStep: 1, reviewCount: 2,
    notes: 'Struct copies on assignment; class copies the reference. Draw it out every time.'
  });

  // Professional C# - the phase currently in flight.
  bulk('professional', ['Generics', 'Collections'],
    { status: 'practicing', understanding: 3, coding: 3, problemSolving: 2,
      lastReviewed: U.addDays(today, -1), nextReview: U.addDays(today, 2),
      reviewStep: 1, reviewCount: 1 });

  patch('professional', 'Exceptions', {
    status: 'practicing', understanding: 4, coding: 3, problemSolving: 3,
    lastReviewed: U.addDays(today, -3), nextReview: U.addDays(today, 4),
    reviewStep: 2, reviewCount: 1,
    mistakes: 'Catching Exception at the wrong layer and swallowing the stack trace.'
  });

  patch('professional', 'LINQ', {
    status: 'learning', understanding: 2, coding: 1, problemSolving: 1,
    lastReviewed: today, nextReview: U.addDays(today, 1),
    reviewStep: 0, reviewCount: 1,
    notes: 'Deferred execution is the part that keeps catching me out.',
    mistakes: 'Enumerating the same IEnumerable twice and hitting the database twice.'
  });

  patch('professional', 'Lambda Expressions', {
    status: 'learning', understanding: 2, coding: 2, problemSolving: 1,
    nextReview: U.addDays(today, 1), reviewStep: 0, reviewCount: 0
  });

  patch('professional', 'Delegates', {
    status: 'learning', understanding: 2, coding: 1, problemSolving: 1,
    nextReview: today, reviewStep: 0, reviewCount: 0,
    mistakes: 'Cannot yet write a Func<T, TResult> signature from memory.'
  });

  // A taste of SQL alongside the C# work.
  bulk('sql', ['SELECT', 'WHERE', 'ORDER BY'],
    { status: 'comfortable', understanding: 4, coding: 4, problemSolving: 3,
      lastReviewed: U.addDays(today, -7), nextReview: U.addDays(today, 7),
      reviewStep: 2, reviewCount: 2 });

  bulk('sql', ['GROUP BY', 'HAVING', 'JOINs'],
    { status: 'learning', understanding: 2, coding: 2, problemSolving: 1,
      lastReviewed: U.addDays(today, -2), nextReview: U.addDays(today, 1),
      reviewStep: 0, reviewCount: 1,
      mistakes: 'Mixing up LEFT JOIN and INNER JOIN when rows go missing.' });

  /* ---------- 2. Learning sessions ---------- */

  // Days back from today that have a session. The first six are consecutive
  // so the demo always shows a live streak.
  var dayOffsets = [0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 16, 17,
                    19, 20, 21, 23, 24, 26, 27, 28, 30, 31, 33, 34];

  var durations = [60, 90, 45, 75, 120, 50, 95, 65, 110, 55, 80, 40];
  var startTimes = ['19:30', '20:00', '07:15', '18:45', '21:00', '09:30'];

  var sessionTopics = [
    tid('professional', 'LINQ'),
    tid('core', 'Records'),
    tid('professional', 'Generics'),
    tid('sql', 'JOINs'),
    tid('core', 'Interfaces'),
    tid('professional', 'Exceptions'),
    tid('core', 'Value Types vs Reference Types'),
    tid('sql', 'GROUP BY'),
    tid('fundamentals', 'Dictionaries'),
    tid('professional', 'Delegates')
  ];

  var learnedNotes = [
    'Worked through deferred execution in LINQ and proved it with a counter in a Where clause.',
    'Built a small record-based model and compared it to the class version - value equality is the whole point.',
    'Wrote a generic Repository<T> and finally understood constraints.',
    'Practised INNER vs LEFT JOIN on the sample database until the row counts stopped surprising me.',
    'Re-implemented IComparable and IEquatable on the Employee type.',
    'Added a custom exception type and a global handler instead of try/catch everywhere.',
    'Drew the stack/heap diagram for struct vs class assignment.',
    'GROUP BY with HAVING to find duplicate emails in the employees table.',
    'Rewrote a nested-loop lookup as a Dictionary - from O(n^2) to O(n).',
    'First pass at delegates: Action, Func and a hand-written delegate type.'
  ];

  var struggleNotes = [
    'Still cannot predict when a LINQ query actually executes.',
    'Positional records and with-expressions needed the docs.',
    'Generic constraints syntax did not stick first time.',
    'Kept losing rows because I reached for INNER JOIN.',
    'Interface default implementations confused me.',
    'Deciding which layer should catch what.',
    'Boxing - I know the word, not yet the cost.',
    'HAVING vs WHERE ordering.',
    'Nothing major, good session.',
    'Reading a Func<int, string> signature out loud.'
  ];

  var sessions = dayOffsets.map(function (offset, i) {
    var minutes = durations[i % durations.length];
    var start = startTimes[i % startTimes.length];
    var startMins = U.timeToMinutes(start);
    var endMins = (startMins + minutes) % (24 * 60);
    var end = String(Math.floor(endMins / 60)).padStart(2, '0') + ':' +
              String(endMins % 60).padStart(2, '0');

    return {
      id: U.uid('sess'),
      date: U.addDays(today, -offset),
      startTime: start,
      endTime: end,
      durationMinutes: minutes,
      topicId: sessionTopics[i % sessionTopics.length],
      learned: learnedNotes[i % learnedNotes.length],
      struggled: struggleNotes[i % struggleNotes.length],
      exercises: (i % 5) + 1,
      confidence: 2 + (i % 4),
      notes: i % 4 === 0 ? 'Pomodoro x3, no phone.' : '',
      createdAt: U.addDays(today, -offset)
    };
  });

  /* ---------- 3. No-help challenges ---------- */

  var challenges = [
    {
      name: 'Reverse a string without built-in Reverse()',
      date: U.addDays(today, -21), topicId: tid('fundamentals', 'Strings'),
      difficulty: 'Easy', outcome: 'completed', timeTakenMinutes: 12,
      notes: 'Two-pointer swap on a char array.', gotWrong: '', retryDate: ''
    },
    {
      name: 'Find the first non-repeating character',
      date: U.addDays(today, -18), topicId: tid('fundamentals', 'Dictionaries'),
      difficulty: 'Easy', outcome: 'completed', timeTakenMinutes: 18,
      notes: 'Dictionary<char,int> then a second pass.', gotWrong: 'Forgot ordering matters on the second pass.',
      retryDate: ''
    },
    {
      name: 'Group employees by department and sum salaries (LINQ only)',
      date: U.addDays(today, -12), topicId: tid('professional', 'LINQ'),
      difficulty: 'Medium', outcome: 'failed', timeTakenMinutes: 35,
      notes: 'Got the GroupBy but could not project the result cleanly.',
      gotWrong: 'Could not write the Select after GroupBy without looking it up.',
      retryDate: U.addDays(today, -1)
    },
    {
      name: 'Implement a generic Stack<T> from scratch',
      date: U.addDays(today, -8), topicId: tid('professional', 'Generics'),
      difficulty: 'Medium', outcome: 'completed', timeTakenMinutes: 42,
      notes: 'Array-backed with doubling growth.', gotWrong: 'Off-by-one on Pop the first time.',
      retryDate: ''
    },
    {
      name: 'Write the SQL for top 3 earners per department',
      date: U.addDays(today, -5), topicId: tid('sql', 'JOINs'),
      difficulty: 'Hard', outcome: 'failed', timeTakenMinutes: 40,
      notes: 'Needed a window function I have not covered yet.',
      gotWrong: 'No idea how to rank within a group.', retryDate: U.addDays(today, 2)
    },
    {
      name: 'Model an order system with interfaces, no inheritance',
      date: U.addDays(today, -2), topicId: tid('core', 'Interfaces'),
      difficulty: 'Medium', outcome: 'completed', timeTakenMinutes: 55,
      notes: 'Composition over inheritance actually clicked here.', gotWrong: '', retryDate: ''
    }
  ].map(function (c) {
    return Object.assign({ id: U.uid('chal'), createdAt: c.date }, c);
  });

  /* ---------- 4. Project progress ---------- */

  var projectPatches = [
    {
      name: 'C# Console Application',
      values: {
        status: 'Completed',
        startDate: U.addDays(today, -40),
        targetDate: U.addDays(today, -20),
        githubUrl: 'https://github.com/your-name/csharp-console-app',
        notes: 'Finished. Rebuilt it once from memory as a mastery check.'
      }
    },
    {
      name: 'C# Problem Solving Project',
      values: {
        status: 'In Progress',
        startDate: U.addDays(today, -21),
        targetDate: U.addDays(today, 14),
        notes: '31 of 50 problems solved. LINQ rewrites are the slow part.'
      }
    },
    {
      name: 'Employee Management API',
      values: {
        status: 'Planning',
        startDate: U.addDays(today, 7),
        targetDate: U.addDays(today, 45),
        notes: 'Starts once Professional C# is at 70%.'
      }
    }
  ];

  /* Mark features complete on the two started projects. */
  projectPatches[0].values.featuresDone = 'all';
  projectPatches[1].values.featuresDone = 4;

  return {
    topicPatches: topicPatches,
    sessions: sessions,
    challenges: challenges,
    projectPatches: projectPatches,
    dailyGoal: {
      date: today,
      text: 'Finish LINQ deferred execution + 5 GroupBy exercises with no AI help',
      done: false
    },
    focusTopicId: tid('professional', 'LINQ')
  };
};
