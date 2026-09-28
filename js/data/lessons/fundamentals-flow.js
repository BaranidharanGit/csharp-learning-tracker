/* ============================================================
   js/data/lessons/fundamentals-flow.js
   C# Fundamentals, part 2: Conditions, Loops, Methods,
   Parameters, Return Values.
   ============================================================ */
window.App = window.App || {};

App.registerLessons([

/* ============================================================
   6. CONDITIONS
   ============================================================ */
{
  topicId: 'fundamentals:conditions',
  title: 'Conditions',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 40,
  prerequisites: ['fundamentals:operators'],
  objectives: [
    'Write if / else if / else chains that read clearly and order correctly',
    'Choose between if-chains, switch statements and switch expressions',
    'Use guard clauses to keep the happy path flat and readable',
    'Explain why the order of conditions is a correctness concern',
    'Avoid the classic assignment-instead-of-comparison and dangling-else mistakes'
  ],
  sections: [
    {
      id: 'if',
      title: 'if, else if, else',
      blocks: [
        { type: 'code', code: `int score = 74;

if (score >= 90)
{
    Console.WriteLine("A");
}
else if (score >= 80)
{
    Console.WriteLine("B");
}
else if (score >= 70)
{
    Console.WriteLine("C");
}
else
{
    Console.WriteLine("Fail");
}` },
        { type: 'text', text: 'Conditions are tested top to bottom and **the first match wins** - the rest are skipped entirely. That is why this chain works with only a lower bound on each branch: by the time you reach `score >= 70`, you already know it is below 80.' },
        { type: 'warning', text: 'Reverse the order and it breaks silently. If `score >= 70` came first, a score of 95 would print "C". Ordering is logic, not layout.' },
        { type: 'text', text: 'Unlike C or JavaScript, the condition must be a `bool`. `if (count)` does not compile - you have to say `if (count != 0)`. That removes a whole family of bugs.' }
      ]
    },
    {
      id: 'braces',
      title: 'Always use braces',
      blocks: [
        { type: 'code', code: `// Legal, and a trap:
if (isAdmin)
    GrantAccess();
    LogAccess();      // NOT part of the if - always runs

// Do this instead:
if (isAdmin)
{
    GrantAccess();
    LogAccess();
}` },
        { type: 'text', text: 'C# lets you omit braces for a single statement. The indentation then lies about what the code does, and the next person to add a line introduces a bug without touching the condition.' },
        { type: 'note', text: 'This exact pattern caused the "goto fail" TLS vulnerability in Apple products in 2014. Braces are cheap.' }
      ]
    },
    {
      id: 'guards',
      title: 'Guard clauses: keeping the happy path flat',
      blocks: [
        { type: 'text', text: 'Deeply nested conditions are hard to read because you have to hold every open branch in your head. Guard clauses invert the problem: deal with the failures first and return early.' },
        { type: 'code', caption: 'Nested - hard to follow', code: `if (order != null)
{
    if (order.Items.Count > 0)
    {
        if (order.IsPaid)
        {
            Ship(order);
        }
    }
}` },
        { type: 'code', caption: 'Guarded - the happy path is at the bottom, unindented', code: `if (order == null) return;
if (order.Items.Count == 0) return;
if (!order.IsPaid) return;

Ship(order);` },
        { type: 'text', text: 'The second version reads as a list of preconditions followed by the actual work. It is also easier to add a fourth rule to.' }
      ]
    },
    {
      id: 'switch',
      title: 'switch statements and switch expressions',
      blocks: [
        { type: 'text', text: 'When you are comparing **one value** against many constants, `switch` states that intent better than an if-chain.' },
        { type: 'code', caption: 'Classic switch statement', code: `switch (dayNumber)
{
    case 1:
        Console.WriteLine("Monday");
        break;
    case 6:
    case 7:
        Console.WriteLine("Weekend");
        break;
    default:
        Console.WriteLine("Midweek");
        break;
}` },
        { type: 'code', caption: 'Modern switch expression - usually what you want', code: `string name = dayNumber switch
{
    1 => "Monday",
    6 or 7 => "Weekend",
    _ => "Midweek"
};` },
        { type: 'text', text: 'The expression form returns a value, needs no `break`, and the compiler warns you if you have not covered every case. Prefer it whenever you are producing a value rather than performing actions.' },
        { type: 'whenNot', text: 'Do not force a switch when your conditions are ranges or involve several variables. `score >= 90` is not a constant comparison, so an if-chain is the honest tool.' }
      ]
    },
    {
      id: 'ternary',
      title: 'The conditional operator',
      blocks: [
        { type: 'code', code: `string label = count == 1 ? "item" : "items";
decimal fee = isMember ? 0m : 4.99m;` },
        { type: 'text', text: 'Ideal for picking between two values. It is an **expression**, so it can be used inline - including inside string interpolation, where it needs brackets: `$"{count} {(count == 1 ? "item" : "items")}"`.' },
        { type: 'whenNot', text: 'Do not use it for side effects, and do not nest it. If either branch does work rather than producing a value, use `if`.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Grading, with the ordering that makes it work',
      code: `int[] scores = { 95, 83, 71, 64 };

foreach (int score in scores)
{
    string grade;

    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else grade = "Fail";

    Console.WriteLine($"{score}: {grade}");
}`,
      walkthrough: [
        { line: 'if (score >= 90) grade = "A";', note: 'Highest boundary first. Each later branch only has to state its own lower bound because the higher ones already failed.' },
        { line: 'string grade;', note: 'Declared without a value. This compiles because every path through the if-chain assigns it - the `else` is what guarantees that.' }
      ],
      output: '95: A\n83: B\n71: C\n64: Fail',
      takeaway: 'Remove the final `else` and this stops compiling: the compiler can no longer prove `grade` is always assigned. Definite assignment working for you.'
    },
    {
      id: 'ex2',
      title: 'Guard clauses in practice',
      code: `string[] inputs = { "barani@test.com", "", "not-an-email" };

foreach (string email in inputs)
{
    Console.WriteLine(Validate(email));
}

static string Validate(string email)
{
    if (string.IsNullOrWhiteSpace(email)) return "empty";
    if (!email.Contains('@')) return "missing @";
    if (email.Length < 5) return "too short";

    return "valid";
}`,
      walkthrough: [
        { line: 'if (string.IsNullOrWhiteSpace(email)) return "empty";', note: 'Each guard handles one failure and leaves immediately. Nothing below it needs to worry about that case again.' },
        { line: 'return "valid";', note: 'The happy path sits at the end, at zero indentation. Reading the method top to bottom gives you the rules in order.' }
      ],
      output: 'valid\nempty\nmissing @',
      takeaway: 'Guard clauses turn nesting into a checklist. This shape appears in nearly every method you will write in ASP.NET Core.'
    },
    {
      id: 'ex3',
      title: 'switch expression',
      code: `int[] days = { 1, 6, 3, 7 };

foreach (int day in days)
{
    string kind = day switch
    {
        1 => "Start of week",
        6 or 7 => "Weekend",
        >= 2 and <= 5 => "Midweek",
        _ => "Invalid"
    };

    Console.WriteLine($"{day}: {kind}");
}`,
      walkthrough: [
        { line: '6 or 7 => "Weekend",', note: 'Pattern combinators. Far clearer than two fall-through `case` labels.' },
        { line: '>= 2 and <= 5 => "Midweek",', note: 'Relational patterns let a switch expression handle ranges, which the old switch statement could not.' },
        { line: '_ => "Invalid"', note: 'The discard pattern is the default case. Without it the compiler warns that the switch may not handle every input.' }
      ],
      output: '1: Start of week\n6: Weekend\n3: Midweek\n7: Weekend',
      takeaway: 'Modern switch expressions cover most of what if-chains used to do, with the compiler checking your coverage.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:conditions#g1',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print when `score` is 95?',
      code: `int score = 95;

if (score >= 70) Console.WriteLine("C");
else if (score >= 80) Console.WriteLine("B");
else if (score >= 90) Console.WriteLine("A");`,
      accept: ['c'],
      hints: [
        'Conditions are tested from the top, and the first true one wins.',
        'Is 95 >= 70? What happens to the remaining branches once a match is found?'
      ],
      explanation: 'It prints `C`. The first condition matches, so the more specific ones below it never run. This is why ordering is a correctness issue.',
      solution: 'C'
    },
    {
      id: 'fundamentals:conditions#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'Which is the clearest way to write "if the user is null, stop"?',
      options: [
        '`if (user != null) { /* 40 lines of work */ }`',
        '`if (user == null) return;` followed by the work',
        '`if (user == null) { } else { /* work */ }`',
        '`while (user == null) return;`'
      ],
      answer: 1,
      hints: [
        'Think about where the main work ends up in each version.',
        'Which one keeps the important code at the left margin?'
      ],
      explanation: 'A guard clause handles the failure and leaves. The real work then sits unindented, and the reader knows every precondition has already passed.',
      solution: '`if (user == null) return;`'
    },
    {
      id: 'fundamentals:conditions#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Classify four temperatures. Below 0 is `freezing`, 0 to 14 is `cold`, 15 to 24 is `mild`, 25 and above is `hot`.\n\nFor the values -5, 8, 20 and 31 print exactly:\n\n```\n-5: freezing\n8: cold\n20: mild\n31: hot\n```',
      starterCode: `int[] temps = { -5, 8, 20, 31 };

`,
      expectedConcepts: ['if', 'else'],
      checks: [
        { kind: 'regex', value: 'if\\s*\\(', message: 'Uses an if-chain or switch' },
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Loops over the values' }
      ],
      run: { expectedOutput: '-5: freezing\n8: cold\n20: mild\n31: hot' },
      hints: [
        'Order matters. Decide whether you are going from coldest to hottest or the other way, and stay consistent.',
        'If you start with `< 0`, each later branch only needs its own upper bound.',
        'Finish with a plain `else` so every value is covered.'
      ],
      solution: `int[] temps = { -5, 8, 20, 31 };

foreach (int t in temps)
{
    string label;

    if (t < 0) label = "freezing";
    else if (t < 15) label = "cold";
    else if (t < 25) label = "mild";
    else label = "hot";

    Console.WriteLine($"{t}: {label}");
}`,
      explanation: 'Working upward means each branch needs only an upper bound, because the lower ones have already been ruled out.'
    },
    {
      id: 'fundamentals:conditions#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Rewrite a grading routine as a **switch expression** rather than an if-chain.\n\nFor the scores 95, 83, 71 and 64 print exactly:\n\n```\n95: A\n83: B\n71: C\n64: Fail\n```\n\nYou must use a `switch` expression with relational patterns, not `if`.',
      starterCode: `int[] scores = { 95, 83, 71, 64 };

`,
      expectedConcepts: ['switch'],
      checks: [
        { kind: 'regex', value: 'switch', message: 'Uses a switch expression' },
        { kind: 'regex', value: '=>', message: 'Uses expression arms' },
        { kind: 'notContains', value: 'else if', message: 'Does not fall back to an if-chain' }
      ],
      run: { expectedOutput: '95: A\n83: B\n71: C\n64: Fail' },
      hints: [
        'A switch expression looks like `string grade = score switch { ... };`',
        'Relational patterns let you write `>= 90 => "A",`.',
        'End with `_ => "Fail"` to cover everything else.'
      ],
      solution: `int[] scores = { 95, 83, 71, 64 };

foreach (int score in scores)
{
    string grade = score switch
    {
        >= 90 => "A",
        >= 80 => "B",
        >= 70 => "C",
        _ => "Fail"
    };

    Console.WriteLine($"{score}: {grade}");
}`,
      explanation: 'Arms are tested in order exactly like an if-chain, but the compiler now checks that every input is covered and the whole thing is an expression producing a value.'
    },
    {
      id: 'fundamentals:conditions#i2',
      type: 'refactor', level: 3, difficulty: 'Medium',
      prompt: 'Refactor this deeply nested method into guard clauses. The behaviour must stay identical.\n\n```\nstatic string Check(string? name, int age)\n{\n    if (name != null)\n    {\n        if (name.Length > 0)\n        {\n            if (age >= 18)\n            {\n                return "ok";\n            }\n            else { return "too young"; }\n        }\n        else { return "empty name"; }\n    }\n    else { return "no name"; }\n}\n```\n\nCall it with `(null, 30)`, `("", 30)`, `("Sam", 15)` and `("Sam", 30)` and print each result on its own line.',
      starterCode: `Console.WriteLine(Check(null, 30));
Console.WriteLine(Check("", 30));
Console.WriteLine(Check("Sam", 15));
Console.WriteLine(Check("Sam", 30));

static string Check(string? name, int age)
{
    // Rewrite with guard clauses
    return "";
}`,
      expectedConcepts: ['guard', 'return'],
      checks: [
        { kind: 'regex', value: 'return', message: 'Returns early from the guards' },
        { kind: 'notContains', value: 'else { return', message: 'No longer uses nested else blocks' }
      ],
      run: { expectedOutput: 'no name\nempty name\ntoo young\nok' },
      hints: [
        'Invert each condition: `if (name != null)` becomes `if (name == null) return "no name";`',
        'Work outside-in: the outermost check becomes the first guard.',
        'The "ok" case ends up as the last line, with no indentation.'
      ],
      solution: `Console.WriteLine(Check(null, 30));
Console.WriteLine(Check("", 30));
Console.WriteLine(Check("Sam", 15));
Console.WriteLine(Check("Sam", 30));

static string Check(string? name, int age)
{
    if (name == null) return "no name";
    if (name.Length == 0) return "empty name";
    if (age < 18) return "too young";

    return "ok";
}`,
      explanation: 'Four lines instead of fourteen, with the rules readable as a list. Notice that each guard also makes the lines below it safe - after the first one, `name` cannot be null.'
    },
    {
      id: 'fundamentals:conditions#i3',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write a leap year checker for the years 1900, 2000, 2023 and 2024.\n\nA year is a leap year if it is divisible by 4, **except** century years, which must also be divisible by 400.\n\nPrint exactly:\n\n```\n1900: False\n2000: True\n2023: False\n2024: True\n```',
      starterCode: `int[] years = { 1900, 2000, 2023, 2024 };

`,
      expectedConcepts: ['%', '&&', '||'],
      checks: [
        { kind: 'regex', value: '%\\s*4', message: 'Checks divisibility by 4' },
        { kind: 'regex', value: '%\\s*100', message: 'Handles the century rule' },
        { kind: 'regex', value: '%\\s*400', message: 'Handles the 400-year exception' },
        { kind: 'notContains', value: 'DateTime.IsLeapYear', message: 'Works out the rule rather than calling the built-in' }
      ],
      run: { expectedOutput: '1900: False\n2000: True\n2023: False\n2024: True' },
      hints: [
        'Three rules: divisible by 4, not divisible by 100, unless also divisible by 400.',
        'One way: `(year % 4 == 0 && year % 100 != 0) || year % 400 == 0`.',
        'Test 1900 by hand before running it - that is the case most people get wrong.'
      ],
      solution: `int[] years = { 1900, 2000, 2023, 2024 };

foreach (int year in years)
{
    bool isLeap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    Console.WriteLine($"{year}: {isLeap}");
}`,
      explanation: '1900 is divisible by 4 and by 100 but not by 400, so it is not a leap year - the case that catches naive implementations. Brackets make the precedence explicit here even though `&&` would bind first anyway.'
    },
    {
      id: 'fundamentals:conditions#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'Every score prints the same grade. Find out why.',
      brokenCode: `int[] scores = { 95, 83, 71 };

foreach (int score in scores)
{
    if (score > 0) Console.WriteLine("A");
    else if (score >= 80) Console.WriteLine("B");
    else if (score >= 70) Console.WriteLine("C");
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The first condition is too broad, so it matches everything',
            'The loop variable should be declared outside the loop',
            '`else if` is not valid C#',
            'The scores array is the wrong type'
          ],
          answer: 0,
          label: 'Spotted the over-broad first condition'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why do the later branches never run?',
          accept: ['the first match wins'],
          acceptContains: ['first'],
          label: 'Explained first-match-wins'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the grades are A, B and C.',
          starterCode: `int[] scores = { 95, 83, 71 };

foreach (int score in scores)
{
    if (score > 0) Console.WriteLine("A");
    else if (score >= 80) Console.WriteLine("B");
    else if (score >= 70) Console.WriteLine("C");
}`,
          checks: [
            { kind: 'regex', value: '>=\\s*90', message: 'Uses the correct threshold for A' }
          ],
          run: { expectedOutput: 'A\nB\nC' },
          label: 'Fixed the threshold'
        }
      ],
      hints: [],
      solution: `int[] scores = { 95, 83, 71 };

foreach (int score in scores)
{
    if (score >= 90) Console.WriteLine("A");
    else if (score >= 80) Console.WriteLine("B");
    else if (score >= 70) Console.WriteLine("C");
}`,
      explanation: 'In an if-chain the first true branch wins and the rest are skipped. A condition that is too broad at the top makes everything below it dead code - and the compiler cannot warn you, because it is perfectly valid.'
    },
    {
      id: 'fundamentals:conditions#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'The logging line runs even when the user is not an admin.',
      brokenCode: `bool isAdmin = false;

if (isAdmin)
    Console.WriteLine("Access granted");
    Console.WriteLine("Access logged");

Console.WriteLine("Done");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The `if` has no braces, so only the first line is conditional',
            '`isAdmin` should be a string',
            'The `if` needs an `else`',
            'Console.WriteLine cannot be called twice in a row'
          ],
          answer: 0,
          label: 'Identified the missing braces'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does the indentation not affect what the code does?',
          accept: ['whitespace is not significant in c#'],
          acceptContains: ['indent'],
          label: 'Explained that indentation is cosmetic'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so that when `isAdmin` is false, only `Done` is printed.',
          starterCode: `bool isAdmin = false;

if (isAdmin)
    Console.WriteLine("Access granted");
    Console.WriteLine("Access logged");

Console.WriteLine("Done");`,
          checks: [
            { kind: 'regex', value: 'if\\s*\\([^)]*\\)\\s*\\{', message: 'Uses braces around the if body' }
          ],
          run: { expectedOutput: 'Done' },
          label: 'Added braces'
        }
      ],
      hints: [],
      solution: `bool isAdmin = false;

if (isAdmin)
{
    Console.WriteLine("Access granted");
    Console.WriteLine("Access logged");
}

Console.WriteLine("Done");`,
      explanation: 'Without braces an `if` controls exactly one statement. The indentation suggests otherwise, which is what makes this so easy to miss in review. This is the shape of the 2014 "goto fail" TLS vulnerability.'
    },
    {
      id: 'fundamentals:conditions#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: decide a shipping cost.\n\nRules, in priority order:\n1. Restricted region: `unavailable`\n2. Order 75 or more: `free`\n3. Member: `2.99`\n4. Otherwise: `5.99`\n\nEvaluate these four orders and print the cost for each:\n- 100, member, restricted\n- 80, not a member, not restricted\n- 30, member, not restricted\n- 30, not a member, not restricted\n\nPrint exactly:\n\n```\nunavailable\nfree\n2.99\n5.99\n```',
      starterCode: `decimal[] totals = { 100m, 80m, 30m, 30m };
bool[] members = { true, false, true, false };
bool[] restricted = { true, false, false, false };

`,
      expectedConcepts: ['if', 'else if'],
      checks: [
        { kind: 'regex', value: 'if\\s*\\(', message: 'Uses conditions' },
        { kind: 'regex', value: 'restricted', message: 'Checks the restriction first' },
        { kind: 'regex', value: '75', message: 'Applies the free-shipping threshold' }
      ],
      run: { expectedOutput: 'unavailable\nfree\n2.99\n5.99' },
      hints: [
        'The rules are already in priority order - write them in that order and the first-match-wins behaviour does the rest.',
        'Start with `if (restricted[i])`, because it overrides everything.',
        'Store the result as a string so all four outcomes can be printed the same way.'
      ],
      solution: `decimal[] totals = { 100m, 80m, 30m, 30m };
bool[] members = { true, false, true, false };
bool[] restricted = { true, false, false, false };

for (int i = 0; i < totals.Length; i++)
{
    string cost;

    if (restricted[i]) cost = "unavailable";
    else if (totals[i] >= 75m) cost = "free";
    else if (members[i]) cost = "2.99";
    else cost = "5.99";

    Console.WriteLine(cost);
}`,
      explanation: 'When business rules arrive with a stated priority, writing them in that order means the if-chain structure carries the priority for you. Reordering the code would change the policy - which is exactly why it should mirror the spec.'
    },
    {
      id: 'fundamentals:conditions#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Triangle classifier',
      prompt: 'No hints.\n\nFor the side lengths (3,4,5), (5,5,5), (5,5,8), (1,2,9) and (0,4,5), classify each triangle.\n\nRules: sides must all be positive and any two sides must sum to more than the third, otherwise `invalid`. Then: all three equal is `equilateral`, exactly two equal is `isosceles`, otherwise `scalene`.\n\nPrint exactly:\n\n```\nscalene\nequilateral\nisosceles\ninvalid\ninvalid\n```',
      starterCode: ``,
      expectedConcepts: ['if', '&&', '||'],
      checks: [
        { kind: 'regex', value: 'if\\s*\\(', message: 'Uses conditions' },
        { kind: 'regex', value: '\\+', message: 'Applies the triangle inequality' },
        { kind: 'regex', value: '==', message: 'Compares side lengths' }
      ],
      run: { expectedOutput: 'scalene\nequilateral\nisosceles\ninvalid\ninvalid' },
      hints: [],
      solution: `int[][] triangles =
{
    new[] { 3, 4, 5 },
    new[] { 5, 5, 5 },
    new[] { 5, 5, 8 },
    new[] { 1, 2, 9 },
    new[] { 0, 4, 5 }
};

foreach (int[] t in triangles)
{
    int a = t[0], b = t[1], c = t[2];
    string kind;

    if (a <= 0 || b <= 0 || c <= 0) kind = "invalid";
    else if (a + b <= c || a + c <= b || b + c <= a) kind = "invalid";
    else if (a == b && b == c) kind = "equilateral";
    else if (a == b || b == c || a == c) kind = "isosceles";
    else kind = "scalene";

    Console.WriteLine(kind);
}`,
      explanation: 'Validity has to be settled before classification - you cannot meaningfully call (1,2,9) isosceles. That ordering, validate then classify, is the same shape as parse-then-range-check from Type Conversion.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:conditions#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int x = 5;
if (x > 0) Console.WriteLine("positive");
else if (x > 3) Console.WriteLine("big");
else Console.WriteLine("other");`,
      accept: ['positive'],
      explanation: 'The first true branch wins; the second condition is never evaluated even though it is also true.'
    },
    {
      id: 'fundamentals:conditions#q2', type: 'mcq',
      prompt: 'Why does `if (count)` not compile in C# when `count` is an `int`?',
      options: [
        'C# requires the condition to be a `bool`',
        '`count` must be declared `const`',
        'Conditions must be wrapped in double brackets',
        'It does compile'
      ],
      answer: 0,
      explanation: 'C# will not implicitly treat a number as truthy. Write `if (count != 0)`. This removes a whole class of C and JavaScript bugs.'
    },
    {
      id: 'fundamentals:conditions#q3', type: 'explain',
      prompt: 'Explain what a guard clause is and one concrete benefit over nested if statements.',
      expectedConcepts: ['early|return|exit', 'nest|indent|flat', 'precondition|invalid|failure'],
      minLength: 80,
      explanation: 'A guard clause handles an invalid case at the top of a method and returns immediately, so the remaining code can assume every precondition holds and stays at a single level of indentation.'
    },
    {
      id: 'fundamentals:conditions#q4', type: 'mcq',
      prompt: 'When is a `switch` expression a better choice than an if-chain?',
      options: [
        'Always - if-chains are obsolete',
        'When comparing one value against several patterns and producing a result',
        'When you need to perform side effects in each branch',
        'Only when there are exactly two cases'
      ],
      answer: 1,
      explanation: 'Switch expressions shine when one input maps to one output. When branches perform actions rather than yield a value, `if` or a switch statement is clearer.'
    },
    {
      id: 'fundamentals:conditions#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `bool flag = false;
if (flag)
    Console.WriteLine("A");
    Console.WriteLine("B");`,
      accept: ['b'],
      explanation: 'Without braces only the first statement belongs to the `if`. `B` always prints - the indentation is misleading.'
    }
  ],
  commonMistakes: [
    { mistake: 'Ordering conditions from least specific to most', why: 'They are written in the order they occur to you.', fix: 'Most specific first. In an if-chain the first match wins and everything below it becomes unreachable.' },
    { mistake: 'Omitting braces for a single statement', why: 'It is legal and looks tidy.', fix: 'Always use braces. The next line someone adds will otherwise silently escape the condition.' },
    { mistake: 'Deep nesting instead of guard clauses', why: 'It mirrors how the requirements were described.', fix: 'Invert the checks and return early. The happy path belongs at the left margin.' },
    { mistake: 'Forgetting `break` in a switch statement', why: 'Other languages fall through by design.', fix: 'C# will not compile a non-empty case without `break` or `return` - and a switch **expression** removes the question entirely.' },
    { mistake: 'Nesting ternary operators', why: 'It is compact.', fix: 'One level is fine, two is pushing it, three is unreadable. Use a switch expression instead.' }
  ],
  realWorld: [
    'Authorisation logic in ASP.NET Core is a conditional chain, and the ordering of the checks is a security property.',
    'Guard clauses are the standard opening of almost every controller action and service method in production .NET code.',
    'Switch expressions map neatly onto enum-driven state machines, which you will meet in the Core C# phase.',
    'Pricing, discount and shipping rules are conditional chains whose order encodes business priority.'
  ],
  resources: [
    { label: 'Refactor an if-chain', note: 'Find any nested if in code you have written and convert it to guard clauses. The diff is usually striking.' }
  ]
}
,
/* ============================================================
   7. LOOPS
   ============================================================ */
{
  topicId: 'fundamentals:loops',
  title: 'Loops',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: ['fundamentals:conditions'],
  objectives: [
    'Choose correctly between for, foreach, while and do-while',
    'Avoid off-by-one errors by reasoning about the loop bounds',
    'Use break and continue without making the loop hard to follow',
    'Explain why you must not modify a collection while iterating it',
    'Recognise and avoid accidental infinite loops'
  ],
  sections: [
    {
      id: 'kinds',
      title: 'The four loops, and when each is right',
      blocks: [
        { type: 'table', head: ['Loop', 'Use when', 'Runs at least once?'], rows: [
          ['`for`', 'You need the index, or a known count', 'No'],
          ['`foreach`', 'You just need each item', 'No'],
          ['`while`', 'You repeat until a condition changes', 'No'],
          ['`do-while`', 'The body must run before the first test', 'Yes']
        ] },
        { type: 'code', code: `// for - you need the index
for (int i = 0; i < names.Length; i++)
{
    Console.WriteLine($"{i}: {names[i]}");
}

// foreach - you only need the item (prefer this when you can)
foreach (string name in names)
{
    Console.WriteLine(name);
}

// while - repeat until something changes
while (!done)
{
    done = ProcessNextBatch();
}

// do-while - always runs at least once
do
{
    input = Console.ReadLine();
} while (string.IsNullOrEmpty(input));` },
        { type: 'text', text: 'Default to `foreach`. It cannot go out of range, it cannot have an off-by-one, and it states that you are visiting every item. Reach for `for` only when you genuinely need the index or are walking backwards.' }
      ]
    },
    {
      id: 'bounds',
      title: 'The off-by-one, and how to stop making it',
      blocks: [
        { type: 'code', code: `string[] items = { "a", "b", "c" };   // valid indexes: 0, 1, 2

for (int i = 0; i < items.Length; i++)   // correct: < Length
for (int i = 0; i <= items.Length; i++)  // WRONG: touches index 3` },
        { type: 'text', text: 'The rule never changes: a collection of length N has indexes `0` to `N - 1`. So the loop condition is `i < Length`, and the last index is `Length - 1`.' },
        { type: 'note', text: 'Walking backwards is the mirror image: `for (int i = items.Length - 1; i >= 0; i--)`. Start one below the length, stop at zero inclusive.' }
      ]
    },
    {
      id: 'control',
      title: 'break and continue',
      blocks: [
        { type: 'code', code: `foreach (int n in numbers)
{
    if (n < 0) continue;    // skip this one, carry on
    if (n > 100) break;     // stop the loop entirely

    Console.WriteLine(n);
}` },
        { type: 'text', text: '`continue` skips to the next iteration; `break` leaves the loop. Used at the top of a body as guards they make loops clearer. Used in the middle of a long body they make loops very hard to follow.' },
        { type: 'warning', text: '`break` inside nested loops only exits the **inner** one. If you need to leave both, extract the loops into a method and `return`, or use a flag.' }
      ]
    },
    {
      id: 'mutation',
      title: 'Do not change a collection while you are iterating it',
      blocks: [
        { type: 'code', code: `var list = new List<int> { 1, 2, 3, 4 };

foreach (int n in list)
{
    if (n % 2 == 0) list.Remove(n);   // InvalidOperationException
}` },
        { type: 'text', text: 'A `foreach` holds an enumerator over the collection. Changing the collection invalidates it, and .NET throws rather than giving you undefined behaviour.' },
        { type: 'code', caption: 'Three safe alternatives', code: `// 1. Loop backwards with a for loop
for (int i = list.Count - 1; i >= 0; i--)
    if (list[i] % 2 == 0) list.RemoveAt(i);

// 2. Build a new collection
var odds = list.Where(n => n % 2 != 0).ToList();

// 3. Use RemoveAll
list.RemoveAll(n => n % 2 == 0);` },
        { type: 'text', text: 'Going backwards works because removing index `i` only shifts the items after it - which you have already visited.' }
      ]
    },
    {
      id: 'infinite',
      title: 'Infinite loops',
      blocks: [
        { type: 'code', code: `int i = 0;
while (i < 10)
{
    Console.WriteLine(i);
    // forgot i++ - this never ends
}` },
        { type: 'text', text: 'Every `while` loop needs something in the body that can eventually make the condition false. When you write one, find that line before you run it.' },
        { type: 'note', text: 'A deliberate `while (true)` with a `break` inside is fine and common - the point is that the exit must exist and be reachable.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'The same job, four ways',
      code: `int[] numbers = { 10, 20, 30 };

for (int i = 0; i < numbers.Length; i++)
    Console.Write(numbers[i] + " ");
Console.WriteLine();

foreach (int n in numbers)
    Console.Write(n + " ");
Console.WriteLine();

int index = 0;
while (index < numbers.Length)
{
    Console.Write(numbers[index] + " ");
    index++;
}
Console.WriteLine();

index = 0;
do
{
    Console.Write(numbers[index] + " ");
    index++;
} while (index < numbers.Length);
Console.WriteLine();`,
      walkthrough: [
        { line: 'for (int i = 0; i < numbers.Length; i++)', note: 'Three parts: initialise, test, step. The test happens **before** each iteration.' },
        { line: 'foreach (int n in numbers)', note: 'No index, no bounds, no chance of an off-by-one. This is why it is the default choice.' },
        { line: 'index++;', note: 'In the while version, forgetting this line is the classic infinite loop. The `for` loop keeps the step next to the test, which is harder to forget.' }
      ],
      output: '10 20 30 \n10 20 30 \n10 20 30 \n10 20 30 ',
      takeaway: 'Same output, four shapes. Pick the one that says most clearly what you mean.'
    },
    {
      id: 'ex2',
      title: 'break and continue as guards',
      code: `int[] readings = { 12, -4, 38, 7, 250, 19 };
int total = 0;

foreach (int reading in readings)
{
    if (reading < 0)
    {
        Console.WriteLine($"skipping invalid {reading}");
        continue;
    }

    if (reading > 100)
    {
        Console.WriteLine($"sensor fault at {reading}, stopping");
        break;
    }

    total += reading;
}

Console.WriteLine($"Total: {total}");`,
      walkthrough: [
        { line: 'continue;', note: 'Skips the rest of this iteration and moves to the next reading. The invalid value never reaches the accumulation.' },
        { line: 'break;', note: 'Abandons the loop completely - the 19 after 250 is never seen.' }
      ],
      output: 'skipping invalid -4\nsensor fault at 250, stopping\nTotal: 57',
      takeaway: 'Both used at the top of the body, as guards. That keeps the real work at the bottom and unindented - the same idea as guard clauses in a method.'
    },
    {
      id: 'ex3',
      title: 'Nested loops and a times table',
      code: `for (int row = 1; row <= 3; row++)
{
    for (int col = 1; col <= 3; col++)
    {
        Console.Write($"{row * col,3}");
    }
    Console.WriteLine();
}`,
      walkthrough: [
        { line: 'for (int row = 1; ...)', note: 'The outer loop runs 3 times; the inner loop runs 3 times for **each** of those, so the body executes 9 times.' },
        { line: '$"{row * col,3}"', note: 'The `,3` is an alignment specifier - it pads the value to a width of 3, which is how the columns line up.' }
      ],
      output: '  1  2  3\n  2  4  6\n  3  6  9',
      takeaway: 'Nested loops multiply. Two nested loops over 1000 items each is a million iterations - worth noticing before you write it.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:loops#g1',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'How many lines does this print?',
      code: `for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);
}`,
      accept: ['5'],
      hints: [
        'The loop starts at 0 and stops when the condition becomes false.',
        'Write out the values of `i` that pass the test: 0, 1, 2, 3, 4 - and then 5 fails.'
      ],
      explanation: 'Five iterations, printing 0 through 4. Starting at 0 with `< 5` is the standard shape and gives exactly 5 iterations.',
      solution: '5'
    },
    {
      id: 'fundamentals:loops#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'You want to print every name in a `string[]`. You do not need the position. Which loop?',
      options: ['`for`', '`foreach`', '`while`', '`do-while`'],
      answer: 1,
      hints: [
        'Which one removes the possibility of an index error entirely?',
        'If you never mention an index, you can never get it wrong.'
      ],
      explanation: '`foreach` states exactly what you mean - visit every item - and cannot go out of range.',
      solution: '`foreach`'
    },
    {
      id: 'fundamentals:loops#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Print the numbers 1 to 10 and then their total.\n\nPrint exactly:\n\n```\n1 2 3 4 5 6 7 8 9 10\nTotal: 55\n```\n\n(The numbers are on one line, separated by single spaces, with no trailing space.)',
      starterCode: ``,
      expectedConcepts: ['for', 'accumulator'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses a loop' },
        { kind: 'regex', value: '\\+=|\\+\\s*=', message: 'Accumulates a total' },
        { kind: 'notContains', value: '55;', message: 'Calculates the total rather than hard-coding it' }
      ],
      run: { expectedOutput: '1 2 3 4 5 6 7 8 9 10\nTotal: 55' },
      hints: [
        'Loop from 1 to 10 inclusive, so the condition is `i <= 10`.',
        'Keep a running `total` declared before the loop and add to it inside.',
        'To avoid a trailing space, build the line with `string.Join(" ", ...)` or print a space before every number except the first.'
      ],
      solution: `int total = 0;
var parts = new List<string>();

for (int i = 1; i <= 10; i++)
{
    total += i;
    parts.Add(i.ToString());
}

Console.WriteLine(string.Join(" ", parts));
Console.WriteLine($"Total: {total}");`,
      explanation: 'The accumulator variable must be declared **outside** the loop, or it would be reset every iteration. That pattern - declare outside, update inside - is the core of almost every loop you write.'
    },
    {
      id: 'fundamentals:loops#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Print a 5-row right-angled triangle of stars.\n\nPrint exactly:\n\n```\n*\n**\n***\n****\n*****\n```',
      starterCode: ``,
      expectedConcepts: ['nested loop'],
      checks: [
        { kind: 'regex', value: 'for[\\s\\S]*for|new string', message: 'Uses nested loops or string repetition' }
      ],
      run: { expectedOutput: '*\n**\n***\n****\n*****' },
      hints: [
        'The row number tells you how many stars that row needs.',
        'An outer loop for the rows, an inner loop that runs `row` times printing a star.',
        'Use `Console.Write` inside the inner loop and `Console.WriteLine()` after it to end the row.'
      ],
      solution: `for (int row = 1; row <= 5; row++)
{
    for (int star = 0; star < row; star++)
    {
        Console.Write("*");
    }
    Console.WriteLine();
}`,
      explanation: 'The inner loop bound depends on the outer loop variable - that dependency is what makes the shape a triangle rather than a rectangle. `new string(\'*\', row)` would also work in one line.'
    },
    {
      id: 'fundamentals:loops#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Find the largest number and its position in the array `{ 12, 45, 7, 98, 23 }` using a single pass.\n\nPrint exactly:\n\n```\nLargest: 98 at index 3\n```\n\nDo not use LINQ or `Array.Max`.',
      starterCode: `int[] numbers = { 12, 45, 7, 98, 23 };

`,
      expectedConcepts: ['for', 'comparison'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(', message: 'Uses an indexed loop' },
        { kind: 'notContains', value: 'Max()', message: 'Does not use the built-in Max' },
        { kind: 'notContains', value: 'System.Linq', message: 'Does not use LINQ' }
      ],
      run: { expectedOutput: 'Largest: 98 at index 3' },
      hints: [
        'Track two things as you go: the largest value seen and where you saw it.',
        'Start by assuming the first element is the largest, then compare from index 1 onwards.',
        'Update both variables together whenever you find something bigger.'
      ],
      solution: `int[] numbers = { 12, 45, 7, 98, 23 };

int largest = numbers[0];
int largestIndex = 0;

for (int i = 1; i < numbers.Length; i++)
{
    if (numbers[i] > largest)
    {
        largest = numbers[i];
        largestIndex = i;
    }
}

Console.WriteLine($"Largest: {largest} at index {largestIndex}");`,
      explanation: 'Starting from element 0 and looping from index 1 avoids having to invent a sentinel like `int.MinValue`. It also handles negative numbers correctly, which a naive `largest = 0` start would not.'
    },
    {
      id: 'fundamentals:loops#i3',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Print the first 10 numbers of the Fibonacci sequence, starting 0, 1.\n\nPrint exactly:\n\n```\n0 1 1 2 3 5 8 13 21 34\n```\n\n(One line, single spaces, no trailing space.)',
      starterCode: ``,
      expectedConcepts: ['loop', 'accumulator'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses a loop' },
        { kind: 'notContains', value: '34;', message: 'Calculates the sequence rather than listing it' }
      ],
      run: { expectedOutput: '0 1 1 2 3 5 8 13 21 34' },
      hints: [
        'Each number is the sum of the two before it, so you need to remember two values.',
        'Keep `a` and `b`, print `a`, then shift: the new `a` is `b` and the new `b` is `a + b`.',
        'Be careful with the shift - calculate the new value before you overwrite anything, or use a temporary.'
      ],
      solution: `int a = 0;
int b = 1;
var parts = new List<string>();

for (int i = 0; i < 10; i++)
{
    parts.Add(a.ToString());
    int next = a + b;
    a = b;
    b = next;
}

Console.WriteLine(string.Join(" ", parts));`,
      explanation: 'The temporary `next` is essential - assigning `a = b` first would destroy the value you still need for the sum. This is the same hazard as the variable-swap exercise.'
    },
    {
      id: 'fundamentals:loops#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This loop crashes at runtime. Find the bug, explain it, then fix it.',
      brokenCode: `int[] numbers = { 1, 2, 3 };

for (int i = 0; i <= numbers.Length; i++)
{
    Console.WriteLine(numbers[i]);
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The condition should use `<` rather than `<=`',
            'The loop should start at 1',
            '`numbers.Length` returns the wrong value',
            'Arrays cannot be indexed inside a loop'
          ],
          answer: 0,
          label: 'Identified the off-by-one'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which index does the loop try to read that does not exist?',
          accept: ['3'],
          label: 'Named the invalid index'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so it prints 1, 2 and 3 on separate lines.',
          starterCode: `int[] numbers = { 1, 2, 3 };

for (int i = 0; i <= numbers.Length; i++)
{
    Console.WriteLine(numbers[i]);
}`,
          checks: [
            { kind: 'regex', value: 'i\\s*<\\s*numbers\\.Length|foreach', message: 'Stops at the last valid index' }
          ],
          run: { expectedOutput: '1\n2\n3' },
          label: 'Fixed the bound'
        }
      ],
      hints: [],
      solution: `int[] numbers = { 1, 2, 3 };

foreach (int n in numbers)
{
    Console.WriteLine(n);
}`,
      explanation: 'Length 3 means valid indexes 0, 1 and 2. `<=` reaches index 3 and throws `IndexOutOfRangeException`. Using `foreach` when you do not need the index makes this mistake impossible.'
    },
    {
      id: 'fundamentals:loops#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This throws an InvalidOperationException at runtime.',
      brokenCode: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

foreach (int n in numbers)
{
    if (n % 2 == 0)
    {
        numbers.Remove(n);
    }
}

Console.WriteLine(string.Join(" ", numbers));`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The collection is modified while a foreach is iterating it',
            '`Remove` needs an index, not a value',
            '`List<int>` cannot be used with foreach',
            'The modulo test is inverted'
          ],
          answer: 0,
          label: 'Identified the collection-modified error'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does .NET throw here instead of carrying on?',
          accept: ['the enumerator is invalidated'],
          acceptContains: ['enumerat'],
          label: 'Explained the enumerator'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `1 3 5`.',
          starterCode: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

foreach (int n in numbers)
{
    if (n % 2 == 0)
    {
        numbers.Remove(n);
    }
}

Console.WriteLine(string.Join(" ", numbers));`,
          checks: [
            { kind: 'regex', value: 'RemoveAll|for\\s*\\(\\s*int\\s+i\\s*=\\s*numbers\\.Count|Where', message: 'Removes safely' }
          ],
          run: { expectedOutput: '1 3 5' },
          label: 'Fixed the removal'
        }
      ],
      hints: [],
      solution: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

numbers.RemoveAll(n => n % 2 == 0);

Console.WriteLine(string.Join(" ", numbers));`,
      explanation: '`foreach` holds an enumerator; changing the list invalidates it and .NET throws immediately rather than silently skipping items. `RemoveAll` is the idiomatic fix. Looping backwards with a `for` also works, because removing index `i` only shifts elements you have already passed.'
    },
    {
      id: 'fundamentals:loops#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: summarise a month of daily sales.\n\nGiven the array `{ 120, 0, 340, 89, 0, 455, 210 }` (zero means the shop was closed), report the number of trading days, the total, the best day index and the average per trading day rounded to one decimal place.\n\nPrint exactly:\n\n```\nTrading days: 5\nTotal: 1214\nBest day: index 5\nAverage: 242.8\n```',
      starterCode: `int[] sales = { 120, 0, 340, 89, 0, 455, 210 };

`,
      expectedConcepts: ['loop', 'accumulator', 'division'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|foreach', message: 'Uses a loop' },
        { kind: 'regex', value: '\\(double\\)|\\(decimal\\)|Math\\.Round', message: 'Avoids integer division for the average' },
        { kind: 'notContains', value: '242.8;', message: 'Calculates the average' }
      ],
      run: { expectedOutput: 'Trading days: 5\nTotal: 1214\nBest day: index 5\nAverage: 242.8' },
      hints: [
        'You need the index for the best day, so use a `for` loop rather than `foreach`.',
        'Skip the zero days with `continue` before doing any accumulation.',
        'Remember: `total / tradingDays` with two ints is integer division. Cast one side to `double`.'
      ],
      solution: `int[] sales = { 120, 0, 340, 89, 0, 455, 210 };

int tradingDays = 0;
int total = 0;
int best = -1;
int bestIndex = -1;

for (int i = 0; i < sales.Length; i++)
{
    if (sales[i] == 0) continue;

    tradingDays++;
    total += sales[i];

    if (sales[i] > best)
    {
        best = sales[i];
        bestIndex = i;
    }
}

double average = (double)total / tradingDays;

Console.WriteLine($"Trading days: {tradingDays}");
Console.WriteLine($"Total: {total}");
Console.WriteLine($"Best day: index {bestIndex}");
Console.WriteLine($"Average: {average:F1}");`,
      explanation: 'One pass computes four different results. The `continue` guard at the top means the rest of the body never has to think about closed days again - the same structural idea as guard clauses in a method.'
    },
    {
      id: 'fundamentals:loops#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Prime sieve',
      prompt: 'No hints.\n\nPrint every prime number below 50, separated by single spaces on one line.\n\nExpected:\n\n```\n2 3 5 7 11 13 17 19 23 29 31 37 41 43 47\n```\n\nDo not use LINQ. Your inner loop should not test divisors beyond the square root of the candidate.',
      starterCode: ``,
      expectedConcepts: ['nested loop', '%'],
      checks: [
        { kind: 'regex', value: '%', message: 'Tests divisibility' },
        { kind: 'regex', value: 'Sqrt|(\\w+)\\s*\\*\\s*\\1\\s*<=', message: 'Limits the divisor loop to the square root' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '2 3 5 7 11 13 17 19 23 29 31 37 41 43 47' },
      hints: [],
      solution: `var primes = new List<string>();

for (int candidate = 2; candidate < 50; candidate++)
{
    bool isPrime = true;

    for (int divisor = 2; divisor * divisor <= candidate; divisor++)
    {
        if (candidate % divisor == 0)
        {
            isPrime = false;
            break;
        }
    }

    if (isPrime) primes.Add(candidate.ToString());
}

Console.WriteLine(string.Join(" ", primes));`,
      explanation: '`divisor * divisor <= candidate` is the square-root bound without the cost of a floating point `Math.Sqrt` call. The `break` matters too: once you find one divisor there is no reason to keep testing.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:loops#q1', type: 'predict-output',
      prompt: 'How many times does the body run?',
      code: `for (int i = 1; i <= 4; i++) { }`,
      accept: ['4'],
      explanation: 'Starting at 1 with `<= 4` gives 1, 2, 3, 4 - four iterations.'
    },
    {
      id: 'fundamentals:loops#q2', type: 'mcq',
      prompt: 'What happens if you call `list.Remove(x)` inside a `foreach` over that list?',
      options: [
        'The item is removed and the loop continues',
        'An `InvalidOperationException` is thrown',
        'The loop silently skips an item',
        'It does not compile'
      ],
      answer: 1,
      explanation: 'Modifying a collection invalidates the enumerator, so .NET throws rather than behaving unpredictably. Use `RemoveAll` or loop backwards with a `for`.'
    },
    {
      id: 'fundamentals:loops#q3', type: 'explain',
      prompt: 'Explain the difference between `break` and `continue`, and give a situation where each is the right choice.',
      expectedConcepts: ['break|exit|leave', 'continue|skip|next', 'loop'],
      minLength: 80,
      explanation: '`break` leaves the loop entirely - right when you have found what you were looking for, or hit an unrecoverable condition. `continue` skips the rest of this iteration and moves to the next item - right when a particular item should simply be ignored.'
    },
    {
      id: 'fundamentals:loops#q4', type: 'mcq',
      prompt: 'Which loop is guaranteed to execute its body at least once?',
      options: ['`for`', '`foreach`', '`while`', '`do-while`'],
      answer: 3,
      explanation: '`do-while` tests the condition after the body, so the body always runs once. The others test first and may run zero times.'
    },
    {
      id: 'fundamentals:loops#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int count = 0;
for (int i = 0; i < 3; i++)
{
    for (int j = 0; j < 4; j++)
    {
        count++;
    }
}
Console.WriteLine(count);`,
      accept: ['12'],
      explanation: 'Nested loops multiply: 3 outer iterations times 4 inner iterations is 12 executions of the body.'
    }
  ],
  commonMistakes: [
    { mistake: 'Using `<=` with `Length` or `Count`', why: 'The length feels like a valid index.', fix: 'Indexes stop at `Length - 1`, so the condition is `<`. Use `foreach` when you do not need the index at all.' },
    { mistake: 'Forgetting to advance the counter in a `while`', why: 'The increment is not next to the condition as it is in a `for`.', fix: 'When writing a `while`, locate the line that will eventually make the condition false before you run it.' },
    { mistake: 'Modifying a collection inside a `foreach`', why: 'It reads as the obvious way to filter in place.', fix: 'Use `RemoveAll`, build a new collection, or loop backwards with a `for`.' },
    { mistake: 'Declaring the accumulator inside the loop', why: 'It is used inside the loop, so that is where it seems to belong.', fix: 'A running total must live outside the loop or it is reset every iteration.' },
    { mistake: 'Expecting `break` to exit both of two nested loops', why: 'It reads like "stop looping".', fix: '`break` leaves only the innermost loop. Extract to a method and `return`, or use a flag.' }
  ],
  realWorld: [
    'Every list rendered in Angular and every result set read from SQL is a loop somewhere.',
    'Nested loops over two collections are the most common accidental performance problem in business code - a million iterations is easy to write by accident.',
    'Batch import jobs are loops with `continue` guards for bad rows and logging for each skip.',
    'The collection-modified exception is one of the most frequently asked-about .NET runtime errors.'
  ],
  resources: [
    { label: 'Trace by hand', note: 'Before running a loop you are unsure about, write the variable values for the first three iterations on paper. It finds off-by-ones faster than the debugger.' }
  ]
}

,
/* ============================================================
   8. METHODS
   ============================================================ */
{
  topicId: 'fundamentals:methods',
  title: 'Methods',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: ['fundamentals:loops'],
  objectives: [
    'Declare a method and explain every part of its signature',
    'Decide when a block of code deserves to become a method',
    'Explain why a method should do one thing and be named for that thing',
    'Use method overloading without creating ambiguity',
    'Recognise when a method has grown too big or taken on hidden responsibilities'
  ],
  sections: [
    {
      id: 'anatomy',
      title: 'The anatomy of a method',
      blocks: [
        { type: 'code', code: `static decimal CalculateTax(decimal amount, decimal rate)
{
    return amount * rate;
}
//  ^      ^            ^        ^
//  |      |            |        parameters: what it needs
//  |      |            name: what it does
//  |      return type: what it gives back
//  modifier: how it can be called` },
        { type: 'text', text: 'The **signature** is the name plus the parameter types. That is what the compiler uses to tell one method from another - the return type is not part of it.' },
        { type: 'text', text: '`static` means the method belongs to the type rather than to an instance. In the small console programs you are writing now, everything is `static`. Once you meet classes in Core C#, the distinction becomes important.' },
        { type: 'code', caption: 'Expression-bodied members, for one-liners', code: `static decimal CalculateTax(decimal amount, decimal rate) => amount * rate;` }
      ]
    },
    {
      id: 'why',
      title: 'Why extract a method at all',
      blocks: [
        { type: 'list', items: [
          '**Naming.** A well-named method turns six lines of arithmetic into one line that says what it means. The name is documentation that cannot go stale.',
          '**Reuse.** Write the VAT rule once, call it from four places, change it in one.',
          '**Testing.** You can only unit-test something you can call. A 200-line method with everything inline is untestable.',
          '**Reading.** A method you trust is a method you can skip over. That is how you read a large codebase without holding all of it in your head.'
        ] },
        { type: 'analogy', text: 'A method is a chapter heading. You can read the contents page and understand the shape of the book without reading every page.' },
        { type: 'note', text: 'The strongest signal that code wants to be a method: you find yourself writing a comment explaining what the next few lines do. Make the comment the method name instead.' }
      ]
    },
    {
      id: 'single',
      title: 'One method, one job',
      blocks: [
        { type: 'code', caption: 'Doing too much', code: `static void ProcessOrder(Order order)
{
    // validate
    // calculate totals
    // save to the database
    // send a confirmation email
    // write to the audit log
}` },
        { type: 'text', text: 'That method cannot be named honestly, cannot be tested without a database and a mail server, and has five reasons to change. Each comment is a method waiting to be extracted.' },
        { type: 'code', caption: 'Each step nameable and testable', code: `static void ProcessOrder(Order order)
{
    Validate(order);
    decimal total = CalculateTotal(order);
    Save(order, total);
    SendConfirmation(order);
    Audit(order);
}` },
        { type: 'text', text: 'The second version is the same work, but now every line reads like the sentence you would use to describe it out loud. This idea has a formal name - the Single Responsibility Principle - which you will meet properly in the Testing phase.' },
        { type: 'whenNot', text: 'Do not extract for the sake of it. A method called once, used nowhere else, that needs six parameters to do its job, often makes the code harder to follow rather than easier.' }
      ]
    },
    {
      id: 'naming',
      title: 'Naming methods',
      blocks: [
        { type: 'table', head: ['Kind of method', 'Name it', 'Example'], rows: [
          ['Does something', 'a verb phrase', '`SendEmail`, `CalculateTax`, `SaveOrder`'],
          ['Answers a question', 'Is / Has / Can', '`IsValid`, `HasAccess`, `CanRetry`'],
          ['Gets a value', 'Get + noun', '`GetCustomer`, `GetTotal`'],
          ['Converts', 'To + type', '`ToString`, `ToList`, `ToDto`']
        ] },
        { type: 'warning', text: 'A method whose name contains "And" is usually two methods. `ValidateAndSave` is a confession, not a name.' }
      ]
    },
    {
      id: 'overloading',
      title: 'Overloading',
      blocks: [
        { type: 'code', code: `static class Pricing
{
    public static decimal Total(decimal price) => price;
    public static decimal Total(decimal price, decimal tax) => price + tax;
    public static decimal Total(decimal price, decimal tax, decimal shipping)
        => price + tax + shipping;
}` },
        { type: 'text', text: 'Several methods can share a name if their **parameter lists** differ. The compiler picks the right one from the arguments you pass.' },
        { type: 'warning', text: 'Overloads must be members of a **type**. The helper methods you have been writing at the bottom of a top-level program are **local functions**, and C# does not allow local functions to be overloaded - you will get "a local function named Total is already defined". Put overloads in a `static class`, as above.' },
        { type: 'text', text: 'Overloads should all do conceptually the same thing. `Total(decimal)` and `Total(string)` that returns a receipt would be an abuse of the name.' },
        { type: 'note', text: 'Optional parameters often replace overloads: `static decimal Total(decimal price, decimal tax = 0m)` covers two cases with one method.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Extracting a method from inline code',
      code: `decimal[] prices = { 19.99m, 45.00m, 7.50m };

foreach (decimal price in prices)
{
    Console.WriteLine($"{price} -> {WithVat(price)}");
}

static decimal WithVat(decimal price)
{
    const decimal VatRate = 0.20m;
    return price + (price * VatRate);
}`,
      walkthrough: [
        { line: 'WithVat(price)', note: 'The call site now reads as an English sentence. Nobody has to know how VAT is calculated to understand this loop.' },
        { line: 'const decimal VatRate = 0.20m;', note: 'The rate lives with the logic that uses it, in the smallest scope that works.' },
        { line: 'static decimal WithVat(decimal price)', note: 'One input, one output, no side effects. This is the easiest kind of method to test and to trust.' }
      ],
      output: '19.99 -> 23.9880\n45.00 -> 54.0000\n7.50 -> 9.0000',
      takeaway: 'Note the trailing zeros - decimal multiplication increases the scale. In real code you would format with `:F2` at the point of display, not in the calculation.'
    },
    {
      id: 'ex2',
      title: 'Small methods composing into a readable whole',
      code: `string[] emails = { " Barani@Example.COM ", "bad-email", "" };

foreach (string raw in emails)
{
    Console.WriteLine(Describe(raw));
}

static string Describe(string raw)
{
    if (!IsPresent(raw)) return "empty";
    if (!LooksLikeEmail(raw)) return "invalid";
    return Normalise(raw);
}

static bool IsPresent(string value) => !string.IsNullOrWhiteSpace(value);
static bool LooksLikeEmail(string value) => value.Contains('@');
static string Normalise(string value) => value.Trim().ToLower();`,
      walkthrough: [
        { line: 'static string Describe(string raw)', note: 'Reads as three rules in priority order. You can understand it without reading any of the helpers.' },
        { line: 'static bool IsPresent(string value) => ...', note: 'Each helper is one expression, named for the question it answers.' },
        { line: 'LooksLikeEmail', note: 'The name is honest about what it does - it checks for an @ sign, it does not validate an address properly. Naming it `IsValidEmail` would be a lie.' }
      ],
      output: 'barani@example.com\ninvalid\nempty',
      takeaway: 'Small honestly-named methods let the top-level method read like a specification.'
    },
    {
      id: 'ex3',
      title: 'Overloading and optional parameters',
      code: `Console.WriteLine(Greetings.Greet("Barani"));
Console.WriteLine(Greetings.Greet("Barani", "Good morning"));
Console.WriteLine(GreetOptional("Sam"));
Console.WriteLine(GreetOptional("Sam", "Evening"));

static string GreetOptional(string name, string greeting = "Hello") => $"{greeting}, {name}";

static class Greetings
{
    public static string Greet(string name) => $"Hello, {name}";
    public static string Greet(string name, string greeting) => $"{greeting}, {name}";
}`,
      walkthrough: [
        { line: 'static class Greetings', note: 'The overloads live on a type. They could not be local functions - C# does not allow local functions to share a name.' },
        { line: 'public static string Greet(string name)', note: 'Two methods, one name, different parameter lists. The compiler chooses by the arguments at the call site.' },
        { line: 'string greeting = "Hello"', note: 'An optional parameter does the same job with one method instead of two. Prefer this when the overloads would only differ by a default.' }
      ],
      output: 'Hello, Barani\nGood morning, Barani\nHello, Sam\nEvening, Sam',
      takeaway: 'Reach for optional parameters first; use real overloads when the parameter types genuinely differ.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:methods#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'Which part of a method declaration makes up its **signature**?',
      options: [
        'The return type and the name',
        'The name and the parameter types',
        'The name only',
        'The whole declaration including the body'
      ],
      answer: 1,
      hints: [
        'The signature is what the compiler uses to tell two methods apart.',
        'Try to write two methods with the same name and parameters but different return types - the compiler rejects it.'
      ],
      explanation: 'The signature is the name plus the parameter types. Two methods cannot differ by return type alone.',
      solution: 'The name and the parameter types'
    },
    {
      id: 'fundamentals:methods#g2',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Write a method `Square` that takes an `int` and returns its square, then call it for 3, 7 and 12.\n\nPrint exactly:\n\n```\n9\n49\n144\n```',
      starterCode: `Console.WriteLine(Square(3));
Console.WriteLine(Square(7));
Console.WriteLine(Square(12));

// Write the Square method here
`,
      expectedConcepts: ['method', 'return'],
      checks: [
        { kind: 'regex', value: 'static\\s+int\\s+Square', message: 'Declares a static int Square method' },
        { kind: 'regex', value: 'return|=>', message: 'Returns a value' }
      ],
      run: { expectedOutput: '9\n49\n144' },
      hints: [
        'The method needs a return type of `int`, a name, and one `int` parameter.',
        '`static int Square(int n)` is the declaration.',
        'The body can be `return n * n;` or the expression form `=> n * n;`'
      ],
      solution: `Console.WriteLine(Square(3));
Console.WriteLine(Square(7));
Console.WriteLine(Square(12));

static int Square(int n) => n * n;`,
      explanation: 'The expression-bodied form is ideal for a one-line method. `static int Square(int n) { return n * n; }` is identical in behaviour.'
    },
    {
      id: 'fundamentals:methods#g3',
      type: 'predict-output', level: 2, difficulty: 'Medium',
      prompt: 'Which overload runs, and what is printed?',
      code: `Console.WriteLine(Format.Describe(5));

static class Format
{
    public static string Describe(int n) => "int";
    public static string Describe(double n) => "double";
}`,
      accept: ['int'],
      hints: [
        'The compiler picks the overload that best matches the argument type.',
        '`5` is an integer literal, so which overload is the exact match?'
      ],
      explanation: 'An `int` literal matches the `int` overload exactly, so no conversion is needed. Had you written `Describe(5.0)` the double overload would have been chosen.',
      solution: 'int'
    },
    {
      id: 'fundamentals:methods#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write three small methods and compose them.\n\n- `IsEven(int)` returns whether a number is even\n- `Sum(int[])` returns the total of an array\n- `CountEven(int[])` returns how many values are even\n\nFor `{ 3, 8, 12, 5, 6 }` print exactly:\n\n```\nSum: 34\nEven: 3\n```',
      starterCode: `int[] numbers = { 3, 8, 12, 5, 6 };

Console.WriteLine($"Sum: {Sum(numbers)}");
Console.WriteLine($"Even: {CountEven(numbers)}");

// Write the three methods
`,
      expectedConcepts: ['method', 'return'],
      checks: [
        { kind: 'regex', value: 'static\\s+bool\\s+IsEven', message: 'Declares IsEven returning bool' },
        { kind: 'regex', value: 'static\\s+int\\s+Sum', message: 'Declares Sum returning int' },
        { kind: 'regex', value: 'static\\s+int\\s+CountEven', message: 'Declares CountEven returning int' },
        { kind: 'regex', value: 'IsEven\\(', message: 'CountEven reuses IsEven' }
      ],
      run: { expectedOutput: 'Sum: 34\nEven: 3' },
      hints: [
        'Start with `IsEven` - one line, returns `n % 2 == 0`.',
        '`Sum` loops over the array with an accumulator declared before the loop.',
        '`CountEven` should call `IsEven` rather than repeating the modulo test - that is the point of having it.'
      ],
      solution: `int[] numbers = { 3, 8, 12, 5, 6 };

Console.WriteLine($"Sum: {Sum(numbers)}");
Console.WriteLine($"Even: {CountEven(numbers)}");

static bool IsEven(int n) => n % 2 == 0;

static int Sum(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;
    return total;
}

static int CountEven(int[] values)
{
    int count = 0;
    foreach (int v in values)
    {
        if (IsEven(v)) count++;
    }
    return count;
}`,
      explanation: '`CountEven` calling `IsEven` is the whole idea: the definition of "even" now lives in exactly one place. If the rule ever changed, there is one line to edit.'
    },
    {
      id: 'fundamentals:methods#i2',
      type: 'refactor', level: 3, difficulty: 'Medium',
      prompt: 'This method does four things. Break it into named methods so the top-level one reads as a summary.\n\nKeep the output identical.',
      starterCode: `Report(new[] { 4, 9, 2, 7 });

static void Report(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;

    int max = values[0];
    foreach (int v in values) if (v > max) max = v;

    int min = values[0];
    foreach (int v in values) if (v < min) min = v;

    Console.WriteLine($"Total: {total}");
    Console.WriteLine($"Max: {max}");
    Console.WriteLine($"Min: {min}");
}`,
      expectedConcepts: ['method extraction'],
      checks: [
        { kind: 'regex', value: 'static\\s+int\\s+\\w*Sum|static\\s+int\\s+Total', message: 'Extracts a sum method' },
        { kind: 'regex', value: 'static\\s+int\\s+\\w*Max', message: 'Extracts a max method' },
        { kind: 'regex', value: 'static\\s+int\\s+\\w*Min', message: 'Extracts a min method' }
      ],
      run: { expectedOutput: 'Total: 22\nMax: 9\nMin: 2' },
      hints: [
        'Each of the three loops is a separate idea with a natural name.',
        'Extract `Sum`, `Max` and `Min`, each taking `int[]` and returning `int`.',
        '`Report` should end up as three calls and three print statements.'
      ],
      solution: `Report(new[] { 4, 9, 2, 7 });

static void Report(int[] values)
{
    Console.WriteLine($"Total: {Sum(values)}");
    Console.WriteLine($"Max: {Max(values)}");
    Console.WriteLine($"Min: {Min(values)}");
}

static int Sum(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;
    return total;
}

static int Max(int[] values)
{
    int max = values[0];
    foreach (int v in values) if (v > max) max = v;
    return max;
}

static int Min(int[] values)
{
    int min = values[0];
    foreach (int v in values) if (v < min) min = v;
    return min;
}`,
      explanation: '`Report` is now three lines and needs no comments. Each helper can be tested on its own, and `Max` is reusable anywhere else in the program.'
    },
    {
      id: 'fundamentals:methods#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'A colleague has a 180-line method called `ProcessData`. Explain three concrete problems this causes, and describe how you would decide where to split it.',
      expectedConcepts: ['test|testing|unit', 'name|naming|read', 'reuse|change|maintain', 'responsib|one thing|single'],
      minLength: 150,
      hints: [
        'Think about what you would have to set up to write a unit test for it.',
        'Think about what the name tells a reader - and what it hides.',
        'Look for the comments inside it; what are they marking?'
      ],
      solution: 'It cannot be unit-tested in isolation because every dependency it touches has to be available at once. Its name cannot describe what it does, so a reader must read all 180 lines to know whether it is relevant. It has many reasons to change, so unrelated edits collide in the same method and in the same merge. To split it I would look for the comments and the blank-line groupings - each of those is a step with a name - and extract each one into a method named for the step, starting with the parts that have no side effects.',
      explanation: 'The practical heuristic is the one in the solution: existing comments and blank-line groupings are the author telling you where the seams already are.'
    },
    {
      id: 'fundamentals:methods#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This does not compile. Work out why, explain it, then fix it.',
      brokenCode: `Console.WriteLine(Double(5));

static void Double(int n)
{
    return n * 2;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The method is declared `void` but returns a value',
            '`Double` is a reserved word',
            'The method must be declared before it is called',
            '`n * 2` is not a valid expression'
          ],
          answer: 0,
          label: 'Identified the void/return mismatch'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What does `void` mean as a return type?',
          accept: ['it returns nothing'],
          acceptContains: ['nothing'],
          label: 'Explained void'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `10`.',
          starterCode: `Console.WriteLine(Double(5));

static void Double(int n)
{
    return n * 2;
}`,
          checks: [
            { kind: 'regex', value: 'static\\s+int\\s+Double', message: 'Declares the correct return type' },
            { kind: 'notContains', value: 'static void Double', message: 'No longer void' }
          ],
          run: { expectedOutput: '10' },
          label: 'Fixed the return type'
        }
      ],
      hints: [],
      solution: `Console.WriteLine(Double(5));

static int Double(int n) => n * 2;`,
      explanation: '`void` declares that a method returns nothing, so `return n * 2;` contradicts it. The return type is a contract - changing the body means changing the declaration to match.'
    },
    {
      id: 'fundamentals:methods#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This compiles but always prints the same answer regardless of input. Find out why.',
      brokenCode: `Console.WriteLine(ApplyDiscount(100m, 0.10m));
Console.WriteLine(ApplyDiscount(200m, 0.25m));

static decimal ApplyDiscount(decimal price, decimal rate)
{
    decimal discounted = price - (price * 0.10m);
    return discounted;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The `rate` parameter is accepted but never used - the rate is hard-coded',
            'The method should be `void`',
            'Decimal subtraction is not allowed',
            'The method needs to be called with named arguments'
          ],
          answer: 0,
          label: 'Spotted the ignored parameter'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does the compiler not report this as an error?',
          accept: ['an unused parameter is legal'],
          acceptContains: ['legal'],
          label: 'Explained why it compiles'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `90.00` then `150.00`.',
          starterCode: `Console.WriteLine(ApplyDiscount(100m, 0.10m));
Console.WriteLine(ApplyDiscount(200m, 0.25m));

static decimal ApplyDiscount(decimal price, decimal rate)
{
    decimal discounted = price - (price * 0.10m);
    return discounted;
}`,
          checks: [
            { kind: 'regex', value: 'price\\s*\\*\\s*rate', message: 'Uses the rate parameter' },
            { kind: 'notContains', value: '0.10m)', message: 'No longer hard-codes the rate' }
          ],
          run: { expectedOutput: '90.00\n150.00' },
          label: 'Used the parameter'
        }
      ],
      hints: [],
      solution: `Console.WriteLine(ApplyDiscount(100m, 0.10m));
Console.WriteLine(ApplyDiscount(200m, 0.25m));

static decimal ApplyDiscount(decimal price, decimal rate)
{
    return price - (price * rate);
}`,
      explanation: 'An unused parameter is perfectly legal C#, so the compiler stays quiet. This is a common bug when a hard-coded value is later promoted to a parameter and one usage is missed. Modern analysers can be configured to warn about unused parameters - worth enabling.'
    },
    {
      id: 'fundamentals:methods#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: build a small payroll calculator out of named methods.\n\nWrite `GrossToNet(decimal gross)` that applies 20% tax and 5% pension, plus helper methods `Tax(decimal)` and `Pension(decimal)`.\n\nFor gross values 3000, 4800 and 5500 print exactly:\n\n```\n3000 -> 2250.00\n4800 -> 3600.00\n5500 -> 4125.00\n```',
      starterCode: `decimal[] salaries = { 3000m, 4800m, 5500m };

foreach (decimal gross in salaries)
{
    Console.WriteLine($"{gross} -> {GrossToNet(gross):F2}");
}

// Write GrossToNet, Tax and Pension
`,
      expectedConcepts: ['method', 'const'],
      checks: [
        { kind: 'regex', value: 'static\\s+decimal\\s+Tax', message: 'Has a Tax method' },
        { kind: 'regex', value: 'static\\s+decimal\\s+Pension', message: 'Has a Pension method' },
        { kind: 'regex', value: 'static\\s+decimal\\s+GrossToNet', message: 'Has a GrossToNet method' },
        { kind: 'regex', value: 'Tax\\(', message: 'GrossToNet reuses Tax' }
      ],
      run: { expectedOutput: '3000 -> 2250.00\n4800 -> 3600.00\n5500 -> 4125.00' },
      hints: [
        'Each rate should be a `const decimal` beside the method that uses it.',
        '`Tax` and `Pension` are one-liners: `gross * Rate`.',
        '`GrossToNet` should call both rather than repeating the multiplications.'
      ],
      solution: `decimal[] salaries = { 3000m, 4800m, 5500m };

foreach (decimal gross in salaries)
{
    Console.WriteLine($"{gross} -> {GrossToNet(gross):F2}");
}

static decimal Tax(decimal gross) => gross * 0.20m;
static decimal Pension(decimal gross) => gross * 0.05m;
static decimal GrossToNet(decimal gross) => gross - Tax(gross) - Pension(gross);`,
      explanation: 'Three one-line methods, each nameable and testable. When the tax rate changes you edit one line, and every caller is correct automatically.'
    },
    {
      id: 'fundamentals:methods#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Statistics toolkit',
      prompt: 'No hints.\n\nBuild four methods over an `int[]`: `Mean` (returns `double`), `Median` (returns `double`), `Range` (max minus min) and `Mode` (the most frequent value).\n\nFor `{ 4, 1, 7, 4, 9, 4, 2 }` print exactly:\n\n```\nMean: 4.43\nMedian: 4\nRange: 8\nMode: 4\n```\n\nMean is rounded to two decimal places. Do not use LINQ.',
      starterCode: ``,
      expectedConcepts: ['method', 'array'],
      checks: [
        { kind: 'regex', value: 'static\\s+double\\s+Mean', message: 'Has a Mean method' },
        { kind: 'regex', value: 'static\\s+double\\s+Median', message: 'Has a Median method' },
        { kind: 'regex', value: 'static\\s+int\\s+Range', message: 'Has a Range method' },
        { kind: 'regex', value: 'static\\s+int\\s+Mode', message: 'Has a Mode method' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: 'Mean: 4.43\nMedian: 4\nRange: 8\nMode: 4' },
      hints: [],
      solution: `int[] data = { 4, 1, 7, 4, 9, 4, 2 };

Console.WriteLine($"Mean: {Mean(data):F2}");
Console.WriteLine($"Median: {Median(data)}");
Console.WriteLine($"Range: {Range(data)}");
Console.WriteLine($"Mode: {Mode(data)}");

static double Mean(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;
    return (double)total / values.Length;
}

static double Median(int[] values)
{
    int[] copy = (int[])values.Clone();
    Array.Sort(copy);
    int mid = copy.Length / 2;
    return copy.Length % 2 == 1 ? copy[mid] : (copy[mid - 1] + copy[mid]) / 2.0;
}

static int Range(int[] values)
{
    int min = values[0], max = values[0];
    foreach (int v in values)
    {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return max - min;
}

static int Mode(int[] values)
{
    int best = values[0], bestCount = 0;
    foreach (int candidate in values)
    {
        int count = 0;
        foreach (int v in values) if (v == candidate) count++;
        if (count > bestCount) { bestCount = count; best = candidate; }
    }
    return best;
}`,
      explanation: 'Note `Median` cloning the array before sorting - sorting the caller\'s array would be a nasty hidden side effect. A method that quietly mutates its argument is one of the hardest bugs to track down.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:methods#q1', type: 'mcq',
      prompt: 'Can two methods differ only by their return type?',
      options: ['Yes', 'No - the return type is not part of the signature', 'Only if one is static', 'Only for value types'],
      answer: 1,
      explanation: 'Overload resolution uses the name and parameter types. Two methods differing only by return type is a compile error.'
    },
    {
      id: 'fundamentals:methods#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `Console.WriteLine(Add(2, 3));

static int Add(int a, int b) => a + b;`,
      accept: ['5'],
      explanation: 'An expression-bodied method returns the value of its expression.'
    },
    {
      id: 'fundamentals:methods#q3', type: 'explain',
      prompt: 'Why is a method named `ValidateAndSaveOrder` usually a design smell? What would you do about it?',
      expectedConcepts: ['two|more than one|and', 'responsib|one thing|single', 'split|extract|separate'],
      minLength: 70,
      explanation: 'The "And" is the giveaway: the name is describing two responsibilities, which means it has two reasons to change and cannot be tested for one without the other. Split it into `Validate` and `Save`, and let the caller sequence them.'
    },
    {
      id: 'fundamentals:methods#q4', type: 'mcq',
      prompt: 'What does `static` mean on a method in a simple console program?',
      options: [
        'It cannot be changed',
        'It belongs to the type rather than to an instance',
        'It runs faster',
        'It can only be called once'
      ],
      answer: 1,
      explanation: 'Static members belong to the type. Because top-level statements have no instance to attach to, local functions and helpers in a simple program are static.'
    },
    {
      id: 'fundamentals:methods#q5', type: 'predict-output',
      prompt: 'What is printed?',
      code: `Console.WriteLine(Label(3));

static string Label(int n) => n switch { 1 => "one", 2 => "two", _ => "many" };`,
      accept: ['many'],
      explanation: '3 matches no specific arm, so the discard pattern supplies the result.'
    }
  ],
  commonMistakes: [
    { mistake: 'Methods that do several unrelated things', why: 'The code was written in the order the work happens.', fix: 'Extract each step. If the name needs an "And", it is two methods.' },
    { mistake: 'Declaring `void` and then trying to return a value', why: 'The body was written before the signature was thought about.', fix: 'The return type is a contract. Change the declaration when the body changes.' },
    { mistake: 'Accepting a parameter and not using it', why: 'A hard-coded value was promoted to a parameter and one usage was missed.', fix: 'Enable the analyser warning for unused parameters, and read the body after changing a signature.' },
    { mistake: 'Mutating an array or list passed in as an argument', why: 'It is a reference type, so it is easy to do without noticing.', fix: 'Copy first if the caller should not see the change - `Array.Sort` on a parameter is a classic hidden side effect.' },
    { mistake: 'Vague names like `Process`, `Handle` or `DoWork`', why: 'They are true of almost anything.', fix: 'Name the method after the specific thing it does. If you cannot, the method is probably doing too much.' }
  ],
  realWorld: [
    'Every ASP.NET Core controller action is a method, and keeping it thin by delegating to services is the single most repeated piece of API design advice.',
    'Unit testing is only possible at method boundaries - how you split methods determines how testable the codebase is.',
    'Code review comments about method length and naming outnumber almost every other category.',
    'Extract Method is the most-used refactoring in every IDE, and understanding when to apply it is the skill.'
  ],
  resources: [
    { label: 'Find a long method', note: 'Open the longest method you have written and count its responsibilities. Extract one. Notice how the original reads afterwards.' }
  ]
}

,
/* ============================================================
   9. PARAMETERS
   ============================================================ */
{
  topicId: 'fundamentals:parameters',
  title: 'Parameters',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: ['fundamentals:methods'],
  objectives: [
    'Explain what is copied when you pass a value type and a reference type',
    'Use ref, out and in correctly, and justify each one',
    'Use optional and named arguments to make call sites readable',
    'Use params for a variable number of arguments',
    'Recognise when a long parameter list is telling you the design is wrong'
  ],
  sections: [
    {
      id: 'passing',
      title: 'What actually gets passed',
      blocks: [
        { type: 'text', text: 'By default C# passes **by value**: the method receives a copy of whatever the variable holds. The subtlety is what the variable holds.' },
        { type: 'list', items: [
          'For a **value type** the variable holds the data, so the method gets a copy of the data. Changes inside the method are invisible outside.',
          'For a **reference type** the variable holds a reference, so the method gets a copy of the reference. Both now point at the same object, so changes to the object *are* visible outside - but reassigning the parameter is not.'
        ] },
        { type: 'code', code: `static void Bump(int n) { n++; }                  // caller sees nothing
static void AddItem(List<int> list) { list.Add(1); }  // caller SEES the new item
static void Replace(List<int> list) { list = new List<int>(); }  // caller sees nothing` },
        { type: 'text', text: 'The third case catches people out. Reassigning the parameter only changes the local copy of the reference; the caller still points at the original object.' }
      ]
    },
    {
      id: 'ref-out-in',
      title: 'ref, out and in',
      blocks: [
        { type: 'table', head: ['Modifier', 'Must be initialised first?', 'Must be assigned inside?', 'Use for'], rows: [
          ['`ref`', 'Yes', 'No', 'Passing a variable the method may change'],
          ['`out`', 'No', 'Yes', 'Returning an extra value (`TryParse`)'],
          ['`in`', 'Yes', 'Cannot be changed', 'Passing a large struct without copying']
        ] },
        { type: 'code', code: `static void Double(ref int n) => n *= 2;
static void Split(string full, out string first, out string last)
{
    string[] parts = full.Split(' ');
    first = parts[0];
    last = parts[^1];
}

int x = 5;
Double(ref x);                       // x is now 10
Split("Barani Dharan", out string f, out string l);` },
        { type: 'text', text: 'Note that `ref` and `out` must appear at the **call site** too. That is deliberate: the reader can see that the variable may be modified without opening the method.' },
        { type: 'whenNot', text: 'Avoid `ref` and `out` in ordinary code. A method that needs to hand back two things usually wants a tuple or a small type. `out` earns its place in the `TryParse` pattern and little else.' }
      ]
    },
    {
      id: 'optional-named',
      title: 'Optional and named arguments',
      blocks: [
        { type: 'code', code: `static decimal Total(decimal price, decimal tax = 0m, decimal shipping = 0m)
    => price + tax + shipping;

Total(100m);                          // 100
Total(100m, 20m);                     // 120
Total(100m, shipping: 5m);            // 105 - skip tax by naming shipping` },
        { type: 'text', text: 'Optional parameters must come after all required ones. Named arguments let you skip over the middle ones and, more importantly, make call sites self-documenting.' },
        { type: 'code', caption: 'Named arguments as documentation', code: `// What do these booleans mean?
CreateUser("sam", true, false, true);

// Now it is obvious
CreateUser("sam", isAdmin: true, sendEmail: false, isActive: true);` },
        { type: 'warning', text: 'Default values are baked into the **calling** assembly at compile time. If you change a default in a library, callers keep the old value until they are recompiled. Inside one project this never matters; across a NuGet package boundary it does.' }
      ]
    },
    {
      id: 'params',
      title: 'params: a variable number of arguments',
      blocks: [
        { type: 'code', code: `static int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}

Sum();              // 0
Sum(1, 2);          // 3
Sum(1, 2, 3, 4);    // 10
Sum(new[] { 1, 2 }); // 3 - an array still works` },
        { type: 'text', text: '`params` must be the last parameter and must be an array type. `Console.WriteLine` and `string.Format` both use it.' }
      ]
    },
    {
      id: 'too-many',
      title: 'When the parameter list is the problem',
      blocks: [
        { type: 'code', code: `static void CreateOrder(string customer, string address, string city,
    string postcode, string country, decimal total, decimal tax,
    bool isGift, bool isPriority, string notes) { }` },
        { type: 'text', text: 'Ten parameters is a design signal, not a formatting problem. Callers cannot read it, the order is easy to get wrong, and several of those parameters clearly belong together.' },
        { type: 'text', text: 'The fix is to group the related ones into a type - an `Address`, an `OrderOptions`. You will learn to build those in Core C#. For now, notice the smell: **three or four parameters is comfortable, beyond that ask why**.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Value type vs reference type, passed to a method',
      code: `int number = 5;
var list = new List<int> { 1, 2 };

Bump(number);
AddItem(list);
Replace(list);

Console.WriteLine($"number = {number}");
Console.WriteLine($"list = {string.Join(",", list)}");

static void Bump(int n) { n++; }
static void AddItem(List<int> items) { items.Add(99); }
static void Replace(List<int> items) { items = new List<int> { 7, 8 }; }`,
      walkthrough: [
        { line: 'Bump(number);', note: 'The method got a copy of the number 5. Incrementing it changes only the copy.' },
        { line: 'AddItem(list);', note: 'The method got a copy of the **reference**, which still points at the caller\'s list. Adding to it is visible outside.' },
        { line: 'Replace(list);', note: 'Reassigning the parameter points the local copy at a brand-new list. The caller\'s variable is untouched, so `7, 8` is thrown away.' }
      ],
      output: 'number = 5\nlist = 1,2,99',
      takeaway: 'Mutating the object: visible. Reassigning the parameter: not visible. That single distinction explains most parameter-passing confusion.'
    },
    {
      id: 'ex2',
      title: 'out in the TryParse pattern',
      code: `string[] inputs = { "42", "nope" };

foreach (string input in inputs)
{
    if (TryDouble(input, out int doubled))
    {
        Console.WriteLine($"{input} -> {doubled}");
    }
    else
    {
        Console.WriteLine($"{input} -> could not parse");
    }
}

static bool TryDouble(string text, out int result)
{
    if (int.TryParse(text, out int value))
    {
        result = value * 2;
        return true;
    }

    result = 0;      // out parameters MUST be assigned on every path
    return false;
}`,
      walkthrough: [
        { line: 'out int doubled', note: 'Declared inline at the call site. No need to declare it on a separate line first.' },
        { line: 'result = 0;', note: 'Every path out of the method must assign an `out` parameter, including the failure path. The compiler enforces this.' }
      ],
      output: '42 -> 84\nnope -> could not parse',
      takeaway: 'The Try pattern - return a bool for success, hand the value back through `out` - is the idiomatic way to express "this might not work" without exceptions.'
    },
    {
      id: 'ex3',
      title: 'Named and optional arguments at the call site',
      code: `Console.WriteLine(Format("hello"));
Console.WriteLine(Format("hello", upper: true));
Console.WriteLine(Format("hello", prefix: ">> "));
Console.WriteLine(Format("hello", prefix: ">> ", upper: true));

static string Format(string text, string prefix = "", bool upper = false)
    => prefix + (upper ? text.ToUpper() : text);`,
      walkthrough: [
        { line: 'Format("hello", upper: true)', note: 'Naming the argument lets you skip `prefix` entirely and makes the intent obvious.' },
        { line: 'string prefix = "", bool upper = false', note: 'Optional parameters must follow all required parameters.' }
      ],
      output: 'hello\nHELLO\n>> hello\n>> HELLO',
      takeaway: 'Named arguments turn a call full of anonymous `true, false, null` into something readable without opening the method.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:parameters#g1',
      type: 'predict-output', level: 2, difficulty: 'Medium',
      prompt: 'What does this print?',
      code: `int x = 5;
Change(x);
Console.WriteLine(x);

static void Change(int n) { n = 100; }`,
      accept: ['5'],
      hints: [
        '`int` is a value type. What does the method receive?',
        'It receives a copy. Changing the copy cannot affect the original.'
      ],
      explanation: 'Value types are passed by value, so the method works on a copy. Add `ref` to the parameter and the call and it would print 100.',
      solution: '5'
    },
    {
      id: 'fundamentals:parameters#g2',
      type: 'mcq', level: 2, difficulty: 'Medium',
      prompt: 'Why does `int.TryParse` use an `out` parameter rather than returning the number?',
      options: [
        'Because it is faster',
        'Because it needs to return two things: whether it worked, and the value',
        'Because `int` cannot be returned from a method',
        'Because out parameters are required for all parsing'
      ],
      answer: 1,
      hints: [
        'A method can only return one thing directly.',
        'What two pieces of information does the caller need after a parse attempt?'
      ],
      explanation: 'It needs to communicate success and supply the value. The `bool` return carries the first, the `out` parameter the second.',
      solution: 'It needs to return two things'
    },
    {
      id: 'fundamentals:parameters#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Write a `Sum` method using `params` so it can be called with any number of integers.\n\nCall it with no arguments, with `(5)`, and with `(1, 2, 3, 4)`.\n\nPrint exactly:\n\n```\n0\n5\n10\n```',
      starterCode: `Console.WriteLine(Sum());
Console.WriteLine(Sum(5));
Console.WriteLine(Sum(1, 2, 3, 4));

// Write Sum here
`,
      expectedConcepts: ['params'],
      checks: [
        { kind: 'regex', value: 'params\\s+int\\[\\]', message: 'Uses a params int[] parameter' },
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Loops over the values' }
      ],
      run: { expectedOutput: '0\n5\n10' },
      hints: [
        'The declaration is `static int Sum(params int[] numbers)`.',
        'Inside, treat `numbers` as an ordinary array.',
        'With no arguments the array is empty, so the loop runs zero times and the total stays 0.'
      ],
      solution: `Console.WriteLine(Sum());
Console.WriteLine(Sum(5));
Console.WriteLine(Sum(1, 2, 3, 4));

static int Sum(params int[] numbers)
{
    int total = 0;
    foreach (int n in numbers) total += n;
    return total;
}`,
      explanation: 'The caller never has to build an array. `params` is how `Console.WriteLine` accepts any number of format arguments.'
    },
    {
      id: 'fundamentals:parameters#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write a `Swap` method using `ref` that exchanges two integers, and prove it works.\n\nPrint exactly:\n\n```\nBefore: 3 8\nAfter: 8 3\n```',
      starterCode: `int a = 3;
int b = 8;

Console.WriteLine($"Before: {a} {b}");

// Call Swap here

Console.WriteLine($"After: {a} {b}");

// Write Swap here
`,
      expectedConcepts: ['ref'],
      checks: [
        { kind: 'regex', value: 'ref\\s+int', message: 'Declares ref parameters' },
        { kind: 'regex', value: 'Swap\\(\\s*ref', message: 'Uses ref at the call site too' }
      ],
      run: { expectedOutput: 'Before: 3 8\nAfter: 8 3' },
      hints: [
        'The declaration is `static void Swap(ref int x, ref int y)`.',
        '`ref` is required at the call site as well: `Swap(ref a, ref b);`',
        'Inside, you still need a temporary variable to avoid losing one of the values.'
      ],
      solution: `int a = 3;
int b = 8;

Console.WriteLine($"Before: {a} {b}");

Swap(ref a, ref b);

Console.WriteLine($"After: {a} {b}");

static void Swap(ref int x, ref int y)
{
    int temp = x;
    x = y;
    y = temp;
}`,
      explanation: 'Requiring `ref` at the call site is a deliberate design choice: a reader can see that `a` and `b` may change without opening `Swap`.'
    },
    {
      id: 'fundamentals:parameters#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write `TryDivide(int a, int b, out int result)` that returns false when `b` is zero instead of throwing.\n\nTest it with (10, 2), (7, 0) and (9, 3).\n\nPrint exactly:\n\n```\n10 / 2 = 5\n7 / 0 failed\n9 / 3 = 3\n```',
      starterCode: ``,
      expectedConcepts: ['out'],
      checks: [
        { kind: 'regex', value: 'out\\s+int\\s+result', message: 'Uses an out parameter' },
        { kind: 'regex', value: 'return\\s+false', message: 'Returns false on failure' },
        { kind: 'notContains', value: 'throw', message: 'Does not throw' }
      ],
      run: { expectedOutput: '10 / 2 = 5\n7 / 0 failed\n9 / 3 = 3' },
      hints: [
        'Follow the shape of `int.TryParse`: return a bool, hand the answer back through `out`.',
        'Assign `result = 0;` before returning false - the compiler requires every path to assign it.',
        'At the call site: `if (TryDivide(a, b, out int answer))`.'
      ],
      solution: `int[] tops = { 10, 7, 9 };
int[] bottoms = { 2, 0, 3 };

for (int i = 0; i < tops.Length; i++)
{
    if (TryDivide(tops[i], bottoms[i], out int result))
    {
        Console.WriteLine($"{tops[i]} / {bottoms[i]} = {result}");
    }
    else
    {
        Console.WriteLine($"{tops[i]} / {bottoms[i]} failed");
    }
}

static bool TryDivide(int a, int b, out int result)
{
    if (b == 0)
    {
        result = 0;
        return false;
    }

    result = a / b;
    return true;
}`,
      explanation: 'The Try pattern turns an expected failure into an ordinary branch. Dividing by zero is a normal thing for user data to attempt, so an exception would be the wrong tool.'
    },
    {
      id: 'fundamentals:parameters#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain why passing a `List<int>` to a method and calling `Add` on it changes the caller\'s list, but assigning a new list to the parameter does not.',
      expectedConcepts: ['reference', 'copy', 'same object', 'reassign|new'],
      minLength: 130,
      hints: [
        'What exactly does the method receive - the list, or something that points at it?',
        'What does `Add` operate on? What does `=` operate on?',
        'Draw two boxes and an arrow.'
      ],
      solution: 'The method receives a copy of the reference, not a copy of the list. Because that copy still points at the same object, calling `Add` reaches the caller\'s list and the change is visible. Assigning a new list to the parameter only repoints the method\'s own copy of the reference at a different object; the caller\'s variable still points at the original, so it sees nothing.',
      explanation: 'This is the single most useful mental model for parameter passing: the reference is copied, the object is not.'
    },
    {
      id: 'fundamentals:parameters#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This does not compile. Work out why, explain it, then fix it.',
      brokenCode: `int value = 10;
Triple(value);
Console.WriteLine(value);

static void Triple(ref int n)
{
    n *= 3;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The `ref` keyword is missing at the call site',
            '`ref` cannot be used with `int`',
            'The method should return a value',
            '`value` is a reserved word'
          ],
          answer: 0,
          label: 'Identified the missing ref at the call site'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does C# require `ref` at the call site as well as the declaration?',
          accept: ['so the reader can see the variable may change'],
          acceptContains: ['call site'],
          label: 'Explained the design decision'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `30`.',
          starterCode: `int value = 10;
Triple(value);
Console.WriteLine(value);

static void Triple(ref int n)
{
    n *= 3;
}`,
          checks: [
            { kind: 'regex', value: 'Triple\\(\\s*ref\\s+value', message: 'Passes ref at the call site' }
          ],
          run: { expectedOutput: '30' },
          label: 'Fixed the call'
        }
      ],
      hints: [],
      solution: `int value = 10;
Triple(ref value);
Console.WriteLine(value);

static void Triple(ref int n)
{
    n *= 3;
}`,
      explanation: 'C# insists on `ref` at both ends so that a reader scanning the calling code can see which variables a method may modify, without having to open every method it calls.'
    },
    {
      id: 'fundamentals:parameters#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This method is supposed to leave the caller\'s list alone. It does not.',
      brokenCode: `var scores = new List<int> { 5, 3, 9, 1 };

var top = TopTwo(scores);

Console.WriteLine(string.Join(",", scores));

static List<int> TopTwo(List<int> values)
{
    values.Sort();
    values.Reverse();
    return values.GetRange(0, 2);
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The method sorts the caller\'s list in place, a hidden side effect',
            '`GetRange` is not a valid method',
            'The list should be passed with `ref`',
            'The return type should be `int[]`'
          ],
          answer: 0,
          label: 'Spotted the hidden mutation'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why can the method modify the caller\'s list without `ref`?',
          accept: ['it is a reference type'],
          acceptContains: ['reference'],
          label: 'Explained reference semantics'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the original list still prints as `5,3,9,1`.',
          starterCode: `var scores = new List<int> { 5, 3, 9, 1 };

var top = TopTwo(scores);

Console.WriteLine(string.Join(",", scores));

static List<int> TopTwo(List<int> values)
{
    values.Sort();
    values.Reverse();
    return values.GetRange(0, 2);
}`,
          checks: [
            { kind: 'regex', value: 'new List<int>\\(values\\)|ToList\\(\\)|ToArray\\(\\)', message: 'Copies before sorting' }
          ],
          run: { expectedOutput: '5,3,9,1' },
          label: 'Removed the side effect'
        }
      ],
      hints: [],
      solution: `var scores = new List<int> { 5, 3, 9, 1 };

var top = TopTwo(scores);

Console.WriteLine(string.Join(",", scores));

static List<int> TopTwo(List<int> values)
{
    var copy = new List<int>(values);
    copy.Sort();
    copy.Reverse();
    return copy.GetRange(0, 2);
}`,
      explanation: 'A method that quietly reorders its caller\'s data is one of the hardest bugs to find, because the damage shows up somewhere completely different. If a method is not named as a mutator, it should not mutate.'
    },
    {
      id: 'fundamentals:parameters#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: a report formatter with sensible defaults.\n\nWrite `Format(string title, int width = 20, char fill = \'.\', bool upper = false)` that returns the title padded on the right to `width` using `fill`, uppercased when asked.\n\nCall it four ways and print exactly:\n\n```\nsales...............\nSALES...............\nsales++++++++++\nSales Report--------------------\n```\n\nThe calls are: `("sales")`, `("sales", upper: true)`, `("sales", 15, \'+\')`, and `("Sales Report", 32, \'-\')`.',
      starterCode: ``,
      expectedConcepts: ['optional parameters', 'named arguments'],
      checks: [
        { kind: 'regex', value: 'int\\s+width\\s*=\\s*20', message: 'width defaults to 20' },
        { kind: 'regex', value: "char\\s+fill\\s*=", message: 'fill has a default' },
        { kind: 'regex', value: 'upper:\\s*true', message: 'Uses a named argument at a call site' },
        { kind: 'regex', value: 'PadRight', message: 'Uses PadRight' }
      ],
      run: { expectedOutput: 'sales...............\nSALES...............\nsales++++++++++\nSales Report--------------------' },
      hints: [
        'Optional parameters must come after required ones - `title` stays first.',
        '`text.PadRight(width, fill)` does the padding for you.',
        'Apply the uppercase transformation before padding, so the width still comes out right.'
      ],
      solution: `Console.WriteLine(Format("sales"));
Console.WriteLine(Format("sales", upper: true));
Console.WriteLine(Format("sales", 15, '+'));
Console.WriteLine(Format("Sales Report", 32, '-'));

static string Format(string title, int width = 20, char fill = '.', bool upper = false)
{
    string text = upper ? title.ToUpper() : title;
    return text.PadRight(width, fill);
}`,
      explanation: 'Four different behaviours from one method, and each call site says exactly what it wants. Without named arguments the second call would have needed `Format("sales", 20, \'.\', true)` - repeating two defaults just to reach the fourth.'
    },
    {
      id: 'fundamentals:parameters#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Statistics with out parameters',
      prompt: 'No hints.\n\nWrite `Analyse(int[] values, out int min, out int max, out double mean)` that returns `false` for an empty array (with all outputs zeroed) and `true` otherwise.\n\nTest it with `{ 4, 9, 2, 7 }` and with an empty array.\n\nPrint exactly:\n\n```\nmin 2 max 9 mean 5.50\nempty\n```',
      starterCode: ``,
      expectedConcepts: ['out'],
      checks: [
        { kind: 'regex', value: 'out\\s+int\\s+min', message: 'Declares the out parameters' },
        { kind: 'regex', value: 'out\\s+double\\s+mean', message: 'Returns the mean via out' },
        { kind: 'regex', value: 'return\\s+false', message: 'Handles the empty case' },
        { kind: 'regex', value: '\\(double\\)|1\\.0', message: 'Avoids integer division for the mean' }
      ],
      run: { expectedOutput: 'min 2 max 9 mean 5.50\nempty' },
      hints: [],
      solution: `int[] data = { 4, 9, 2, 7 };
int[] empty = Array.Empty<int>();

Report(data);
Report(empty);

static void Report(int[] values)
{
    if (Analyse(values, out int min, out int max, out double mean))
    {
        Console.WriteLine($"min {min} max {max} mean {mean:F2}");
    }
    else
    {
        Console.WriteLine("empty");
    }
}

static bool Analyse(int[] values, out int min, out int max, out double mean)
{
    min = 0;
    max = 0;
    mean = 0;

    if (values.Length == 0) return false;

    min = values[0];
    max = values[0];
    int total = 0;

    foreach (int v in values)
    {
        if (v < min) min = v;
        if (v > max) max = v;
        total += v;
    }

    mean = (double)total / values.Length;
    return true;
}`,
      explanation: 'Assigning all three outputs at the top means the empty-array path satisfies the compiler with one line instead of three. Note that four outputs from one method is right at the limit of what `out` should be asked to do - a small result type would be cleaner, which is exactly what you will build in Core C#.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:parameters#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var list = new List<int> { 1 };
Mutate(list);
Console.WriteLine(list.Count);

static void Mutate(List<int> items) { items.Add(2); }`,
      accept: ['2'],
      explanation: 'The reference was copied but it still points at the same list, so `Add` is visible to the caller.'
    },
    {
      id: 'fundamentals:parameters#q2', type: 'mcq',
      prompt: 'What is the difference between `ref` and `out`?',
      options: [
        'None, they are aliases',
        '`ref` requires the variable to be initialised first; `out` requires the method to assign it',
        '`out` is faster',
        '`ref` only works with value types'
      ],
      answer: 1,
      explanation: '`ref` means "I am passing you something that already has a value and you may change it". `out` means "I am giving you somewhere to put a result, and you must".'
    },
    {
      id: 'fundamentals:parameters#q3', type: 'explain',
      prompt: 'A method takes nine parameters. Explain why that is a problem and what you would do about it.',
      expectedConcepts: ['read|remember|order|mistake', 'group|type|class|object|related'],
      minLength: 80,
      explanation: 'Long parameter lists are hard to read, easy to pass in the wrong order (especially several of the same type), and usually a sign that some parameters belong together. Grouping the related ones into a small type fixes all three problems at once.'
    },
    {
      id: 'fundamentals:parameters#q4', type: 'mcq',
      prompt: 'Where must a `params` parameter appear?',
      options: ['First', 'Last', 'Anywhere', 'It must be the only parameter'],
      answer: 1,
      explanation: '`params` must be last, because the compiler needs to know where the fixed arguments stop and the variable ones begin.'
    },
    {
      id: 'fundamentals:parameters#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `Console.WriteLine(Join("a", "b"));

static string Join(string first, string second = "X", string third = "Y")
    => first + second + third;`,
      accept: ['aby'],
      explanation: '`second` is supplied positionally as "b"; `third` falls back to its default "Y".'
    }
  ],
  commonMistakes: [
    { mistake: 'Expecting a method to change a value-type argument', why: 'It works for lists, so it feels like it should work for ints.', fix: 'Value types are copied. Use `ref`, or better, return the new value.' },
    { mistake: 'Reassigning a parameter and expecting the caller to see it', why: 'The object was shared, so the variable feels shared too.', fix: 'Only the object is shared. Reassigning the parameter repoints the local copy only.' },
    { mistake: 'Mutating a collection passed as an argument', why: 'It is easy and there is no compiler warning.', fix: 'Copy first unless mutating is the method\'s stated job. Hidden side effects are very hard to debug.' },
    { mistake: 'Using `ref`/`out` to return several values', why: 'It is the first tool you learn for the job.', fix: 'Return a tuple or a small type. Reserve `out` for the Try pattern.' },
    { mistake: 'Long lists of same-typed parameters', why: 'The method grew one requirement at a time.', fix: 'Group them into a type, or at least use named arguments at the call site so the order cannot silently go wrong.' }
  ],
  realWorld: [
    'Dependency injection in ASP.NET Core is entirely constructor parameters - a constructor with nine of them is the standard signal that a class does too much.',
    'The `Try` pattern with `out` appears throughout .NET: `int.TryParse`, `Dictionary.TryGetValue`, `Queue.TryDequeue`.',
    'Hidden mutation of a passed collection is a recurring source of production bugs in services that share cached lists.',
    'Named arguments are the standard fix for boolean-heavy APIs where `true, false, true` tells the reader nothing.'
  ],
  resources: [
    { label: 'Draw it', note: 'For the reference-type example, draw the two variables as boxes with arrows. Ten seconds of drawing beats twenty minutes of guessing.' }
  ]
},

/* ============================================================
   10. RETURN VALUES
   ============================================================ */
{
  topicId: 'fundamentals:return-values',
  title: 'Return Values',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 40,
  prerequisites: ['fundamentals:parameters'],
  objectives: [
    'Use return to exit a method and produce a value',
    'Choose between returning a value, a tuple, or a small type',
    'Explain why returning an empty collection is better than returning null',
    'Use early returns to keep methods flat and readable',
    'Recognise when a `void` method is hiding a result you should be returning'
  ],
  sections: [
    {
      id: 'basics',
      title: 'return does two things',
      blocks: [
        { type: 'text', text: '`return` immediately leaves the method, and - if the method has a return type - supplies the value the caller receives.' },
        { type: 'code', code: `static int Add(int a, int b)
{
    return a + b;        // produce a value and leave
    // Console.WriteLine("never runs");   // unreachable code warning
}

static void Log(string message)
{
    if (message == null) return;   // leave early, no value
    Console.WriteLine(message);
}` },
        { type: 'text', text: 'Every code path in a value-returning method must return something. The compiler checks this, which is why a missing `else` sometimes produces "not all code paths return a value".' }
      ]
    },
    {
      id: 'early',
      title: 'Early returns',
      blocks: [
        { type: 'code', caption: 'One exit, deeply nested', code: `static string Classify(int n)
{
    string result;
    if (n < 0) { result = "negative"; }
    else { if (n == 0) { result = "zero"; } else { result = "positive"; } }
    return result;
}` },
        { type: 'code', caption: 'Several exits, flat', code: `static string Classify(int n)
{
    if (n < 0) return "negative";
    if (n == 0) return "zero";
    return "positive";
}` },
        { type: 'text', text: 'The old advice of "one exit per method" comes from languages with manual memory management, where every exit had to release resources. In C# the garbage collector and `using` handle that, and multiple returns are clearer.' }
      ]
    },
    {
      id: 'multiple',
      title: 'Returning more than one thing',
      blocks: [
        { type: 'code', caption: 'Tuples - ideal for two or three related values', code: `static (int min, int max) FindRange(int[] values)
{
    int min = values[0], max = values[0];
    foreach (int v in values)
    {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return (min, max);
}

var range = FindRange(new[] { 4, 9, 2 });
Console.WriteLine($"{range.min} to {range.max}");

// Or deconstruct straight into variables:
var (low, high) = FindRange(new[] { 4, 9, 2 });` },
        { type: 'text', text: 'Naming the tuple elements - `(int min, int max)` rather than `(int, int)` - is what makes this readable at the call site. An unnamed tuple gives you `Item1` and `Item2`, which tells the reader nothing.' },
        { type: 'whenNot', text: 'Beyond three values, or when the group has meaning beyond this one method, define a real type instead. Tuples are for convenience, not for modelling your domain.' }
      ]
    },
    {
      id: 'null',
      title: 'Never return null for a collection',
      blocks: [
        { type: 'code', caption: 'Forces every caller to defend', code: `static List<string>? FindMatches(string term)
{
    if (string.IsNullOrEmpty(term)) return null;     // don't
    // ...
}

// Every single caller now needs this:
var results = FindMatches(term);
if (results != null) { foreach (var r in results) { } }` },
        { type: 'code', caption: 'Returns something usable', code: `static List<string> FindMatches(string term)
{
    if (string.IsNullOrEmpty(term)) return new List<string>();
    // ...
}

// Callers just work:
foreach (var r in FindMatches(term)) { }` },
        { type: 'text', text: 'An empty collection means "no results", which is exactly what the caller needs to know. Null means "no results, and also you must now write a null check", which is strictly worse.' },
        { type: 'note', text: 'Returning null for a single object is different and often reasonable - `FindCustomer` returning `Customer?` is honest. The Try pattern, returning `bool` with an `out`, is another good option.' }
      ]
    },
    {
      id: 'void',
      title: 'When void is hiding something',
      blocks: [
        { type: 'code', code: `// Hard to test - you have to inspect a field or a log to know what happened
static void ProcessOrder(Order order) { /* ... */ }

// Easy to test - the outcome is the return value
static ProcessResult ProcessOrder(Order order) { /* ... */ }` },
        { type: 'text', text: 'A `void` method communicates only through side effects. That is fine for genuine actions like `Console.WriteLine` or `Save`, but if the caller needs to know whether it worked, returning that information is far easier to test and to reason about.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Early returns making the rules readable',
      code: `int[] values = { -5, 0, 42 };

foreach (int v in values)
{
    Console.WriteLine($"{v}: {Classify(v)}");
}

static string Classify(int n)
{
    if (n < 0) return "negative";
    if (n == 0) return "zero";
    return "positive";
}`,
      walkthrough: [
        { line: 'if (n < 0) return "negative";', note: 'Each rule is one line and leaves immediately. No temporary variable, no nesting.' },
        { line: 'return "positive";', note: 'The final unconditional return is what satisfies the compiler that every path produces a value.' }
      ],
      output: '-5: negative\n0: zero\n42: positive',
      takeaway: 'Three returns, three rules, three lines. Try writing it with one exit point and compare.'
    },
    {
      id: 'ex2',
      title: 'Returning two values with a named tuple',
      code: `var (min, max) = FindRange(new[] { 12, 3, 45, 7 });
Console.WriteLine($"Range: {min} to {max}");

var stats = FindRange(new[] { 5, 5, 5 });
Console.WriteLine($"Named access: {stats.min}, {stats.max}");

static (int min, int max) FindRange(int[] values)
{
    int min = values[0];
    int max = values[0];

    foreach (int v in values)
    {
        if (v < min) min = v;
        if (v > max) max = v;
    }

    return (min, max);
}`,
      walkthrough: [
        { line: 'var (min, max) = FindRange(...)', note: 'Deconstruction pulls the tuple straight into two named variables.' },
        { line: 'static (int min, int max) FindRange(...)', note: 'Naming the elements in the return type is what makes `stats.min` possible instead of `stats.Item1`.' }
      ],
      output: 'Range: 3 to 45\nNamed access: 5, 5',
      takeaway: 'Named tuples are the right tool when two values genuinely belong together and only for this one call.'
    },
    {
      id: 'ex3',
      title: 'Empty collection instead of null',
      code: `PrintAll(Search("a"));
PrintAll(Search(""));

static List<string> Search(string term)
{
    if (string.IsNullOrWhiteSpace(term))
    {
        return new List<string>();     // not null
    }

    return new List<string> { term + "pple", term + "pricot" };
}

static void PrintAll(List<string> items)
{
    Console.WriteLine($"{items.Count} result(s)");
    foreach (string item in items) Console.WriteLine("  " + item);
}`,
      walkthrough: [
        { line: 'return new List<string>();', note: 'An empty list. The caller\'s `foreach` runs zero times, which is exactly right.' },
        { line: 'foreach (string item in items)', note: 'No null check needed anywhere. Had `Search` returned null, this line would throw.' }
      ],
      output: '2 result(s)\n  apple\n  apricot\n0 result(s)',
      takeaway: 'Returning an empty collection removes a null check from every caller, forever.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:return-values#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'A search method finds nothing. What should it return?',
      options: [
        '`null`',
        'An empty collection',
        'A collection containing one empty string',
        'It should throw an exception'
      ],
      answer: 1,
      hints: [
        'Think about what every caller will have to write if it returns null.',
        '"No results" is a perfectly normal outcome, not an error.'
      ],
      explanation: 'An empty collection is usable immediately. Null forces a check on every caller and throws if anyone forgets.',
      solution: 'An empty collection'
    },
    {
      id: 'fundamentals:return-values#g2',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `Console.WriteLine(Test(5));

static string Test(int n)
{
    if (n > 0) return "positive";
    return "not positive";
}`,
      accept: ['positive'],
      hints: [
        '`return` leaves the method immediately.',
        'Once the first return runs, the line below it never executes.'
      ],
      explanation: 'The first `return` exits the method, so the second is never reached for a positive input.',
      solution: 'positive'
    },
    {
      id: 'fundamentals:return-values#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Write `Classify(int)` that returns `"negative"`, `"zero"` or `"positive"` using early returns, and call it for -3, 0 and 8.\n\nPrint exactly:\n\n```\nnegative\nzero\npositive\n```',
      starterCode: `Console.WriteLine(Classify(-3));
Console.WriteLine(Classify(0));
Console.WriteLine(Classify(8));

// Write Classify here
`,
      expectedConcepts: ['return'],
      checks: [
        { kind: 'regex', value: 'static\\s+string\\s+Classify', message: 'Declares Classify returning string' },
        { kind: 'regex', value: '(return[\\s\\S]*){3}', message: 'Uses multiple returns' }
      ],
      run: { expectedOutput: 'negative\nzero\npositive' },
      hints: [
        'Handle the negative case first and return straight away.',
        'Then handle zero.',
        'The last line can be an unconditional `return "positive";` - anything reaching it must be positive.'
      ],
      solution: `Console.WriteLine(Classify(-3));
Console.WriteLine(Classify(0));
Console.WriteLine(Classify(8));

static string Classify(int n)
{
    if (n < 0) return "negative";
    if (n == 0) return "zero";
    return "positive";
}`,
      explanation: 'The final return needs no condition, because the two earlier returns have already eliminated every other case.'
    },
    {
      id: 'fundamentals:return-values#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write `Stats(int[])` that returns a named tuple `(int sum, double average, int count)`, and print the results for `{ 4, 8, 15, 16 }`.\n\nPrint exactly:\n\n```\nSum: 43\nAverage: 10.75\nCount: 4\n```',
      starterCode: ``,
      expectedConcepts: ['tuple'],
      checks: [
        { kind: 'regex', value: '\\(\\s*int\\s+sum\\s*,', message: 'Returns a named tuple' },
        { kind: 'regex', value: 'double\\s+average', message: 'Includes a named average element' },
        { kind: 'regex', value: '\\(double\\)|1\\.0', message: 'Avoids integer division' }
      ],
      run: { expectedOutput: 'Sum: 43\nAverage: 10.75\nCount: 4' },
      hints: [
        'The return type goes in brackets: `static (int sum, double average, int count) Stats(int[] values)`.',
        'Return with `return (total, mean, values.Length);`.',
        'Remember the cast when calculating the average, or you will get 10 instead of 10.75.'
      ],
      solution: `var result = Stats(new[] { 4, 8, 15, 16 });

Console.WriteLine($"Sum: {result.sum}");
Console.WriteLine($"Average: {result.average}");
Console.WriteLine($"Count: {result.count}");

static (int sum, double average, int count) Stats(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;

    return (total, (double)total / values.Length, values.Length);
}`,
      explanation: 'Naming the tuple elements gives you `result.sum` at the call site rather than `result.Item1`. Three related values returned from one pass over the data.'
    },
    {
      id: 'fundamentals:return-values#i2',
      type: 'refactor', level: 3, difficulty: 'Medium',
      prompt: 'Refactor this to use early returns and to return an empty list rather than null. Behaviour must otherwise stay the same.\n\nCall `Find` with `"ap"` and then with `""`, printing the count each time.',
      starterCode: `Console.WriteLine(Describe(Find("ap")));
Console.WriteLine(Describe(Find("")));

static List<string>? Find(string term)
{
    List<string>? result;

    if (string.IsNullOrWhiteSpace(term))
    {
        result = null;
    }
    else
    {
        result = new List<string> { term + "ple", term + "ricot" };
    }

    return result;
}

static string Describe(List<string>? items)
{
    if (items == null) return "0 results";
    return items.Count + " results";
}`,
      expectedConcepts: ['early return', 'empty collection'],
      checks: [
        { kind: 'regex', value: 'new List<string>\\(\\)', message: 'Returns an empty list instead of null' },
        { kind: 'notContains', value: 'result = null', message: 'No longer returns null' },
        { kind: 'notContains', value: 'List<string>? Find', message: 'The return type is no longer nullable' }
      ],
      run: { expectedOutput: '2 results\n0 results' },
      hints: [
        'Invert the condition and return the empty list immediately.',
        'Once `Find` cannot return null, `Describe` no longer needs a null check or a nullable parameter.',
        'The temporary `result` variable disappears entirely.'
      ],
      solution: `Console.WriteLine(Describe(Find("ap")));
Console.WriteLine(Describe(Find("")));

static List<string> Find(string term)
{
    if (string.IsNullOrWhiteSpace(term)) return new List<string>();

    return new List<string> { term + "ple", term + "ricot" };
}

static string Describe(List<string> items) => items.Count + " results";`,
      explanation: 'Removing the null possibility shrank both methods. `Describe` went from three lines with a defensive check to a single expression - that simplification ripples out to every caller.'
    },
    {
      id: 'fundamentals:return-values#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain why returning an empty collection is usually better than returning null, and give one case where returning null (or a nullable type) is still the right choice.',
      expectedConcepts: ['null check|defensive|every caller', 'empty|iterate|foreach', 'single|one object|not found'],
      minLength: 130,
      hints: [
        'Count how many places have to change if a method starts returning null.',
        'What happens to a `foreach` over an empty list versus over null?',
        'Is "no customer with that id" the same kind of answer as "no results"?'
      ],
      solution: 'An empty collection can be iterated, counted and passed on without any special handling, so every caller is simpler and nobody can forget a null check. Null adds no information beyond "empty" but does add a crash risk at every call site. Returning null is still reasonable for a single object - a `FindCustomer` that legitimately may not find one is honest as `Customer?`, because there is no meaningful "empty customer" to hand back.',
      explanation: 'The underlying rule: null should mean "there is genuinely no such thing", never "there are zero things".'
    },
    {
      id: 'fundamentals:return-values#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This does not compile. Work out why, explain it, then fix it.',
      brokenCode: `Console.WriteLine(Grade(85));

static string Grade(int score)
{
    if (score >= 90) return "A";
    else if (score >= 80) return "B";
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'Not all code paths return a value',
            '`else if` cannot follow a return',
            'The method should be `void`',
            'The score parameter needs a default'
          ],
          answer: 0,
          label: 'Identified the missing path'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What would the method return if `score` were 50?',
          accept: ['nothing'],
          acceptContains: ['nothing'],
          label: 'Explained the gap'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so `Grade(85)` prints `B` and every other score is handled.',
          starterCode: `Console.WriteLine(Grade(85));

static string Grade(int score)
{
    if (score >= 90) return "A";
    else if (score >= 80) return "B";
}`,
          checks: [
            { kind: 'regex', value: 'return[\\s\\S]*return[\\s\\S]*return', message: 'Covers every path with a return' }
          ],
          run: { expectedOutput: 'B' },
          label: 'Covered every path'
        }
      ],
      hints: [],
      solution: `Console.WriteLine(Grade(85));

static string Grade(int score)
{
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    return "Fail";
}`,
      explanation: 'The compiler traces every route through the method and refuses to build one that could reach the closing brace without returning. A final unconditional `return` is the usual fix.'
    },
    {
      id: 'fundamentals:return-values#d2',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This compiles and runs, but the caller never sees the result. Find out why.',
      brokenCode: `int[] prices = { 10, 20, 30 };
int total = 0;

CalculateTotal(prices, total);

Console.WriteLine(total);

static void CalculateTotal(int[] values, int total)
{
    foreach (int v in values) total += v;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The method mutates a copy of `total` and returns nothing',
            'The array is passed by value so the loop sees nothing',
            '`foreach` cannot be used with `int[]`',
            '`total` should be a `long`'
          ],
          answer: 0,
          label: 'Identified the discarded result'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What is the better fix: `ref`, or returning the value?',
          accept: ['returning the value'],
          acceptContains: ['return'],
          label: 'Chose the better design'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it by returning the total. The program should print `60`.',
          starterCode: `int[] prices = { 10, 20, 30 };
int total = 0;

CalculateTotal(prices, total);

Console.WriteLine(total);

static void CalculateTotal(int[] values, int total)
{
    foreach (int v in values) total += v;
}`,
          checks: [
            { kind: 'regex', value: 'static\\s+int\\s+CalculateTotal', message: 'Returns an int' },
            { kind: 'regex', value: 'total\\s*=\\s*CalculateTotal', message: 'Captures the returned value' }
          ],
          run: { expectedOutput: '60' },
          label: 'Returned the result'
        }
      ],
      hints: [],
      solution: `int[] prices = { 10, 20, 30 };

int total = CalculateTotal(prices);

Console.WriteLine(total);

static int CalculateTotal(int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;
    return total;
}`,
      explanation: '`ref int total` would also work, but returning the value is better: the method becomes a pure calculation that is trivial to test, and the call site reads as an assignment rather than a hidden side effect.'
    },
    {
      id: 'fundamentals:return-values#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: a validation method that reports both the outcome and the reason.\n\nWrite `Validate(string password)` returning `(bool ok, string reason)`. Rules, in order: not blank (`"empty"`), at least 8 characters (`"too short"`), must contain a digit (`"no digit"`). Otherwise `(true, "ok")`.\n\nTest with `""`, `"short1"`, `"passwordx"` and `"password1"`.\n\nPrint exactly:\n\n```\nFalse empty\nFalse too short\nFalse no digit\nTrue ok\n```',
      starterCode: ``,
      expectedConcepts: ['tuple', 'early return'],
      checks: [
        { kind: 'regex', value: '\\(\\s*bool\\s+ok\\s*,', message: 'Returns a named tuple' },
        { kind: 'regex', value: 'IsNullOrWhiteSpace', message: 'Checks for blank safely' },
        { kind: 'regex', value: 'char\\.IsDigit|Any\\(', message: 'Checks for a digit' }
      ],
      run: { expectedOutput: 'False empty\nFalse too short\nFalse no digit\nTrue ok' },
      hints: [
        'Each rule becomes one guard clause that returns immediately.',
        'For the digit check, loop the characters with `char.IsDigit(c)`.',
        'Print with `Console.WriteLine($"{result.ok} {result.reason}");`'
      ],
      solution: `string[] tests = { "", "short1", "passwordx", "password1" };

foreach (string test in tests)
{
    var result = Validate(test);
    Console.WriteLine($"{result.ok} {result.reason}");
}

static (bool ok, string reason) Validate(string password)
{
    if (string.IsNullOrWhiteSpace(password)) return (false, "empty");
    if (password.Length < 8) return (false, "too short");

    bool hasDigit = false;
    foreach (char c in password)
    {
        if (char.IsDigit(c)) { hasDigit = true; break; }
    }

    if (!hasDigit) return (false, "no digit");

    return (true, "ok");
}`,
      explanation: 'Returning the reason alongside the outcome is what lets the caller show a useful message. A bare `bool` would force the caller to guess, or force you to re-run the rules to find out which one failed.'
    },
    {
      id: 'fundamentals:return-values#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Parse a duration',
      prompt: 'No hints.\n\nWrite `TryParseDuration(string text, out int totalSeconds)` that accepts `"1h30m"`, `"45m"`, `"2h"` and `"90s"` and converts them to seconds. Anything else returns false.\n\nTest with `"1h30m"`, `"45m"`, `"2h"`, `"90s"` and `"abc"`.\n\nPrint exactly:\n\n```\n1h30m = 5400\n45m = 2700\n2h = 7200\n90s = 90\nabc = invalid\n```',
      starterCode: ``,
      expectedConcepts: ['out', 'parsing'],
      checks: [
        { kind: 'regex', value: 'out\\s+int\\s+totalSeconds', message: 'Uses an out parameter' },
        { kind: 'regex', value: 'return\\s+false', message: 'Reports failure' },
        { kind: 'notContains', value: 'throw', message: 'Does not throw on bad input' }
      ],
      run: { expectedOutput: '1h30m = 5400\n45m = 2700\n2h = 7200\n90s = 90\nabc = invalid' },
      hints: [],
      solution: `string[] inputs = { "1h30m", "45m", "2h", "90s", "abc" };

foreach (string input in inputs)
{
    if (TryParseDuration(input, out int seconds))
    {
        Console.WriteLine($"{input} = {seconds}");
    }
    else
    {
        Console.WriteLine($"{input} = invalid");
    }
}

static bool TryParseDuration(string text, out int totalSeconds)
{
    totalSeconds = 0;

    if (string.IsNullOrWhiteSpace(text)) return false;

    int number = 0;
    bool sawDigit = false;
    bool sawUnit = false;

    foreach (char c in text)
    {
        if (char.IsDigit(c))
        {
            number = number * 10 + (c - '0');
            sawDigit = true;
            continue;
        }

        if (!sawDigit) return false;

        int multiplier = c switch
        {
            'h' => 3600,
            'm' => 60,
            's' => 1,
            _ => 0
        };

        if (multiplier == 0) return false;

        totalSeconds += number * multiplier;
        number = 0;
        sawDigit = false;
        sawUnit = true;
    }

    return sawUnit && !sawDigit;
}`,
      explanation: 'The `c - \'0\'` trick converts a digit character to its numeric value by subtracting the character code of zero. The final `sawUnit && !sawDigit` check rejects both `"abc"` and a trailing number with no unit like `"1h30"`.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:return-values#q1', type: 'mcq',
      prompt: 'What does the compiler error "not all code paths return a value" mean?',
      options: [
        'The method has too many returns',
        'There is a route through the method that reaches the end without returning',
        'The return type is wrong',
        'A return statement is unreachable'
      ],
      answer: 1,
      explanation: 'The compiler traces every branch. If any route can fall off the end of a value-returning method, it refuses to build.'
    },
    {
      id: 'fundamentals:return-values#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var r = Pair();
Console.WriteLine($"{r.a}-{r.b}");

static (int a, int b) Pair() => (1, 2);`,
      accept: ['1-2'],
      explanation: 'Named tuple elements are accessed by name at the call site.'
    },
    {
      id: 'fundamentals:return-values#q3', type: 'explain',
      prompt: 'Why is "one return statement per method" outdated advice in C#?',
      expectedConcepts: ['garbage|cleanup|resource|using|dispose', 'nest|read|flat|clear'],
      minLength: 80,
      explanation: 'It came from languages where every exit had to free resources manually, so a single exit point reduced leaks. C# has garbage collection and `using`, so the risk is gone - and forcing one exit usually means extra nesting and a temporary variable, which reads worse.'
    },
    {
      id: 'fundamentals:return-values#q4', type: 'mcq',
      prompt: 'When is returning `null` acceptable?',
      options: [
        'Never',
        'For a collection with no items',
        'For a single object that genuinely may not exist',
        'Whenever an error occurs'
      ],
      answer: 2,
      explanation: '"No such customer" is meaningfully null. "Zero results" is an empty collection, not null.'
    },
    {
      id: 'fundamentals:return-values#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `Console.WriteLine(First(new[] { 3, 4 }));

static int First(int[] values)
{
    foreach (int v in values) return v;
    return -1;
}`,
      accept: ['3'],
      explanation: '`return` inside a loop exits the whole method on the first iteration, not just the loop.'
    }
  ],
  commonMistakes: [
    { mistake: 'Returning null for an empty collection', why: 'Null feels like "nothing".', fix: 'Return an empty collection. Null forces a check on every caller and buys nothing.' },
    { mistake: 'Forgetting that a path can fall off the end', why: 'The missing case is usually an `else` that seemed obvious.', fix: 'Add a final unconditional return, or a `default`/discard arm in a switch expression.' },
    { mistake: 'Using `void` plus a side effect where a return value belongs', why: 'It matches the order the work happens in.', fix: 'Return the outcome. It is easier to test and the call site reads as an assignment.' },
    { mistake: 'Unnamed tuples', why: '`(int, int)` is quicker to type.', fix: 'Name the elements. `Item1` and `Item2` tell the reader nothing at the call site.' },
    { mistake: 'Calling a method and discarding its return value', why: 'It looks like the method did the work in place.', fix: 'Especially with strings and LINQ, the result *is* the work. Assign it.' }
  ],
  realWorld: [
    'Controller actions in ASP.NET Core return `IActionResult` - the return value is the entire HTTP response.',
    'The empty-collection rule is codified in the .NET framework design guidelines and enforced by most analysers.',
    'Tuples are used constantly in service methods that need to return a result plus a status, before they graduate into a proper result type.',
    '"Not all code paths return a value" is one of the most common compiler errors a C# beginner meets, and always means a missing branch.'
  ],
  resources: [
    { label: 'Audit your own methods', note: 'Find a `void` method you wrote that sets a field. Ask whether returning the value would make it testable.' }
  ]
}


]);
