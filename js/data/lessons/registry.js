/* ============================================================
   js/data/lessons/registry.js
   The lesson schema and the registry every content file writes into.

   Lesson content is DATA, never markup. No view file contains lesson text;
   views read from App.LESSONS and render whatever is there. That means you
   can add a whole topic by writing one object - see README section
   "How to add a lesson".

   ------------------------------------------------------------
   LESSON SCHEMA
   ------------------------------------------------------------
   {
     topicId:        'fundamentals:variables',   // must match a roadmap topic id
     title:          'Variables',
     phaseId:        'fundamentals',
     difficulty:     'Beginner' | 'Intermediate' | 'Advanced',
     estimatedMinutes: 45,
     prerequisites:  ['fundamentals:data-types'],
     objectives:     ['...', '...'],             // 3-5 "what you will learn"
     sections:       [ Section ],                // the concept, taught in pieces
     examples:       [ Example ],                // worked code with a walkthrough
     exercises:      [ Exercise ],               // levels 2-5
     knowledgeChecks:[ Question ],               // end-of-lesson retrieval test
     commonMistakes: [ { mistake, why, fix } ],
     realWorld:      ['where you actually meet this'],
     resources:      [ { label, note } ],
     mastery:        { knowledgeCheckPass: 70 }  // optional per-topic override
   }

   Section = {
     id, title,
     blocks: [
       { type: 'text',    text }
       { type: 'list',    items: [] }
       { type: 'code',    code, caption }
       { type: 'analogy', text }
       { type: 'warning', text }
       { type: 'note',    text }
       { type: 'table',   head: [], rows: [[]] }
       { type: 'whenNot', text }        // "when NOT to use this"
     ]
   }

   Example = { id, title, code, walkthrough: [{ line, note }], output, takeaway }

   ------------------------------------------------------------
   EXERCISE SCHEMA
   ------------------------------------------------------------
   {
     id, type, level, difficulty, prompt,
     starterCode, expectedConcepts: [], hints: [], solution, explanation,

     // type-specific:
     checks:  [ { kind:'contains'|'notContains'|'regex'|'output', value, message } ]
     run:     { expectedOutput }        // used when the local .NET runner is on
     options: [], answer: 0 | [0,2]     // mcq
     accept:  ['42', 'forty two']       // predict-output / fill-blank
     steps:   [ { id, question, type, ... } ]   // debug exercises
   }

   type   : 'coding' | 'mcq' | 'predict-output' | 'debug' | 'explain'
            | 'fill-blank' | 'refactor' | 'design'
   level  : 1 Understand · 2 Guided · 3 Independent · 4 Applied · 5 No-Help
   ============================================================ */
window.App = window.App || {};

/* topicId -> lesson */
App.LESSONS = {};

/* The five levels of the difficulty progression (core/mastery.js uses these). */
App.LEVELS = [
  { level: 1, id: 'understand', label: 'Understand',          blurb: 'Can explain the concept in your own words.' },
  { level: 2, id: 'guided',     label: 'Guided Practice',     blurb: 'Can solve it with hints available.' },
  { level: 3, id: 'independent',label: 'Independent Practice',blurb: 'Can solve it without hints.' },
  { level: 4, id: 'applied',    label: 'Applied Practice',    blurb: 'Uses it in a realistic situation.' },
  { level: 5, id: 'challenge',  label: 'No-Help Challenge',   blurb: 'No hints, no solution. Prove it.' }
];

App.EXERCISE_TYPES = {
  'coding':         { label: 'Coding',            icon: 'topics'     },
  'mcq':            { label: 'Multiple choice',   icon: 'check'      },
  'predict-output': { label: 'Predict the output',icon: 'play'       },
  'debug':          { label: 'Find the bug',      icon: 'alert'      },
  'explain':        { label: 'Explain',           icon: 'book'       },
  'fill-blank':     { label: 'Fill in the code',  icon: 'edit'       },
  'refactor':       { label: 'Refactor',          icon: 'refresh'    },
  'design':         { label: 'Design',            icon: 'roadmap'    }
};

/**
 * Content files call this. Normalising here means a lesson author can leave
 * out anything optional and the views still get a complete object.
 */
App.registerLessons = function (lessons) {
  lessons.forEach(function (raw) {
    var lesson = {
      topicId: raw.topicId,
      title: raw.title || '',
      phaseId: raw.phaseId || (raw.topicId || '').split(':')[0],
      difficulty: raw.difficulty || 'Beginner',
      estimatedMinutes: raw.estimatedMinutes || 30,
      prerequisites: raw.prerequisites || [],
      objectives: raw.objectives || [],
      sections: (raw.sections || []).map(function (sec, i) {
        return {
          id: sec.id || ('s' + (i + 1)),
          title: sec.title || ('Section ' + (i + 1)),
          blocks: sec.blocks || []
        };
      }),
      examples: (raw.examples || []).map(function (ex, i) {
        return {
          id: ex.id || ('ex' + (i + 1)),
          title: ex.title || ('Example ' + (i + 1)),
          code: ex.code || '',
          walkthrough: ex.walkthrough || [],
          output: ex.output || '',
          takeaway: ex.takeaway || ''
        };
      }),
      exercises: (raw.exercises || []).map(function (x, i) {
        return Object.assign({
          id: x.id || (raw.topicId + '#x' + (i + 1)),
          topicId: raw.topicId,
          type: x.type || 'coding',
          level: x.level || 2,
          difficulty: x.difficulty || 'Easy',
          prompt: '',
          starterCode: '',
          expectedConcepts: [],
          hints: [],
          solution: '',
          explanation: '',
          checks: []
        }, x);
      }),
      knowledgeChecks: (raw.knowledgeChecks || []).map(function (q, i) {
        return Object.assign({
          id: q.id || (raw.topicId + '#q' + (i + 1)),
          type: q.type || 'mcq',
          prompt: '',
          explanation: ''
        }, q);
      }),
      commonMistakes: raw.commonMistakes || [],
      realWorld: raw.realWorld || [],
      resources: raw.resources || [],
      mastery: Object.assign({ knowledgeCheckPass: 70 }, raw.mastery || {})
    };
    App.LESSONS[lesson.topicId] = lesson;
  });
};
