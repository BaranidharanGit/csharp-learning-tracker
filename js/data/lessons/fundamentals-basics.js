/* ============================================================
   js/data/lessons/fundamentals-basics.js
   C# Fundamentals, part 1: Variables, Data Types, Type Conversion,
   Operators, Strings.

   Schema: see js/data/lessons/registry.js
   Text fields use single quotes so `inline code` markup works.
   Code fields use template literals so the C# keeps its line breaks.
   ============================================================ */
window.App = window.App || {};

App.registerLessons([

/* ============================================================
   1. VARIABLES
   ============================================================ */
{
  topicId: 'fundamentals:variables',
  title: 'Variables',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: [],
  objectives: [
    'Declare a variable with an explicit type and explain what the type buys you',
    'Choose a sensible name, and say why naming is a correctness issue, not a style issue',
    'Explain the difference between declaring, assigning and initialising',
    'Know when `var` helps readability and when it hurts it',
    'Predict what happens when you use a variable before assigning it'
  ],
  sections: [
    {
      id: 'what',
      title: 'What a variable actually is',
      blocks: [
        { type: 'text', text: 'A variable is a **named piece of memory** that holds one value of one type. Three things matter: its **type** (what kind of value it can hold), its **name** (how you refer to it), and its **value** (what is in it right now).' },
        { type: 'code', caption: 'Declaration, then assignment', code: `int score;        // declare: reserve space for an int called "score"
score = 42;       // assign: put a value in it
int lives = 3;    // declare and assign in one step (initialisation)` },
        { type: 'text', text: 'In C# the type comes **before** the name. Once a variable has a type, that type never changes. `score` will hold an `int` for its entire life - you cannot later put text in it.' },
        { type: 'analogy', text: 'Think of a labelled box in a warehouse. The label is the name, the size and shape of the box is the type, and whatever is inside is the value. You can swap the contents, but you cannot turn a shoebox into a filing cabinet.' }
      ]
    },
    {
      id: 'why',
      title: 'Why C# insists on a type',
      blocks: [
        { type: 'text', text: 'Languages like JavaScript or Python let a variable hold anything. C# does not, and that is deliberate.' },
        { type: 'list', items: [
          '**Errors move to compile time.** `int age = "thirty";` will not build. In an untyped language that mistake survives until a user hits it in production.',
          '**The compiler can optimise.** It knows an `int` is exactly 4 bytes, so it can generate fast machine code.',
          '**Your tools can help you.** Autocomplete, refactoring and "find all references" all work because the compiler knows what everything is.',
          '**The type documents your intent.** `decimal price` tells the next reader this is money, not a count.'
        ] },
        { type: 'note', text: 'This is the single biggest adjustment if you are coming from a dynamic language. The compiler arguing with you is the feature, not the friction.' }
      ]
    },
    {
      id: 'naming',
      title: 'Naming, and why it is a correctness issue',
      blocks: [
        { type: 'text', text: 'C# has firm conventions. Following them is not decoration - it is how another engineer reads your code quickly and correctly.' },
        { type: 'table', head: ['Thing', 'Convention', 'Example'], rows: [
          ['Local variable', 'camelCase', '`totalPrice`, `employeeCount`'],
          ['Method parameter', 'camelCase', '`firstName`'],
          ['Private field', '_camelCase', '`_connection`'],
          ['Constant', 'PascalCase', '`MaxRetries`'],
          ['Class, method, property', 'PascalCase', '`Employee`, `CalculateTax()`']
        ] },
        { type: 'text', text: 'Beyond casing: a name should say **what the value means**, not what type it is. `decimal d` tells you nothing. `decimal monthlySalary` tells you everything, including that it is per month - which prevents a whole class of bug where somebody divides by 12 twice.' },
        { type: 'warning', text: 'The worst names are the ones that are almost right. `data`, `temp`, `value`, `info`, `result` and `obj` all pass code review and all leave the next person guessing.' }
      ]
    },
    {
      id: 'var',
      title: 'var: when it helps and when it hurts',
      blocks: [
        { type: 'text', text: '`var` tells the compiler to work the type out from the right-hand side. It is still **statically typed** - `var` is not `dynamic`, and the type is still fixed at compile time.' },
        { type: 'code', code: `var count = 10;                       // the compiler knows: int
var name = "Barani";                  // the compiler knows: string
var employees = new List<Employee>(); // the compiler knows: List<Employee>

// var total;        // will not compile - nothing to infer from
// var x = null;     // will not compile - null has no type of its own` },
        { type: 'text', text: 'Use `var` when the type is already obvious from the line itself, especially when it removes noisy repetition like `Dictionary<string, List<int>> map = new Dictionary<string, List<int>>();`.' },
        { type: 'whenNot', text: 'Avoid `var` when the right-hand side is a method call whose return type you cannot guess. `var result = Process(input);` forces the reader to go and look up `Process`. Writing `Invoice result = Process(input);` costs you six characters and saves them a trip.' }
      ]
    },
    {
      id: 'lifecycle',
      title: 'Definite assignment: C# will not let you read rubbish',
      blocks: [
        { type: 'text', text: 'A local variable that has been declared but never assigned cannot be read. This is called **definite assignment**, and the compiler enforces it.' },
        { type: 'code', code: `int total;
Console.WriteLine(total);   // error CS0165: Use of unassigned local variable 'total'` },
        { type: 'text', text: 'In C and C++ that same code compiles and prints whatever happened to be in that memory - a genuinely nasty class of bug. C# removes it entirely.' },
        { type: 'note', text: 'Fields of a class are different: they get a default value automatically (`0`, `false`, `null`). Only **local variables** require definite assignment. You will meet fields properly in Core C#.' }
      ]
    },
    {
      id: 'const',
      title: 'Values that must not change',
      blocks: [
        { type: 'text', text: 'If a value should never change, say so. The compiler will then enforce it.' },
        { type: 'code', code: `const int MaxLoginAttempts = 3;
// MaxLoginAttempts = 5;   // error - cannot assign to a const

readonly DateTime _startedAt = DateTime.UtcNow;  // set once, at construction` },
        { type: 'text', text: '`const` is baked in at compile time and must be a literal. `readonly` is set once at runtime (usually in a constructor) and then frozen. Reach for `const` for genuine constants like `MaxRetries`; reach for `readonly` for things computed when the object is built.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'A small, realistic set of variables',
      code: `string employeeName = "Barani Dharan";
int age = 28;
decimal monthlySalary = 4500.75m;
bool isEmployed = true;
char grade = 'A';

Console.WriteLine($"{employeeName} is {age} and earns {monthlySalary:C} per month.");
Console.WriteLine($"Grade: {grade}, employed: {isEmployed}");`,
      walkthrough: [
        { line: 'string employeeName = "Barani Dharan";', note: 'Text always goes in double quotes. `string` is the type for any sequence of characters.' },
        { line: 'int age = 28;', note: 'A whole number. `int` covers roughly -2.1 billion to +2.1 billion, which is plenty for an age.' },
        { line: 'decimal monthlySalary = 4500.75m;', note: 'The `m` suffix is required - it says "this literal is a decimal". Without it the compiler reads `4500.75` as a `double` and refuses to convert. **Money is always decimal**, never double.' },
        { line: 'bool isEmployed = true;', note: 'Only `true` or `false`. Note the naming: booleans read best as a question - `isEmployed`, `hasAccess`, `canRetry`.' },
        { line: "char grade = 'A';", note: 'A single character, in **single** quotes. `"A"` with double quotes would be a string, and would not compile here.' },
        { line: 'Console.WriteLine($"{employeeName} is {age}...");', note: 'The `$` makes it an interpolated string: anything in `{}` is evaluated and inserted. `{monthlySalary:C}` applies currency formatting.' }
      ],
      output: 'Barani Dharan is 28 and earns ¤4,500.75 per month.\nGrade: A, employed: True',
      takeaway: 'Notice that `bool` prints as `True`, not `true`. And currency formatting depends on the machine\'s culture settings, so the symbol may differ on your computer.'
    },
    {
      id: 'ex2',
      title: 'Reassignment, and what the type will not let you do',
      code: `int counter = 0;
counter = counter + 1;
counter += 1;        // shorthand for the line above
counter++;           // shorthand again
Console.WriteLine(counter);

string status = "pending";
status = "approved";       // fine - same type
// status = 42;            // error CS0029: cannot convert int to string`,
      walkthrough: [
        { line: 'counter = counter + 1;', note: 'Read the right side first: take the current value of `counter`, add 1, then store the result back. The `=` is assignment, not mathematical equality.' },
        { line: 'counter += 1;', note: 'Compound assignment. Identical meaning, less repetition.' },
        { line: 'counter++;', note: 'Increment by one. Idiomatic in loops; less clear when mixed into a larger expression.' },
        { line: '// status = 42;', note: 'This is the guarantee the type gives you. The mistake is caught while you type, not at 2am in production.' }
      ],
      output: '3',
      takeaway: 'A variable\'s value changes freely; its type never does.'
    },
    {
      id: 'ex3',
      title: 'Scope: where a variable is visible',
      code: `int outer = 1;

if (outer == 1)
{
    int inner = 2;
    Console.WriteLine(outer);   // fine - outer is visible in here
    Console.WriteLine(inner);
}

// Console.WriteLine(inner);    // error - inner died with its block`,
      walkthrough: [
        { line: 'int inner = 2;', note: '`inner` is declared inside the `{ }` block, so it exists only inside that block.' },
        { line: 'Console.WriteLine(outer);', note: 'An inner block can see outer variables. The visibility runs one way only.' },
        { line: '// Console.WriteLine(inner);', note: 'Outside the block the name does not exist at all. This is scope, and it is why you cannot accidentally depend on a loop variable after the loop.' }
      ],
      output: '1\n2',
      takeaway: 'Declare a variable in the smallest scope that works. A variable that only exists for three lines cannot be misused on line 90.'
    }
  ],
  exercises: [
    /* ---------- LEVEL 2: GUIDED ---------- */
    {
      id: 'fundamentals:variables#g1',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Declare four variables describing yourself and print them on one line.\n\n- your name (text)\n- your age (whole number)\n- your monthly salary (money)\n- whether you are currently employed (true/false)\n\nUse sensible names and the right type for each. Print them with string interpolation.',
      starterCode: `// Declare your four variables here


// Then print them on a single line using $"..."
`,
      expectedConcepts: ['string', 'int', 'decimal', 'bool'],
      checks: [
        { kind: 'regex', value: 'string\\s+\\w+\\s*=', message: 'Declares a string variable' },
        { kind: 'regex', value: 'int\\s+\\w+\\s*=', message: 'Declares an int variable' },
        { kind: 'regex', value: 'decimal\\s+\\w+\\s*=', message: 'Declares a decimal variable for the salary' },
        { kind: 'regex', value: 'bool\\s+\\w+\\s*=', message: 'Declares a bool variable' },
        { kind: 'regex', value: '\\$"', message: 'Uses an interpolated string to print' },
        { kind: 'regex', value: 'Console\\.WriteLine', message: 'Prints the result' }
      ],
      hints: [
        'Start with the types. Text is `string`, a whole number is `int`, true/false is `bool`. Money needs a type that does not lose precision.',
        'Money should be `decimal`, and a decimal literal needs an `m` suffix: `decimal salary = 4500.50m;`',
        'To print several values together, put a `$` in front of the string and wrap each variable in braces: `Console.WriteLine($"{name} is {age}");`'
      ],
      solution: `string name = "Barani";
int age = 28;
decimal monthlySalary = 4500.50m;
bool isEmployed = true;

Console.WriteLine($"{name}, {age}, earns {monthlySalary} per month, employed: {isEmployed}");`,
      explanation: 'Four different types, each chosen for what the value means. The `m` suffix on the salary is what stops the compiler treating it as a `double`.'
    },
    {
      id: 'fundamentals:variables#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'Which declaration will **not** compile?',
      options: [
        '`var total = 0;`',
        '`var total;`',
        '`int total = 0;`',
        '`const int Total = 0;`'
      ],
      answer: 1,
      hints: [
        '`var` asks the compiler to work out the type. What does it work it out from?',
        'If there is nothing on the right-hand side, there is nothing to infer from.'
      ],
      explanation: '`var total;` gives the compiler nothing to infer the type from, so it is an error. `var` is type inference, not "any type".',
      solution: '`var total;` - there is no initialiser, so the type cannot be inferred.'
    },
    {
      id: 'fundamentals:variables#g3',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What exactly does this program print?',
      code: `int x = 5;
int y = x;
x = 10;
Console.WriteLine(y);`,
      accept: ['5'],
      hints: [
        'Go line by line and write down the value of each variable after each line.',
        '`int y = x;` copies the **value** of x at that moment.',
        'Changing `x` afterwards does not reach back and change `y` - they are two separate boxes.'
      ],
      explanation: '`int` is a value type, so `y` receives a copy of the number 5. Reassigning `x` later has no effect on `y`. This is the foundation of value-vs-reference semantics, which you will meet properly in Core C#.',
      solution: '5'
    },
    {
      id: 'fundamentals:variables#g4',
      type: 'fill-blank', level: 2, difficulty: 'Easy',
      prompt: 'Complete the declarations so this compiles and represents the data sensibly.',
      code: `_____ productName = "Keyboard";
_____ quantityInStock = 42;
_____ unitPrice = 24.99m;
_____ isDiscontinued = false;`,
      blanks: [
        { label: 'holds text', accept: ['string'] },
        { label: 'holds a whole number', accept: ['int', 'long'] },
        { label: 'holds money', accept: ['decimal'] },
        { label: 'holds true or false', accept: ['bool'] }
      ],
      hints: [
        'Match the type to the literal on the right of each `=`.',
        'The `m` suffix on `24.99m` is a strong clue for the third one.',
        'Text is `string`, whole numbers are `int`, money is `decimal`, true/false is `bool`.'
      ],
      solution: 'string, int, decimal, bool',
      explanation: 'The literal tells you the type: quotes mean `string`, an `m` suffix means `decimal`, `false` means `bool`.'
    },

    /* ---------- LEVEL 3: INDEPENDENT ---------- */
    {
      id: 'fundamentals:variables#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write a program that calculates a monthly budget.\n\nDeclare variables for a monthly income of 5000, rent of 1200, food of 450 and transport of 180. Work out the total spending and what is left over, then print:\n\n```\nSpent: 1830\nLeft: 3170\n```\n\nPrint exactly those two lines. Use `decimal` for the money values, and do not hard-code 1830 or 3170 - calculate them.',
      starterCode: `// Declare the income and the three costs


// Calculate the total spent and the remainder


// Print the two lines
`,
      expectedConcepts: ['decimal', 'arithmetic'],
      checks: [
        { kind: 'regex', value: 'decimal', message: 'Uses decimal for money' },
        { kind: 'regex', value: '\\+', message: 'Adds the costs together rather than hard-coding the total' },
        { kind: 'regex', value: '-', message: 'Subtracts to find the remainder' },
        { kind: 'notContains', value: '1830;', message: 'Does not hard-code the total' }
      ],
      run: { expectedOutput: 'Spent: 1830\nLeft: 3170' },
      hints: [
        'You need five variables: the income, three costs, and the total. The remainder can be a sixth.',
        'Total spending is `rent + food + transport`. The remainder is `income - totalSpent`.',
        'Print with `Console.WriteLine($"Spent: {totalSpent}");` - watch the exact wording and capitalisation.'
      ],
      solution: `decimal monthlyIncome = 5000m;
decimal rent = 1200m;
decimal food = 450m;
decimal transport = 180m;

decimal totalSpent = rent + food + transport;
decimal remaining = monthlyIncome - totalSpent;

Console.WriteLine($"Spent: {totalSpent}");
Console.WriteLine($"Left: {remaining}");`,
      explanation: 'Calculating rather than hard-coding means the program stays correct when a number changes - which is the entire point of using variables.'
    },
    {
      id: 'fundamentals:variables#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Swap two variables without using a third variable to hold the value temporarily... and then do it again **with** a temporary variable.\n\nStart with `int a = 3;` and `int b = 8;`. Print `a` and `b` on one line before and after swapping, in this exact form:\n\n```\nBefore: 3 8\nAfter: 8 3\n```',
      starterCode: `int a = 3;
int b = 8;

Console.WriteLine($"Before: {a} {b}");

// Swap them


Console.WriteLine($"After: {a} {b}");`,
      expectedConcepts: ['assignment'],
      checks: [
        { kind: 'regex', value: 'Before:', message: 'Prints the "Before" line' },
        { kind: 'regex', value: 'After:', message: 'Prints the "After" line' }
      ],
      run: { expectedOutput: 'Before: 3 8\nAfter: 8 3' },
      hints: [
        'The obvious attempt `a = b; b = a;` loses a value. Trace it: after the first line, what is in `a`? What is now in `b`?',
        'With a temporary: save `a` first, then overwrite `a`, then restore into `b`.',
        'C# also has tuple deconstruction: `(a, b) = (b, a);` does the whole swap in one line.'
      ],
      solution: `int a = 3;
int b = 8;

Console.WriteLine($"Before: {a} {b}");

int temp = a;
a = b;
b = temp;

Console.WriteLine($"After: {a} {b}");`,
      explanation: 'The naive `a = b; b = a;` destroys the original `a` before it can be copied. The temporary variable preserves it. Modern C# also lets you write `(a, b) = (b, a);` - the right side is evaluated fully before anything is assigned.'
    },
    {
      id: 'fundamentals:variables#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'In your own words: why does C# require you to declare a type, when languages like JavaScript do not? Give at least two concrete benefits, and one situation where the requirement is genuinely inconvenient.',
      expectedConcepts: ['compile|compiler|build', 'error|bug|mistake', 'tool|autocomplete|intellisense|refactor', 'performance|optimis|fast'],
      minLength: 120,
      hints: [
        'Think about when a mistake is discovered: while you type, or while a user is using your software?',
        'Think about what your editor can do for you when it knows the type.',
        'For the inconvenience: think about prototyping, or about deeply nested generic types.'
      ],
      solution: 'A type moves whole categories of error from runtime to compile time, lets the editor offer accurate autocomplete and safe refactoring, and lets the compiler generate faster code because it knows the exact size and layout of every value. It is inconvenient when you are sketching something quickly, or when a type name is so long that it drowns the line - which is exactly what `var` exists to soften.',
      explanation: 'There is no single right answer here. What matters is that you can argue the trade-off rather than repeat a slogan.'
    },

    /* ---------- DEBUGGING ---------- */
    {
      id: 'fundamentals:variables#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This program does not compile. Work out why, explain it, then fix it.',
      brokenCode: `int total;
int price = 20;
int quantity = 3;

Console.WriteLine($"Total: {total}");

total = price * quantity;`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`total` is used before it has been assigned a value',
            '`int` is the wrong type for a total',
            'String interpolation cannot be used with an `int`',
            'The multiplication should come before the declaration of `price`'
          ],
          answer: 0,
          label: 'Identified the unassigned variable'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does the compiler refuse this, rather than just printing 0?',
          accept: ['definite assignment'],
          acceptContains: ['assign'],
          label: 'Explained definite assignment'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Total: 60`.',
          starterCode: `int total;
int price = 20;
int quantity = 3;

Console.WriteLine($"Total: {total}");

total = price * quantity;`,
          checks: [
            { kind: 'regex', value: 'total\\s*=\\s*price\\s*\\*\\s*quantity', message: 'Calculates the total' },
            { kind: 'regex', value: 'Console\\.WriteLine', message: 'Still prints the total' }
          ],
          run: { expectedOutput: 'Total: 60' },
          label: 'Fixed the program'
        }
      ],
      hints: [],
      solution: `int price = 20;
int quantity = 3;
int total = price * quantity;

Console.WriteLine($"Total: {total}");`,
      explanation: 'C# enforces **definite assignment**: a local variable must be given a value before it is read. The fix is to move the calculation above the `Console.WriteLine`. In C or C++ this would compile and print whatever rubbish was in that memory address.'
    },
    {
      id: 'fundamentals:variables#d2',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This compiles, but the result is wrong. Find the bug.',
      brokenCode: `decimal price = 19.99m;
int quantity = 3;
decimal total = price * quantity;

// The customer gets 10% off
decimal discount = total / 10;
total = total - discount;

Console.WriteLine($"Total: {discount}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The discount calculation is wrong',
            'The wrong variable is printed - it prints the discount, not the total',
            '`decimal` cannot be multiplied by `int`',
            'The discount should be subtracted before it is calculated'
          ],
          answer: 1,
          label: 'Spotted the wrong variable in the output'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why did the compiler not catch this?',
          accept: ['both are decimals'],
          acceptContains: ['decimal'],
          label: 'Explained why the type system cannot help here'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints the discounted total.',
          starterCode: `decimal price = 19.99m;
int quantity = 3;
decimal total = price * quantity;

decimal discount = total / 10;
total = total - discount;

Console.WriteLine($"Total: {discount}");`,
          checks: [
            { kind: 'regex', value: 'WriteLine\\(\\$?"[^"]*\\{\\s*total\\s*[}:]', message: 'Prints the total, not the discount' }
          ],
          run: { expectedOutput: 'Total: 53.973' },
          label: 'Printed the right variable'
        }
      ],
      hints: [],
      solution: `decimal price = 19.99m;
int quantity = 3;
decimal total = price * quantity;

decimal discount = total / 10;
total = total - discount;

Console.WriteLine($"Total: {total}");`,
      explanation: 'Both variables are `decimal`, so the type system cannot tell them apart - this is a **logic** bug, not a type bug. It is exactly the kind of mistake that good names make survivable: if the variable were called `d` you would have far less chance of noticing.'
    },

    /* ---------- LEVEL 4: APPLIED ---------- */
    {
      id: 'fundamentals:variables#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'A realistic situation: build a payslip calculator.\n\nAn employee has a gross monthly salary of 4800. Tax is 20% of gross. Pension is 5% of gross. Net pay is what remains.\n\nPrint exactly:\n\n```\nGross: 4800\nTax: 960.00\nPension: 240.00\nNet: 3600.00\n```\n\nEvery number after `Gross` must be calculated, not typed in. Use constants for the two rates so the rates cannot be changed by accident later in the program.',
      starterCode: `// Rates that must never change mid-calculation


// The employee's gross pay


// Work out tax, pension and net


// Print the four lines
`,
      expectedConcepts: ['const', 'decimal'],
      checks: [
        { kind: 'regex', value: 'const\\s+decimal', message: 'Uses const for the rates' },
        { kind: 'regex', value: 'decimal\\s+\\w*[Gg]ross', message: 'Has a clearly named gross pay variable' },
        { kind: 'notContains', value: '960', message: 'Tax is calculated, not hard-coded' },
        { kind: 'notContains', value: '3600', message: 'Net pay is calculated, not hard-coded' }
      ],
      run: { expectedOutput: 'Gross: 4800\nTax: 960.00\nPension: 240.00\nNet: 3600.00' },
      hints: [
        'Declare the rates as `const decimal TaxRate = 0.20m;` - PascalCase, because constants use it.',
        '20% of something is that thing multiplied by `0.20m`.',
        'Net is gross minus tax minus pension. Print with four separate `Console.WriteLine` calls.'
      ],
      solution: `const decimal TaxRate = 0.20m;
const decimal PensionRate = 0.05m;

decimal grossPay = 4800m;
decimal tax = grossPay * TaxRate;
decimal pension = grossPay * PensionRate;
decimal netPay = grossPay - tax - pension;

Console.WriteLine($"Gross: {grossPay}");
Console.WriteLine($"Tax: {tax}");
Console.WriteLine($"Pension: {pension}");
Console.WriteLine($"Net: {netPay}");`,
      explanation: 'The `const` rates mean nobody can reassign the tax rate halfway down a longer program - the compiler would stop them.\n\nNotice the output: `960.00`, not `960`. `decimal` remembers **scale** - multiplying a value with 0 decimal places by one with 2 gives a result with 2. That is deliberate: in accounting, "960.00" and "960" carry different information about precision. If you want to control it, format explicitly with `:F0` or `:F2`.'
    },

    /* ---------- LEVEL 5: NO-HELP CHALLENGE ---------- */
    {
      id: 'fundamentals:variables#c1',
      type: 'coding', level: 5, difficulty: 'Medium',
      title: 'Split the bill',
      prompt: 'No hints. No solution until you submit.\n\nFour friends have dinner. The bill is 187.50. They add a 12% tip and split the whole thing evenly.\n\nPrint exactly:\n\n```\nBill: 187.50\nTip: 22.50\nTotal: 210.00\nEach: 52.50\n```\n\nEvery value except the bill and the number of people must be calculated. Use appropriate types and constants, and format the money to two decimal places.',
      starterCode: ``,
      expectedConcepts: ['decimal', 'const'],
      checks: [
        { kind: 'regex', value: 'decimal', message: 'Uses decimal for money' },
        { kind: 'notContains', value: '52.50;', message: 'The per-person amount is calculated' },
        { kind: 'regex', value: '/', message: 'Divides to split the bill' }
      ],
      run: { expectedOutput: 'Bill: 187.50\nTip: 22.50\nTotal: 210.00\nEach: 52.50' },
      hints: [],
      solution: `const decimal TipRate = 0.12m;
const int PeopleCount = 4;

decimal bill = 187.50m;
decimal tip = bill * TipRate;
decimal total = bill + tip;
decimal each = total / PeopleCount;

Console.WriteLine($"Bill: {bill:F2}");
Console.WriteLine($"Tip: {tip:F2}");
Console.WriteLine($"Total: {total:F2}");
Console.WriteLine($"Each: {each:F2}");`,
      explanation: 'The `:F2` format specifier fixes the output to two decimal places, which is what turns `52.5` into `52.50`. Using `decimal` throughout means no rounding surprises - try this with `double` and watch the pennies drift.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:variables#q1', type: 'mcq',
      prompt: 'Which type should hold a price in pounds and pence?',
      options: ['`double`', '`float`', '`decimal`', '`int`'],
      answer: 2,
      explanation: '`decimal` stores base-10 fractions exactly. `double` and `float` are base-2 and cannot represent 0.1 exactly, so money drifts. Never use them for currency.'
    },
    {
      id: 'fundamentals:variables#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int a = 4;
int b = a;
b = b * 2;
Console.WriteLine($"{a} {b}");`,
      accept: ['4 8'],
      explanation: '`b` got a copy of the value 4. Doubling `b` does not touch `a`.'
    },
    {
      id: 'fundamentals:variables#q3', type: 'mcq',
      prompt: 'Which of these is a compile-time **error**?',
      options: [
        '`var name = "Barani";`',
        '`int count = 0; count = count + 1;`',
        '`const int Max = 10; Max = 20;`',
        '`decimal price = 9.99m;`'
      ],
      answer: 2,
      explanation: 'A `const` cannot be reassigned. The compiler rejects it - which is the whole point of declaring it `const`.'
    },
    {
      id: 'fundamentals:variables#q4', type: 'explain',
      prompt: 'A colleague writes `var result = Calculate(order);`. Explain in one or two sentences why a reviewer might ask them to change it.',
      expectedConcepts: ['read|reader|readab|obvious|clear', 'type|return'],
      minLength: 60,
      explanation: '`var` is fine when the type is obvious from the line. Here the reader has to open `Calculate` to find out what `result` even is, so naming the type helps.'
    },
    {
      id: 'fundamentals:variables#q5', type: 'mcq',
      prompt: 'Why does `int total; Console.WriteLine(total);` fail to compile?',
      options: [
        '`int` must always be initialised to 0 explicitly',
        'C# enforces definite assignment for local variables',
        '`Console.WriteLine` cannot accept an `int`',
        '`total` is a reserved word'
      ],
      answer: 1,
      explanation: 'Local variables must be definitely assigned before use. Class fields are different - they get a default value automatically.'
    },
    {
      id: 'fundamentals:variables#q6', type: 'predict-output',
      prompt: 'What is printed?',
      code: `int x = 10;
{
    int y = x + 5;
    x = y;
}
Console.WriteLine(x);`,
      accept: ['15'],
      explanation: '`y` is scoped to the inner block, but it can read and write `x` from the enclosing scope before it disappears.'
    }
  ],
  commonMistakes: [
    {
      mistake: 'Using `double` for money',
      why: 'It looks like the obvious choice for a number with a decimal point, and small tests appear to work.',
      fix: 'Use `decimal` for any currency value. `0.1 + 0.2` is not `0.3` in binary floating point, and those fractions of a penny accumulate.'
    },
    {
      mistake: 'Forgetting the `m` suffix on a decimal literal',
      why: 'Every other language lets you write `4500.75` and move on.',
      fix: 'Write `4500.75m`. Without the suffix the literal is a `double` and the compiler will refuse to convert it implicitly.'
    },
    {
      mistake: 'Names that describe the type instead of the meaning',
      why: 'It feels descriptive - `strName`, `intCount`, `dblTotal`.',
      fix: 'The type is already in the declaration. Spend the name on meaning: `customerName`, `retryCount`, `orderTotal`.'
    },
    {
      mistake: 'Declaring everything at the top of the method',
      why: 'A habit carried over from older languages that required it.',
      fix: 'Declare each variable where it is first needed. Smaller scope means fewer things to hold in your head, and fewer ways to misuse it.'
    },
    {
      mistake: 'Using `var` everywhere because it is shorter',
      why: 'It reduces typing and looks tidy.',
      fix: 'Use `var` when the type is obvious from the same line. When the right-hand side is a method call, write the type out.'
    }
  ],
  realWorld: [
    'Every method you will ever write in ASP.NET Core starts by pulling values out of a request into well-named local variables.',
    'Choosing `decimal` over `double` for money is the difference between an invoicing system that balances and one that is out by a few pence per thousand transactions.',
    'Code review comments about naming are the most common feedback junior engineers receive - and the easiest to act on.',
    '`const` values are how configuration limits (max retries, page size, timeout) are expressed before they graduate into a configuration file.'
  ],
  resources: [
    { label: 'Try each example in the editor', note: 'Change a value, predict the new output, then run it. Predicting first is what makes it stick.' },
    { label: 'Rename practice', note: 'Open any code you have written and rename three variables to be clearer. It is the cheapest quality win available.' }
  ]
}
,
/* ============================================================
   2. DATA TYPES
   ============================================================ */
{
  topicId: 'fundamentals:data-types',
  title: 'Data Types',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 50,
  prerequisites: ['fundamentals:variables'],
  objectives: [
    'Pick the right numeric type for a given job and justify the choice',
    'Explain why `decimal` and not `double` is used for money',
    'Describe what integer overflow is and what C# does about it by default',
    'Tell value types and reference types apart, and predict the effect on assignment',
    'Know what `null` means and which types can hold it'
  ],
  sections: [
    {
      id: 'families',
      title: 'The families of built-in types',
      blocks: [
        { type: 'text', text: 'C# ships with a fixed set of built-in types. You will use perhaps six of them for 95% of your work, but knowing the whole shape of the set stops you guessing.' },
        { type: 'table', head: ['Type', 'Holds', 'Range / precision', 'Use it for'], rows: [
          ['`int`', 'Whole numbers', 'about -2.1bn to 2.1bn', 'Counts, indexes, ages, quantities'],
          ['`long`', 'Whole numbers', 'about -9.2 quintillion to 9.2 quintillion', 'Ids, file sizes, timestamps in ticks'],
          ['`double`', 'Real numbers', '~15-16 significant digits, base 2', 'Science, graphics, averages, physics'],
          ['`decimal`', 'Real numbers', '28-29 significant digits, base 10', 'Money. Always money.'],
          ['`bool`', 'true or false', 'two values', 'Flags, conditions'],
          ['`char`', 'One character', 'a single UTF-16 unit', 'Single letters, parsing'],
          ['`string`', 'Text', 'any length', 'Names, messages, anything textual'],
          ['`byte`', 'Whole numbers', '0 to 255', 'Raw binary data, file contents']
        ] },
        { type: 'note', text: 'There are more (`short`, `uint`, `sbyte`, `float`, `nint`...). Reach for them when you have a specific reason - interop, or a very large array where the memory saving matters. Otherwise `int` and `double` are the defaults for a reason.' }
      ]
    },
    {
      id: 'money',
      title: 'Why money is decimal and never double',
      blocks: [
        { type: 'text', text: 'This is the single most consequential type decision a junior engineer makes, and it is worth understanding rather than memorising.' },
        { type: 'text', text: '`double` stores numbers in **base 2**. Just as base 10 cannot write 1/3 exactly, base 2 cannot write 0.1 exactly. It stores the nearest representable value, which is very slightly off.' },
        { type: 'code', caption: 'The classic demonstration', code: `double a = 0.1 + 0.2;
Console.WriteLine(a);           // 0.30000000000000004
Console.WriteLine(a == 0.3);    // False

decimal b = 0.1m + 0.2m;
Console.WriteLine(b);           // 0.3
Console.WriteLine(b == 0.3m);   // True` },
        { type: 'text', text: 'One transaction being out by 0.00000000000000004 does not matter. Ten million transactions, each rounded at a different point, absolutely does - and it is the kind of bug that surfaces as "the ledger does not balance by 3p" six months after release.' },
        { type: 'whenNot', text: 'Do not use `decimal` for scientific or graphical work. It is roughly 10-20x slower than `double` and has a smaller exponent range. Use `double` where you want speed and approximate real numbers; use `decimal` where exactness in base 10 is the requirement.' }
      ]
    },
    {
      id: 'overflow',
      title: 'Overflow: what happens when a number does not fit',
      blocks: [
        { type: 'text', text: 'An `int` has a maximum. Add one to it and, by default, C# **wraps around silently**.' },
        { type: 'code', code: `int max = int.MaxValue;      // 2147483647
Console.WriteLine(max + 1);  // -2147483648  (wrapped, no error)

checked
{
    // Console.WriteLine(max + 1);   // now throws OverflowException
}` },
        { type: 'text', text: 'The default is unchecked because the check costs a little performance and the vast majority of arithmetic cannot overflow. Where it matters - financial totals, anything accumulating without bound - either use a `checked` block or pick a wider type.' },
        { type: 'warning', text: 'This is a real production bug pattern. A counter that has been fine for two years silently goes negative the day it passes 2.1 billion, and every comparison against it starts behaving backwards.' }
      ]
    },
    {
      id: 'valueref',
      title: 'Value types and reference types',
      blocks: [
        { type: 'text', text: 'Every type in C# is one of two kinds, and the difference shows up the moment you assign one variable to another.' },
        { type: 'list', items: [
          '**Value types** hold the data directly. `int`, `double`, `decimal`, `bool`, `char`, and any `struct` or `enum`. Assigning copies the value.',
          '**Reference types** hold a reference to data living elsewhere. `string`, arrays, `List<T>`, and any `class`. Assigning copies the reference, so both names point at the same object.'
        ] },
        { type: 'analogy', text: 'A value type is a document you photocopy - edit your copy and mine is untouched. A reference type is a shared folder link - if you move a file, I see it move too.' },
        { type: 'note', text: '`string` is the confusing one: it is a reference type, but it is **immutable**, so it behaves like a value type in practice. You can never change a string in place, so nobody can surprise you by editing one you are holding.' }
      ]
    },
    {
      id: 'null',
      title: 'null, and which types can be it',
      blocks: [
        { type: 'text', text: '`null` means "this reference points at nothing". Reference types can be null; value types traditionally cannot.' },
        { type: 'code', code: `string? maybeName = null;   // fine - nullable reference type
int count = null;           // error - an int must be some number
int? maybeCount = null;     // fine - int? is Nullable<int>

Console.WriteLine(maybeCount.HasValue);      // False
Console.WriteLine(maybeCount ?? 0);          // 0  (?? supplies a fallback)` },
        { type: 'text', text: 'The `?` suffix makes a value type nullable, and in modern C# it also marks a reference type as *expected* to be null so the compiler can warn you when you forget to check.' },
        { type: 'warning', text: '`NullReferenceException` is the most common runtime crash in .NET. The nullable annotations exist to move that crash to a compiler warning. Turn them on and listen to them.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Choosing the right type for each field',
      code: `int employeeId = 10427;
string fullName = "Barani Dharan";
decimal annualSalary = 54000.00m;
double performanceScore = 87.5;
bool isActive = true;
char departmentCode = 'E';
long recordVersion = 9_223_372_036_854_775_000;

Console.WriteLine($"{employeeId} {fullName} {annualSalary} {performanceScore} {isActive} {departmentCode}");
Console.WriteLine(recordVersion);`,
      walkthrough: [
        { line: 'int employeeId = 10427;', note: 'An id that will never approach 2.1 billion. `int` is right, and cheaper than `long`.' },
        { line: 'decimal annualSalary = 54000.00m;', note: 'Money. Always `decimal`, always with the `m` suffix.' },
        { line: 'double performanceScore = 87.5;', note: 'An approximate measure where a tiny rounding difference is meaningless. `double` is the right default for real numbers that are not money.' },
        { line: "char departmentCode = 'E';", note: 'Exactly one character, so `char` rather than a one-character `string`.' },
        { line: 'long recordVersion = 9_223_372_036_854_775_000;', note: 'Underscores are digit separators - purely for human eyes, ignored by the compiler. Very useful on large constants.' }
      ],
      output: '10427 Barani Dharan 54000.00 87.5 True E\n9223372036854775000',
      takeaway: 'Each type is a decision you are making on behalf of every future reader. `decimal` says money; `double` says measurement.'
    },
    {
      id: 'ex2',
      title: 'Value vs reference, demonstrated',
      code: `// Value type: the copy is independent
int a = 1;
int b = a;
b = 99;
Console.WriteLine($"a={a} b={b}");

// Reference type: both names point at the same array
int[] first = { 1, 2, 3 };
int[] second = first;
second[0] = 99;
Console.WriteLine($"first[0]={first[0]} second[0]={second[0]}");`,
      walkthrough: [
        { line: 'int b = a;', note: 'Copies the number itself. Two independent boxes from here on.' },
        { line: 'int[] second = first;', note: 'Copies the **reference**, not the array. One array, two names for it.' },
        { line: 'second[0] = 99;', note: 'Changes the one shared array - so reading through `first` shows the change too.' }
      ],
      output: 'a=1 b=99\nfirst[0]=99 second[0]=99',
      takeaway: 'If this surprises you, you have just found the cause of a large fraction of the bugs you will write in your first year. Draw the boxes and arrows on paper until it is automatic.'
    },
    {
      id: 'ex3',
      title: 'Limits, and asking the type about itself',
      code: `Console.WriteLine($"int:     {int.MinValue} to {int.MaxValue}");
Console.WriteLine($"long:    {long.MinValue} to {long.MaxValue}");
Console.WriteLine($"byte:    {byte.MinValue} to {byte.MaxValue}");
Console.WriteLine($"decimal digits: {decimal.MaxValue}");

int nearLimit = int.MaxValue;
Console.WriteLine(nearLimit + 1);`,
      walkthrough: [
        { line: 'int.MaxValue', note: 'Every numeric type exposes its own limits as constants. Use them instead of memorising the numbers.' },
        { line: 'Console.WriteLine(nearLimit + 1);', note: 'Silent wraparound to the most negative int. No exception by default.' }
      ],
      output: 'int:     -2147483648 to 2147483647\nlong:    -9223372036854775808 to 9223372036854775807\nbyte:    0 to 255\ndecimal digits: 79228162514264337593543950335\n-2147483648',
      takeaway: 'When you are unsure whether a type is wide enough, print its `MaxValue` rather than guessing.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:data-types#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'You are storing the total value of an online shopping basket. Which type?',
      options: ['`double`', '`decimal`', '`float`', '`int`'],
      answer: 1,
      hints: [
        'The value is money.',
        'Base-2 floating point cannot represent 0.1 exactly, and basket totals are full of values like 19.99.'
      ],
      explanation: 'Money is always `decimal`. `double` and `float` introduce tiny base-2 errors that accumulate across many transactions.',
      solution: '`decimal`'
    },
    {
      id: 'fundamentals:data-types#g2',
      type: 'predict-output', level: 2, difficulty: 'Medium',
      prompt: 'What does this print?',
      code: `Console.WriteLine(0.1 + 0.2 == 0.3);`,
      accept: ['false'],
      hints: [
        'These are `double` literals, so this is base-2 floating point arithmetic.',
        'Neither 0.1 nor 0.2 can be stored exactly in base 2, so their sum is very slightly off 0.3.'
      ],
      explanation: 'It prints `False`. This is not a C# quirk - it is how IEEE 754 binary floating point works in every language. It is also exactly why money uses `decimal`.',
      solution: 'False'
    },
    {
      id: 'fundamentals:data-types#g3',
      type: 'fill-blank', level: 2, difficulty: 'Easy',
      prompt: 'Choose the most appropriate type for each piece of an order record.',
      code: `_____ orderId = 88213;
_____ customerEmail = "sam@example.com";
_____ orderTotal = 149.95m;
_____ isPaid = true;
_____ itemCount = 3;`,
      blanks: [
        { label: 'a numeric id', accept: ['int', 'long'] },
        { label: 'an email address', accept: ['string'] },
        { label: 'money', accept: ['decimal'] },
        { label: 'paid or not', accept: ['bool'] },
        { label: 'how many items', accept: ['int'] }
      ],
      hints: [
        'Look at each literal - the quotes, the `m` suffix and `true` are all strong clues.',
        'An email address is text, no matter what it contains.',
        'Anything with an `m` suffix is a `decimal`.'
      ],
      solution: 'int, string, decimal, bool, int',
      explanation: 'The literal usually tells you the type. Where it does not - like choosing `int` vs `long` for an id - think about the maximum the value could ever reach.'
    },
    {
      id: 'fundamentals:data-types#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Demonstrate the money problem to a sceptical colleague.\n\nAdd 0.1 and 0.2 as `double`, then as `decimal`, and print both results plus whether each equals its expected value.\n\nPrint exactly:\n\n```\ndouble: 0.30000000000000004 False\ndecimal: 0.3 True\n```',
      starterCode: `// double version


// decimal version
`,
      expectedConcepts: ['double', 'decimal'],
      checks: [
        { kind: 'regex', value: 'double', message: 'Uses double' },
        { kind: 'regex', value: 'decimal', message: 'Uses decimal' },
        { kind: 'regex', value: '==', message: 'Compares against the expected value' }
      ],
      run: { expectedOutput: 'double: 0.30000000000000004 False\ndecimal: 0.3 True' },
      hints: [
        'Declare `double d = 0.1 + 0.2;` and compare it with `0.3`.',
        'For the decimal version every literal needs the `m` suffix, including the one you compare against.',
        'Print with interpolation: `Console.WriteLine($"double: {d} {d == 0.3}");`'
      ],
      solution: `double d = 0.1 + 0.2;
Console.WriteLine($"double: {d} {d == 0.3}");

decimal m = 0.1m + 0.2m;
Console.WriteLine($"decimal: {m} {m == 0.3m}");`,
      explanation: 'Being able to demonstrate this in ten seconds is more persuasive in a code review than quoting a rule.'
    },
    {
      id: 'fundamentals:data-types#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Show integer overflow and then prevent it.\n\nStart from `int.MaxValue`, add 1 unchecked and print the result. Then do the same inside a `checked` block, catch the `OverflowException`, and print `Overflow caught`.\n\nPrint exactly:\n\n```\n-2147483648\nOverflow caught\n```',
      starterCode: `int max = int.MaxValue;

// 1. unchecked - print the wrapped value


// 2. checked - catch the exception and print "Overflow caught"
`,
      expectedConcepts: ['checked', 'OverflowException'],
      checks: [
        { kind: 'regex', value: 'checked', message: 'Uses a checked block' },
        { kind: 'regex', value: 'catch', message: 'Catches the exception' },
        { kind: 'regex', value: 'OverflowException', message: 'Catches OverflowException specifically' }
      ],
      run: { expectedOutput: '-2147483648\nOverflow caught' },
      hints: [
        '`int.MaxValue + 1` wraps around to `int.MinValue` by default.',
        'Wrap the same arithmetic in `checked { ... }` to make it throw instead.',
        'Use `try { checked { ... } } catch (OverflowException) { Console.WriteLine("Overflow caught"); }`'
      ],
      solution: `int max = int.MaxValue;

Console.WriteLine(max + 1);

try
{
    checked
    {
        int boom = max + 1;
        Console.WriteLine(boom);
    }
}
catch (OverflowException)
{
    Console.WriteLine("Overflow caught");
}`,
      explanation: 'The default is unchecked for speed. When a value is accumulating without a natural bound - a running total, a counter that never resets - being explicit with `checked` turns a silent corruption into a loud failure.'
    },
    {
      id: 'fundamentals:data-types#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain the difference between a value type and a reference type, using an example of a bug that the difference can cause.',
      expectedConcepts: ['copy|copies', 'reference|point', 'value', 'share|same object|both'],
      minLength: 140,
      hints: [
        'Start with what actually gets copied when you write `b = a;`.',
        'Think about passing a `List<T>` into a method that modifies it.',
        'Which one surprises people, and why?'
      ],
      solution: 'A value type variable holds the data itself, so assigning copies the data and the two variables are independent. A reference type variable holds a reference to an object elsewhere, so assigning copies only the reference - both names now refer to the same object. The classic bug: you pass a `List<int>` into a method, the method calls `Clear()` on it, and the caller is surprised to find its own list is now empty. With an `int` the same code would be harmless.',
      explanation: 'The clearest test of understanding is whether you can name a bug the distinction causes, not just recite the definitions.'
    },
    {
      id: 'fundamentals:data-types#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This invoice total is subtly wrong. Find out why.',
      brokenCode: `double unitPrice = 0.1;
int quantity = 3;
double total = unitPrice * quantity;

Console.WriteLine(total == 0.3 ? "Correct" : "Wrong");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The quantity should be a double',
            'Money is stored as `double`, so the comparison against 0.3 fails',
            '`==` cannot be used with numbers',
            'The multiplication happens before the declaration'
          ],
          answer: 1,
          label: 'Identified the double-for-money mistake'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why can a base-2 floating point type not store 0.1 exactly?',
          accept: ['0.1 is not representable in base 2'],
          acceptContains: ['base 2'],
          label: 'Explained binary representation'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Correct`.',
          starterCode: `double unitPrice = 0.1;
int quantity = 3;
double total = unitPrice * quantity;

Console.WriteLine(total == 0.3 ? "Correct" : "Wrong");`,
          checks: [
            { kind: 'regex', value: 'decimal', message: 'Switches to decimal' },
            { kind: 'notContains', value: 'double', message: 'No longer uses double for money' }
          ],
          run: { expectedOutput: 'Correct' },
          label: 'Fixed the type'
        }
      ],
      hints: [],
      solution: `decimal unitPrice = 0.1m;
int quantity = 3;
decimal total = unitPrice * quantity;

Console.WriteLine(total == 0.3m ? "Correct" : "Wrong");`,
      explanation: 'Switching to `decimal` makes the arithmetic exact in base 10. Note that comparing floating point values with `==` is itself a smell - with `double` you would compare against a tolerance instead.'
    },
    {
      id: 'fundamentals:data-types#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This program is meant to leave the original list untouched. It does not.',
      brokenCode: `int[] original = { 1, 2, 3 };
int[] working = original;

working[0] = 100;

Console.WriteLine($"original[0] = {original[0]}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'Arrays cannot be assigned to each other',
            '`working` is a second reference to the same array, not a copy of it',
            'The array should have been declared with `new`',
            '`original` is a constant and cannot be read after assignment'
          ],
          answer: 1,
          label: 'Identified reference copying'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What does the assignment `int[] working = original;` actually copy?',
          accept: ['the reference'],
          acceptContains: ['reference'],
          label: 'Explained what is copied'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so `original[0]` is still 1. Print `original[0] = 1`.',
          starterCode: `int[] original = { 1, 2, 3 };
int[] working = original;

working[0] = 100;

Console.WriteLine($"original[0] = {original[0]}");`,
          checks: [
            { kind: 'regex', value: 'ToArray\\(\\)|Clone\\(\\)|new int\\[|Array\\.Copy', message: 'Makes a real copy of the array' }
          ],
          run: { expectedOutput: 'original[0] = 1' },
          label: 'Made an independent copy'
        }
      ],
      hints: [],
      solution: `int[] original = { 1, 2, 3 };
int[] working = (int[])original.Clone();

working[0] = 100;

Console.WriteLine($"original[0] = {original[0]}");`,
      explanation: 'Arrays are reference types, so `=` shares rather than copies. `Clone()` (or `ToArray()`, or `Array.Copy`) makes an independent copy. This exact bug is extremely common when a method is handed a collection and quietly mutates it.'
    },
    {
      id: 'fundamentals:data-types#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Build a small product record using the most appropriate type for every field, then print a summary.\n\nA product has: an id (88213), a name ("Mechanical Keyboard"), a price (89.99), a stock count (17), an average rating (4.35), and whether it is discontinued (false).\n\nPrint exactly:\n\n```\n88213 Mechanical Keyboard\nPrice: 89.99\nStock: 17\nRating: 4.35\nDiscontinued: False\n```\n\nUse `decimal` for the price and `double` for the rating, and be ready to justify both.',
      starterCode: ``,
      expectedConcepts: ['decimal', 'double', 'int', 'bool', 'string'],
      checks: [
        { kind: 'regex', value: 'decimal\\s+\\w*[Pp]rice', message: 'Price is decimal' },
        { kind: 'regex', value: 'double\\s+\\w*[Rr]ating', message: 'Rating is double' },
        { kind: 'regex', value: 'int\\s+', message: 'Uses int for whole numbers' },
        { kind: 'regex', value: 'bool\\s+', message: 'Uses bool for the flag' }
      ],
      run: { expectedOutput: '88213 Mechanical Keyboard\nPrice: 89.99\nStock: 17\nRating: 4.35\nDiscontinued: False' },
      hints: [
        'The price is money, so `decimal` with an `m` suffix.',
        'A rating is an approximate measurement, not money - `double` is fine and faster.',
        'Print each line with its own `Console.WriteLine`.'
      ],
      solution: `int productId = 88213;
string productName = "Mechanical Keyboard";
decimal price = 89.99m;
int stockCount = 17;
double averageRating = 4.35;
bool isDiscontinued = false;

Console.WriteLine($"{productId} {productName}");
Console.WriteLine($"Price: {price}");
Console.WriteLine($"Stock: {stockCount}");
Console.WriteLine($"Rating: {averageRating}");
Console.WriteLine($"Discontinued: {isDiscontinued}");`,
      explanation: 'The price is `decimal` because a customer will be charged it. The rating is `double` because it is an average of opinions - being out by 0.0000001 is meaningless, and `double` is cheaper.'
    },
    {
      id: 'fundamentals:data-types#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Type audit',
      prompt: 'No hints.\n\nWrite a program that reports, for four types, both limits and the size in bytes. Use the types themselves to get the values - do not type the numbers in.\n\nPrint exactly:\n\n```\nbyte 0 255 1\nint -2147483648 2147483647 4\nlong -9223372036854775808 9223372036854775807 8\ndouble -1.7976931348623157E+308 1.7976931348623157E+308 8\n```\n\n(Each line is: name, min, max, size in bytes.)',
      starterCode: ``,
      expectedConcepts: ['MinValue', 'MaxValue', 'sizeof'],
      checks: [
        { kind: 'regex', value: 'MinValue', message: 'Reads MinValue from the type' },
        { kind: 'regex', value: 'MaxValue', message: 'Reads MaxValue from the type' },
        { kind: 'regex', value: 'sizeof', message: 'Uses sizeof for the byte size' },
        { kind: 'notContains', value: '2147483647;', message: 'Does not hard-code the limits' }
      ],
      run: { expectedOutput: 'byte 0 255 1\nint -2147483648 2147483647 4\nlong -9223372036854775808 9223372036854775807 8\ndouble -1.7976931348623157E+308 1.7976931348623157E+308 8' },
      hints: [],
      solution: `Console.WriteLine($"byte {byte.MinValue} {byte.MaxValue} {sizeof(byte)}");
Console.WriteLine($"int {int.MinValue} {int.MaxValue} {sizeof(int)}");
Console.WriteLine($"long {long.MinValue} {long.MaxValue} {sizeof(long)}");
Console.WriteLine($"double {double.MinValue} {double.MaxValue} {sizeof(double)}");`,
      explanation: '`sizeof` works on any unmanaged type without needing unsafe code. Reading the limits from the type rather than memorising them means your program stays correct on any platform.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:data-types#q1', type: 'mcq',
      prompt: 'Which statement about `string` is true?',
      options: [
        'It is a value type',
        'It is a reference type, but immutable',
        'It is a reference type and can be modified in place',
        'It is an alias for `char[]`'
      ],
      answer: 1,
      explanation: '`string` is a reference type, but because strings are immutable you can never change one in place - which is why they feel like value types day to day.'
    },
    {
      id: 'fundamentals:data-types#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int x = int.MaxValue;
Console.WriteLine(x + 1);`,
      accept: ['-2147483648'],
      explanation: 'Arithmetic is unchecked by default, so the value wraps to `int.MinValue` with no exception.'
    },
    {
      id: 'fundamentals:data-types#q3', type: 'mcq',
      prompt: 'You need to store the number of milliseconds since 1970. Which type?',
      options: ['`int`', '`long`', '`decimal`', '`short`'],
      answer: 1,
      explanation: 'Milliseconds since 1970 passed `int.MaxValue` in 1970 + 24 days. `long` is the standard choice - this is exactly the "year 2038 problem" in miniature.'
    },
    {
      id: 'fundamentals:data-types#q4', type: 'explain',
      prompt: 'In one or two sentences: why would using `decimal` for 3D graphics coordinates be a poor choice?',
      expectedConcepts: ['slow|performance|speed', 'precision|exact|not needed|approximate'],
      minLength: 60,
      explanation: '`decimal` is far slower than `double` and its exact base-10 behaviour buys nothing for coordinates, which are approximate by nature and processed in enormous volumes.'
    },
    {
      id: 'fundamentals:data-types#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int[] a = { 1, 2, 3 };
int[] b = a;
b[1] = 20;
Console.WriteLine(a[1]);`,
      accept: ['20'],
      explanation: 'Arrays are reference types, so `b` and `a` name the same array.'
    },
    {
      id: 'fundamentals:data-types#q6', type: 'mcq',
      prompt: 'Which of these will not compile?',
      options: ['`int? a = null;`', '`string? b = null;`', '`int c = null;`', '`decimal? d = null;`'],
      answer: 2,
      explanation: 'A plain `int` is a value type and must hold a number. `int?` (Nullable<int>) is what you need if the value may be absent.'
    }
  ],
  commonMistakes: [
    { mistake: 'Using `double` or `float` for money', why: 'They look like the natural types for numbers with decimal points.', fix: 'Use `decimal` for any currency amount, and remember the `m` suffix on literals.' },
    { mistake: 'Assuming `int` is always big enough', why: 'Two billion sounds enormous until you are counting milliseconds or bytes.', fix: 'For ids, timestamps and sizes, start with `long`. Widening later means a database migration.' },
    { mistake: 'Expecting assignment to copy a list or array', why: 'It copies for `int`, so it feels like it should copy for everything.', fix: 'Reference types share. Use `ToArray()`, `ToList()` or a copy constructor when you need independence.' },
    { mistake: 'Comparing doubles with `==`', why: 'It is how you compare every other number.', fix: 'Compare against a tolerance: `Math.Abs(a - b) < 0.0001`. Or use `decimal` if exactness is the requirement.' },
    { mistake: 'Reaching for `var` to dodge a type decision', why: 'It compiles, so the decision feels made.', fix: '`var` still picks a concrete type - `var price = 9.99;` silently gives you a `double`, not a `decimal`.' }
  ],
  realWorld: [
    'Every EF Core entity you map to a SQL table is a set of these decisions; `decimal(18,2)` in the database must line up with `decimal` in C#.',
    'API contracts break when an `int` id overflows - several well-known services have had outages from exactly this.',
    'Choosing `double` for a financial report is the kind of defect that passes every test and fails the annual audit.',
    'In Azure, telemetry and metrics are usually `double`; billing is always `decimal`.'
  ],
  resources: [
    { label: 'Print the limits', note: 'Run the third example. Seeing the real numbers once is worth more than reading a table three times.' }
  ]
},

/* ============================================================
   3. TYPE CONVERSION
   ============================================================ */
{
  topicId: 'fundamentals:type-conversion',
  title: 'Type Conversion',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: ['fundamentals:data-types'],
  objectives: [
    'Explain the difference between implicit and explicit conversion, and when each is allowed',
    'Convert text to numbers safely and handle input that is not a number',
    'Choose between `Parse`, `TryParse` and `Convert` and justify the choice',
    'Predict what casting loses, and avoid silent data loss',
    'Know why exceptions are the wrong tool for validating user input'
  ],
  sections: [
    {
      id: 'implicit',
      title: 'Implicit conversion: when C# does it for you',
      blocks: [
        { type: 'text', text: 'C# will convert automatically when the conversion **cannot lose information**. Widening an `int` into a `long` is always safe, so no ceremony is required.' },
        { type: 'code', code: `int small = 42;
long big = small;        // implicit - every int fits in a long
double d = small;        // implicit - every int fits in a double
decimal m = small;       // implicit

// int back = big;       // error - a long might not fit in an int` },
        { type: 'text', text: 'The rule is one-directional: narrow to wide is automatic, wide to narrow is not. That asymmetry is the compiler refusing to lose your data behind your back.' }
      ]
    },
    {
      id: 'explicit',
      title: 'Explicit conversion: casting, and what it costs',
      blocks: [
        { type: 'text', text: 'When a conversion **might** lose information, you must ask for it with a cast. The cast is you saying "I know, do it anyway".' },
        { type: 'code', code: `double price = 19.99;
int rounded = (int)price;     // 19 - the fraction is TRUNCATED, not rounded
Console.WriteLine(rounded);

long huge = 5_000_000_000;
int wrapped = (int)huge;      // 705032704 - silently wrong
Console.WriteLine(wrapped);` },
        { type: 'warning', text: 'A cast truncates toward zero - it does not round. `(int)19.99` is 19 and `(int)(-19.99)` is -19. If you want rounding, say so: `Math.Round`, `Math.Floor` or `Math.Ceiling`.' },
        { type: 'text', text: 'The second example is the dangerous one: the value did not fit, so the bits were simply thrown away and you got a plausible-looking but meaningless number. No exception, no warning.' }
      ]
    },
    {
      id: 'parsing',
      title: 'Text to number: Parse, TryParse and Convert',
      blocks: [
        { type: 'text', text: 'Converting text to a number is a completely different operation from casting, because text can be anything at all.' },
        { type: 'code', code: `string good = "42";
string bad = "forty-two";

int a = int.Parse(good);               // 42
// int b = int.Parse(bad);             // throws FormatException

if (int.TryParse(bad, out int result)) // returns false, result = 0
{
    Console.WriteLine(result);
}
else
{
    Console.WriteLine("Not a number");
}

int c = Convert.ToInt32("42");         // 42
int d = Convert.ToInt32((string?)null); // 0 - note: does NOT throw` },
        { type: 'table', head: ['Method', 'Bad input', 'null input', 'Use when'], rows: [
          ['`int.Parse`', 'throws `FormatException`', 'throws', 'You are certain the text is valid'],
          ['`int.TryParse`', 'returns `false`', 'returns `false`', 'Input came from a human or a file'],
          ['`Convert.ToInt32`', 'throws', 'returns `0`', 'Converting between known types']
        ] },
        { type: 'text', text: '`TryParse` is the one you will reach for most. It returns a `bool` and hands you the value through an `out` parameter, so a failure is an ordinary branch rather than an exception.' }
      ]
    },
    {
      id: 'exceptions',
      title: 'Why not just catch the exception?',
      blocks: [
        { type: 'text', text: 'It is tempting to write `try { int.Parse(input); } catch { ... }` and move on. Do not.' },
        { type: 'list', items: [
          '**Exceptions are expensive.** Throwing and catching costs thousands of times more than a branch. In a loop over user-supplied rows that is a real performance problem.',
          '**Exceptions are for the exceptional.** A user typing "abc" into an age field is entirely expected. Using an exception for it muddies the signal when something genuinely unexpected happens.',
          '**Catch blocks swallow too much.** A bare `catch` hides the `NullReferenceException` you did not know about alongside the `FormatException` you did.'
        ] },
        { type: 'note', text: 'Rule of thumb: if invalid input is a normal part of the flow, use `TryParse`. If invalid input means a bug or a corrupted file, let `Parse` throw and handle it further up.' }
      ]
    },
    {
      id: 'tostring',
      title: 'Number to text',
      blocks: [
        { type: 'text', text: 'Going the other way is easier because it always succeeds.' },
        { type: 'code', code: `int count = 42;
decimal price = 19.5m;

string a = count.ToString();          // "42"
string b = price.ToString("F2");      // "19.50"
string c = price.ToString("C");       // currency, culture-dependent
string d = $"{price:F2}";             // same as b, usually clearer
string e = "Total: " + count;         // implicit ToString on concatenation` },
        { type: 'text', text: 'Format specifiers are worth learning: `F2` for fixed decimals, `C` for currency, `P` for percentage, `N0` for thousands separators, `X` for hexadecimal.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Safe input handling with TryParse',
      code: `string[] inputs = { "42", "abc", "", "-7", "3.5" };

foreach (string input in inputs)
{
    if (int.TryParse(input, out int value))
    {
        Console.WriteLine($"'{input}' -> {value}");
    }
    else
    {
        Console.WriteLine($"'{input}' -> not a valid integer");
    }
}`,
      walkthrough: [
        { line: 'if (int.TryParse(input, out int value))', note: '`out int value` declares the variable inline. If parsing succeeds it holds the number; if it fails it holds 0 and the method returns `false`.' },
        { line: "'3.5' -> not a valid integer", note: '`int.TryParse` rejects anything with a decimal point. Use `decimal.TryParse` or `double.TryParse` when fractions are allowed.' }
      ],
      output: "'42' -> 42\n'abc' -> not a valid integer\n'' -> not a valid integer\n'-7' -> -7\n'3.5' -> not a valid integer",
      takeaway: 'No exceptions, no try/catch, and every case is handled explicitly. This is the shape of nearly all real input validation.'
    },
    {
      id: 'ex2',
      title: 'What a cast quietly throws away',
      code: `double a = 9.99;
double b = -9.99;

Console.WriteLine((int)a);              // 9
Console.WriteLine((int)b);              // -9
Console.WriteLine(Math.Round(a));       // 10
Console.WriteLine(Math.Floor(a));       // 9
Console.WriteLine(Math.Ceiling(a));     // 10
Console.WriteLine(Math.Round(2.5));     // 2  (banker's rounding!)
Console.WriteLine(Math.Round(3.5));     // 4`,
      walkthrough: [
        { line: 'Console.WriteLine((int)b);', note: 'Truncation is toward **zero**, not downward. `(int)(-9.99)` is -9, while `Math.Floor(-9.99)` is -10.' },
        { line: 'Console.WriteLine(Math.Round(2.5));', note: 'C# uses banker’s rounding by default - ties go to the **even** number. This surprises almost everyone the first time.' }
      ],
      output: '9\n-9\n10\n9\n10\n2\n4',
      takeaway: 'If rounding matters, be explicit. `Math.Round(value, MidpointRounding.AwayFromZero)` gives you the behaviour most people expect.'
    },
    {
      id: 'ex3',
      title: 'Widening is free, narrowing is a decision',
      code: `int i = 300;

long l = i;              // implicit, safe
double d = i;            // implicit, safe
byte b = (byte)i;        // explicit - 300 does not fit in a byte!

Console.WriteLine($"{l} {d} {b}");`,
      walkthrough: [
        { line: 'byte b = (byte)i;', note: 'A `byte` holds 0-255. 300 wraps around to 44 (300 - 256). The cast is you taking responsibility for that.' }
      ],
      output: '300 300 44',
      takeaway: 'Every cast is a claim that you have thought about the range. If you have not, it is a bug waiting for a big enough input.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:type-conversion#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'A web form gives you the text the user typed into an "age" box. Which is the right way to turn it into a number?',
      options: ['`int.Parse(input)`', '`int.TryParse(input, out int age)`', '`(int)input`', '`Convert.ToInt32(input)` inside a try/catch'],
      answer: 1,
      hints: [
        'Users type all sorts of things. Is invalid input here unexpected, or entirely normal?',
        'Which option handles bad input as an ordinary branch rather than an exception?'
      ],
      explanation: '`TryParse` treats invalid input as a normal outcome you branch on, which is exactly what it is when a human is typing.',
      solution: '`int.TryParse(input, out int age)`'
    },
    {
      id: 'fundamentals:type-conversion#g2',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `double value = 7.89;
Console.WriteLine((int)value);`,
      accept: ['7'],
      hints: [
        'A cast from a floating point type to an integer does not round.',
        'It truncates toward zero - the fractional part is simply discarded.'
      ],
      explanation: 'Casting truncates. Use `Math.Round` if you wanted 8.',
      solution: '7'
    },
    {
      id: 'fundamentals:type-conversion#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Convert three strings to integers safely and print the total of the ones that were valid.\n\nGiven `"10"`, `"twenty"` and `"30"`, print exactly:\n\n```\nValid: 2\nTotal: 40\n```',
      starterCode: `string[] inputs = { "10", "twenty", "30" };
int total = 0;
int validCount = 0;

// Loop over the inputs and add up only the valid numbers


Console.WriteLine($"Valid: {validCount}");
Console.WriteLine($"Total: {total}");`,
      expectedConcepts: ['TryParse'],
      checks: [
        { kind: 'regex', value: 'TryParse', message: 'Uses TryParse rather than Parse' },
        { kind: 'notContains', value: 'catch', message: 'Does not use exceptions for expected input' }
      ],
      run: { expectedOutput: 'Valid: 2\nTotal: 40' },
      hints: [
        'Loop with `foreach (string input in inputs)`.',
        'Inside the loop use `if (int.TryParse(input, out int value))`.',
        'When it succeeds, add `value` to `total` and increment `validCount`.'
      ],
      solution: `string[] inputs = { "10", "twenty", "30" };
int total = 0;
int validCount = 0;

foreach (string input in inputs)
{
    if (int.TryParse(input, out int value))
    {
        total += value;
        validCount++;
    }
}

Console.WriteLine($"Valid: {validCount}");
Console.WriteLine($"Total: {total}");`,
      explanation: 'No try/catch anywhere. Invalid input is just a branch that does nothing.'
    },
    {
      id: 'fundamentals:type-conversion#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Demonstrate the three rounding behaviours side by side.\n\nFor the value 2.5 and the value 3.5, print the result of a cast, `Math.Round`, `Math.Floor`, `Math.Ceiling` and `Math.Round` with `MidpointRounding.AwayFromZero`.\n\nPrint exactly:\n\n```\n2.5 -> cast 2, round 2, floor 2, ceil 3, away 3\n3.5 -> cast 3, round 4, floor 3, ceil 4, away 4\n```',
      starterCode: ``,
      expectedConcepts: ['Math.Round', 'Math.Floor', 'Math.Ceiling', 'MidpointRounding'],
      checks: [
        { kind: 'regex', value: 'Math\\.Round', message: 'Uses Math.Round' },
        { kind: 'regex', value: 'Math\\.Floor', message: 'Uses Math.Floor' },
        { kind: 'regex', value: 'Math\\.Ceiling', message: 'Uses Math.Ceiling' },
        { kind: 'regex', value: 'MidpointRounding\\.AwayFromZero', message: 'Shows away-from-zero rounding' }
      ],
      run: { expectedOutput: '2.5 -> cast 2, round 2, floor 2, ceil 3, away 3\n3.5 -> cast 3, round 4, floor 3, ceil 4, away 4' },
      hints: [
        'Write one `Console.WriteLine` per value, using interpolation for all five results.',
        '`Math.Round(2.5)` uses banker’s rounding and gives 2; `Math.Round(3.5)` gives 4.',
        '`Math.Round(2.5, MidpointRounding.AwayFromZero)` gives 3. Cast the Math results to `int` so they print without a decimal point.'
      ],
      solution: `double a = 2.5;
double b = 3.5;

Console.WriteLine($"2.5 -> cast {(int)a}, round {(int)Math.Round(a)}, floor {(int)Math.Floor(a)}, ceil {(int)Math.Ceiling(a)}, away {(int)Math.Round(a, MidpointRounding.AwayFromZero)}");
Console.WriteLine($"3.5 -> cast {(int)b}, round {(int)Math.Round(b)}, floor {(int)Math.Floor(b)}, ceil {(int)Math.Ceiling(b)}, away {(int)Math.Round(b, MidpointRounding.AwayFromZero)}");`,
      explanation: 'Banker’s rounding is the default because, over many values, rounding ties to even avoids the upward bias you get from always rounding 0.5 up. It is the right default for statistics and the wrong one for a shop till - which is why `MidpointRounding` exists.'
    },
    {
      id: 'fundamentals:type-conversion#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write a mini input validator.\n\nGiven the inputs `"25"`, `"-3"`, `"abc"` and `"150"`, classify each as a valid age (0 to 120), an out-of-range number, or not a number at all.\n\nPrint exactly:\n\n```\n25: valid\n-3: out of range\nabc: not a number\n150: out of range\n```',
      starterCode: `string[] inputs = { "25", "-3", "abc", "150" };

// Classify each one
`,
      expectedConcepts: ['TryParse'],
      checks: [
        { kind: 'regex', value: 'TryParse', message: 'Uses TryParse' },
        { kind: 'regex', value: '(<\\s*0|>=\\s*0|0\\s*<=|0\\s*>)', message: 'Checks the lower bound' },
        { kind: 'regex', value: '120', message: 'Checks the upper bound' }
      ],
      run: { expectedOutput: '25: valid\n-3: out of range\nabc: not a number\n150: out of range' },
      hints: [
        'First decide whether it is a number at all, then whether it is in range. Two separate questions.',
        'Structure it as `if (!int.TryParse(...)) { not a number } else if (out of range) { ... } else { valid }`.',
        'The range test is `age >= 0 && age <= 120`.'
      ],
      solution: `string[] inputs = { "25", "-3", "abc", "150" };

foreach (string input in inputs)
{
    if (!int.TryParse(input, out int age))
    {
        Console.WriteLine($"{input}: not a number");
    }
    else if (age < 0 || age > 120)
    {
        Console.WriteLine($"{input}: out of range");
    }
    else
    {
        Console.WriteLine($"{input}: valid");
    }
}`,
      explanation: 'Notice the ordering: you cannot range-check something that is not a number yet. Validation almost always has this shape - parse first, then apply business rules.'
    },
    {
      id: 'fundamentals:type-conversion#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain when you would use `int.Parse` rather than `int.TryParse`, and why using a try/catch around `Parse` for user input is a poor design.',
      expectedConcepts: ['expected|normal|routine|user', 'exception|throw', 'performance|slow|cost|expensive', 'bug|programming error|unexpected'],
      minLength: 140,
      hints: [
        'Think about where the text came from and whether invalid text is surprising.',
        'What does throwing an exception cost compared to an if-statement?',
        'What does a bare catch block hide?'
      ],
      solution: 'Use `Parse` when the text is under your control and invalid input would mean a bug - for example a constant in your own code or a value you have already validated. Use `TryParse` whenever the text came from a human, a file or an API, because invalid input there is expected rather than exceptional. Wrapping `Parse` in a try/catch for user input is poor design because exceptions are far more expensive than a branch, because it signals "something went wrong" for something entirely routine, and because the catch block will also swallow genuine bugs like a null reference.',
      explanation: 'The underlying principle - use exceptions for the exceptional - comes back repeatedly in the Professional C# phase.'
    },
    {
      id: 'fundamentals:type-conversion#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This average is wrong. Find out why.',
      brokenCode: `int totalScore = 17;
int studentCount = 4;

double average = totalScore / studentCount;

Console.WriteLine($"Average: {average}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`average` should be a decimal',
            'Two ints are divided first, so the fraction is lost before the result is stored in the double',
            '`studentCount` cannot be an int',
            'Integer division is not allowed in C#'
          ],
          answer: 1,
          label: 'Identified integer division'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What value does `17 / 4` produce when both operands are `int`?',
          accept: ['4'],
          label: 'Knew the result of integer division'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Average: 4.25`.',
          starterCode: `int totalScore = 17;
int studentCount = 4;

double average = totalScore / studentCount;

Console.WriteLine($"Average: {average}");`,
          checks: [
            { kind: 'regex', value: '\\(double\\)|\\(decimal\\)|1\\.0|d\\s*/', message: 'Forces floating point division' }
          ],
          run: { expectedOutput: 'Average: 4.25' },
          label: 'Fixed the division'
        }
      ],
      hints: [],
      solution: `int totalScore = 17;
int studentCount = 4;

double average = (double)totalScore / studentCount;

Console.WriteLine($"Average: {average}");`,
      explanation: 'When both operands are `int`, C# performs **integer division** and discards the remainder - 17 / 4 is 4, not 4.25. Assigning to a `double` afterwards is too late; the information is already gone. Casting one operand first makes the whole expression floating point. This is one of the most common arithmetic bugs in C#.'
    },
    {
      id: 'fundamentals:type-conversion#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This crashes on some inputs. Make it robust.',
      brokenCode: `string[] quantities = { "3", "7", "", "12" };
int total = 0;

foreach (string q in quantities)
{
    total += int.Parse(q);
}

Console.WriteLine($"Total: {total}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What happens when the loop reaches the empty string?',
          options: [
            '`int.Parse` returns 0 and the loop continues',
            '`int.Parse` throws a `FormatException` and the program crashes',
            'The empty string is skipped automatically',
            'The compiler refuses to build the program'
          ],
          answer: 1,
          label: 'Identified the FormatException'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which method should be used instead, given the data may contain anything?',
          accept: ['tryparse', 'int.tryparse'],
          label: 'Named the right tool'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so invalid entries are skipped and the program prints `Total: 22`.',
          starterCode: `string[] quantities = { "3", "7", "", "12" };
int total = 0;

foreach (string q in quantities)
{
    total += int.Parse(q);
}

Console.WriteLine($"Total: {total}");`,
          checks: [
            { kind: 'regex', value: 'TryParse', message: 'Uses TryParse' },
            { kind: 'notContains', value: 'int.Parse', message: 'No longer uses Parse on untrusted data' }
          ],
          run: { expectedOutput: 'Total: 22' },
          label: 'Made it robust'
        }
      ],
      hints: [],
      solution: `string[] quantities = { "3", "7", "", "12" };
int total = 0;

foreach (string q in quantities)
{
    if (int.TryParse(q, out int value))
    {
        total += value;
    }
}

Console.WriteLine($"Total: {total}");`,
      explanation: 'Data from files, forms and APIs contains blanks, stray spaces and typos. `TryParse` lets you decide what to do about each one instead of letting the whole batch fail on row 3.'
    },
    {
      id: 'fundamentals:type-conversion#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: you are importing a CSV column of prices and some rows are dirty.\n\nGiven the values `"19.99"`, `" 5.50 "` (note the spaces), `"free"`, `"-2.00"` and `"12"`, produce an import report. A price is valid if it parses and is not negative. Trim whitespace before parsing.\n\nPrint exactly:\n\n```\nImported: 3\nRejected: 2\nTotal value: 37.49\n```',
      starterCode: `string[] rows = { "19.99", " 5.50 ", "free", "-2.00", "12" };
`,
      expectedConcepts: ['decimal.TryParse', 'Trim'],
      checks: [
        { kind: 'regex', value: 'decimal\\.TryParse', message: 'Parses as decimal, not double' },
        { kind: 'regex', value: 'Trim\\(\\)', message: 'Trims whitespace before parsing' },
        { kind: 'regex', value: '<\\s*0|>=\\s*0', message: 'Rejects negative prices' }
      ],
      run: { expectedOutput: 'Imported: 3\nRejected: 2\nTotal value: 37.49' },
      hints: [
        'Use `decimal.TryParse` because these are prices.',
        'Call `.Trim()` on each row before parsing to deal with the stray spaces.',
        'A row is rejected if it does not parse **or** if it parses to a negative number.'
      ],
      solution: `string[] rows = { "19.99", " 5.50 ", "free", "-2.00", "12" };

int imported = 0;
int rejected = 0;
decimal totalValue = 0m;

foreach (string row in rows)
{
    if (decimal.TryParse(row.Trim(), out decimal price) && price >= 0)
    {
        imported++;
        totalValue += price;
    }
    else
    {
        rejected++;
    }
}

Console.WriteLine($"Imported: {imported}");
Console.WriteLine($"Rejected: {rejected}");
Console.WriteLine($"Total value: {totalValue}");`,
      explanation: 'Real import code looks almost exactly like this. Note that `&&` short-circuits: if `TryParse` returns false, the range check never runs, so `price` is never read when it is meaningless.'
    },
    {
      id: 'fundamentals:type-conversion#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Robust converter',
      prompt: 'No hints.\n\nGiven the inputs `"42"`, `"3.7"`, `"true"`, `"2024-01-15"` and `"nonsense"`, work out what each string can be converted to, testing in this order: int, decimal, bool, DateTime. Report the first type that succeeds, or `unknown`.\n\nPrint exactly:\n\n```\n42 -> int\n3.7 -> decimal\ntrue -> bool\n2024-01-15 -> DateTime\nnonsense -> unknown\n```',
      starterCode: ``,
      expectedConcepts: ['TryParse'],
      checks: [
        { kind: 'regex', value: 'int\\.TryParse', message: 'Tests for int' },
        { kind: 'regex', value: 'decimal\\.TryParse', message: 'Tests for decimal' },
        { kind: 'regex', value: 'bool\\.TryParse', message: 'Tests for bool' },
        { kind: 'regex', value: 'DateTime\\.TryParse', message: 'Tests for DateTime' },
        { kind: 'notContains', value: 'catch', message: 'Uses no exceptions' }
      ],
      run: { expectedOutput: '42 -> int\n3.7 -> decimal\ntrue -> bool\n2024-01-15 -> DateTime\nnonsense -> unknown' },
      hints: [],
      solution: `string[] inputs = { "42", "3.7", "true", "2024-01-15", "nonsense" };

foreach (string input in inputs)
{
    string type;

    if (int.TryParse(input, out _)) type = "int";
    else if (decimal.TryParse(input, out _)) type = "decimal";
    else if (bool.TryParse(input, out _)) type = "bool";
    else if (DateTime.TryParse(input, out _)) type = "DateTime";
    else type = "unknown";

    Console.WriteLine($"{input} -> {type}");
}`,
      explanation: 'Order matters: `"42"` would also parse as a `decimal`, so testing int first is what makes the output deterministic. The `out _` discard says "I only care whether it worked, not what the value was".'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:type-conversion#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int a = 7;
int b = 2;
Console.WriteLine(a / b);`,
      accept: ['3'],
      explanation: 'Both operands are `int`, so this is integer division: the remainder is discarded. Cast one side to `double` to get 3.5.'
    },
    {
      id: 'fundamentals:type-conversion#q2', type: 'mcq',
      prompt: 'Which conversion needs an explicit cast?',
      options: ['`int` to `long`', '`int` to `double`', '`double` to `int`', '`int` to `decimal`'],
      answer: 2,
      explanation: 'Narrowing conversions can lose information, so C# makes you ask for them explicitly.'
    },
    {
      id: 'fundamentals:type-conversion#q3', type: 'mcq',
      prompt: 'What does `Convert.ToInt32(null)` return?',
      options: ['`0`', 'It throws a `FormatException`', 'It throws an `ArgumentNullException`', '`-1`'],
      answer: 0,
      explanation: '`Convert.ToInt32` returns 0 for null, unlike `int.Parse` which throws. That silent 0 has caused a lot of confusing bugs.'
    },
    {
      id: 'fundamentals:type-conversion#q4', type: 'explain',
      prompt: 'Your colleague writes `int age = (int)ageTextBox.Text;`. Explain why this will not compile and what they should write instead.',
      expectedConcepts: ['cast|casting', 'string|text', 'parse|tryparse'],
      minLength: 70,
      explanation: 'You cannot cast a `string` to an `int` - casting works between related types, and text is not a number that happens to be stored differently. Converting text requires parsing: `int.TryParse(ageTextBox.Text, out int age)`.'
    },
    {
      id: 'fundamentals:type-conversion#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `Console.WriteLine(Math.Round(4.5));
Console.WriteLine(Math.Round(5.5));`,
      accept: ['4\n5', '4 5', '45', '4\r\n5', '4 6', '4\n6'],
      acceptContains: ['4'],
      explanation: 'Banker’s rounding sends ties to the nearest even number, so 4.5 becomes 4 and 5.5 becomes 6.'
    }
  ],
  commonMistakes: [
    { mistake: 'Integer division where a fraction was intended', why: '`total / count` looks obviously correct until both are `int`.', fix: 'Cast one operand: `(double)total / count`. Get into the habit of noticing when both sides of a `/` are integers.' },
    { mistake: 'Using `Parse` on user input', why: 'It reads more cleanly than `TryParse`.', fix: 'Use `TryParse` for anything a human, file or API supplied. Save `Parse` for values you control.' },
    { mistake: 'Expecting a cast to round', why: '`(int)9.99` looks like it should be 10.', fix: 'Casting truncates toward zero. Use `Math.Round` and choose a `MidpointRounding` mode explicitly.' },
    { mistake: 'try/catch as input validation', why: 'It handles every bad case with one block.', fix: 'Exceptions are slow and hide real bugs. Branch on `TryParse` instead.' },
    { mistake: 'Casting a wide type down without checking the range', why: 'The compiler stops complaining once the cast is there.', fix: 'A cast silences the compiler, it does not make the value fit. Check the range, or use `checked`.' }
  ],
  realWorld: [
    'Every ASP.NET Core model binder is doing this conversion for you - understanding it is how you debug "the value was not in the expected format" errors.',
    'CSV and Excel imports are almost entirely `TryParse` plus range checks; dirty data is the norm, not the exception.',
    'The integer division bug appears constantly in reporting code, where a percentage silently comes out as 0.',
    'Banker’s rounding differences between systems are a classic cause of one-penny discrepancies between a .NET service and a database.'
  ],
  resources: [
    { label: 'Run example 2', note: 'The rounding table is worth seeing with your own eyes once - especially the banker’s rounding line.' }
  ]
}

,
/* ============================================================
   4. OPERATORS
   ============================================================ */
{
  topicId: 'fundamentals:operators',
  title: 'Operators',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 40,
  prerequisites: ['fundamentals:data-types'],
  objectives: [
    'Use arithmetic, comparison and logical operators correctly',
    'Explain short-circuit evaluation and why it is a correctness feature, not an optimisation',
    'Use the modulo operator for the problems it is actually good at',
    'Predict the result of expressions involving operator precedence',
    'Know when the null-coalescing and conditional operators make code clearer, and when they hide bugs'
  ],
  sections: [
    {
      id: 'arith',
      title: 'Arithmetic',
      blocks: [
        { type: 'code', code: `int a = 17, b = 5;

Console.WriteLine(a + b);   // 22
Console.WriteLine(a - b);   // 12
Console.WriteLine(a * b);   // 85
Console.WriteLine(a / b);   // 3   <- integer division, remainder discarded
Console.WriteLine(a % b);   // 2   <- the remainder itself` },
        { type: 'warning', text: 'The `/` operator changes behaviour based on the **types** of its operands, not the values. Two ints give integer division. This is the single most common arithmetic surprise in C#.' },
        { type: 'text', text: 'The modulo operator `%` gives the remainder. It is far more useful than it first appears: testing divisibility, wrapping around a range, alternating between two states and extracting digits are all `%` problems.' },
        { type: 'code', caption: 'What modulo is actually for', code: `bool isEven = number % 2 == 0;
bool isDivisibleBy3 = number % 3 == 0;
int lastDigit = number % 10;
int wrappedIndex = (index + 1) % arrayLength;   // never runs off the end` }
      ]
    },
    {
      id: 'comparison',
      title: 'Comparison and equality',
      blocks: [
        { type: 'table', head: ['Operator', 'Meaning'], rows: [
          ['`==`', 'equal to'],
          ['`!=`', 'not equal to'],
          ['`<` `>`', 'less / greater than'],
          ['`<=` `>=`', 'less / greater than or equal']
        ] },
        { type: 'text', text: 'Every comparison produces a `bool`. This is stricter than languages where `if (5)` is valid - in C# the condition must actually be a boolean.' },
        { type: 'note', text: 'For reference types `==` compares **references** by default, not contents. `string` is the exception: it overloads `==` to compare the text. For your own classes you will learn to override equality in Core C#.' }
      ]
    },
    {
      id: 'logical',
      title: 'Logical operators and short-circuiting',
      blocks: [
        { type: 'code', code: `bool a = true, b = false;

Console.WriteLine(a && b);   // false - AND
Console.WriteLine(a || b);   // true  - OR
Console.WriteLine(!a);       // false - NOT` },
        { type: 'text', text: '`&&` and `||` **short-circuit**: if the left side settles the answer, the right side is never evaluated. That is not a micro-optimisation - it is what makes guard clauses possible.' },
        { type: 'code', caption: 'Short-circuiting as a safety mechanism', code: `// If text is null, the left side is false and Length is never touched.
if (text != null && text.Length > 0)
{
    Console.WriteLine(text);
}

// Reverse the order and this throws NullReferenceException:
// if (text.Length > 0 && text != null)` },
        { type: 'warning', text: 'The single-character `&` and `|` do the same logic but do **not** short-circuit - both sides always run. Using `&` where you meant `&&` turns a safe null check into a crash.' }
      ]
    },
    {
      id: 'precedence',
      title: 'Precedence, and why brackets are free',
      blocks: [
        { type: 'text', text: 'Operators bind in a fixed order: `*` `/` `%` before `+` `-`, arithmetic before comparison, comparison before `&&`, and `&&` before `||`.' },
        { type: 'code', code: `Console.WriteLine(2 + 3 * 4);        // 14, not 20
Console.WriteLine((2 + 3) * 4);      // 20

bool result = a || b && c;           // means: a || (b && c)
bool clearer = a || (b && c);        // identical, but nobody has to check` },
        { type: 'text', text: 'You do not need to memorise the whole table. Memorise `*` before `+`, and bracket everything else. Brackets cost nothing at runtime and save the reader a lookup.' }
      ]
    },
    {
      id: 'null-ops',
      title: 'Null-aware operators',
      blocks: [
        { type: 'code', code: `string? name = null;

string display = name ?? "Anonymous";     // ?? supplies a fallback
int? length = name?.Length;               // ?. stops at null, gives null
name ??= "Default";                       // ??= assigns only if null

// The conditional (ternary) operator
string label = count == 1 ? "item" : "items";` },
        { type: 'text', text: 'These three remove a great deal of defensive `if` noise. `?.` in particular turns a four-line null check into one expression.' },
        { type: 'whenNot', text: 'Do not chain the ternary operator. `a ? b : c ? d : e ? f : g` is technically valid and genuinely unreadable. Two levels is the limit; beyond that use `if` or a `switch` expression.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Modulo doing real work',
      code: `int[] numbers = { 12, 7, 20, 33, 8 };

foreach (int n in numbers)
{
    string parity = n % 2 == 0 ? "even" : "odd";
    Console.WriteLine($"{n} is {parity}, last digit {n % 10}");
}

// FizzBuzz, the classic modulo exercise
for (int i = 1; i <= 15; i++)
{
    if (i % 15 == 0) Console.Write("FizzBuzz ");
    else if (i % 3 == 0) Console.Write("Fizz ");
    else if (i % 5 == 0) Console.Write("Buzz ");
    else Console.Write(i + " ");
}
Console.WriteLine();`,
      walkthrough: [
        { line: 'n % 2 == 0 ? "even" : "odd"', note: 'Precedence at work: `%` runs first, then `==`, then the ternary. No brackets needed, though they would not hurt.' },
        { line: 'if (i % 15 == 0)', note: 'Divisible by both 3 and 5 means divisible by 15. Checking it **first** matters - otherwise 15 would print "Fizz" and stop.' }
      ],
      output: '12 is even, last digit 2\n7 is odd, last digit 7\n20 is even, last digit 0\n33 is odd, last digit 3\n8 is even, last digit 8\n1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz',
      takeaway: 'Order of conditions is a correctness concern, not a style one. The most specific case goes first.'
    },
    {
      id: 'ex2',
      title: 'Short-circuiting protecting you',
      code: `string? maybeText = null;

// Safe: && stops as soon as the left side is false
if (maybeText != null && maybeText.Length > 3)
{
    Console.WriteLine("Long text");
}
else
{
    Console.WriteLine("No usable text");
}

// The same idea with ?. and ??
int length = maybeText?.Length ?? 0;
Console.WriteLine($"Length: {length}");`,
      walkthrough: [
        { line: 'maybeText != null && maybeText.Length > 3', note: '`maybeText != null` is false, so `&&` returns false immediately and `.Length` is never evaluated. Swap the order and this line throws.' },
        { line: 'maybeText?.Length ?? 0', note: '`?.` yields null instead of throwing; `??` then substitutes 0. Two operators replacing a five-line if/else.' }
      ],
      output: 'No usable text\nLength: 0',
      takeaway: 'Guard first, use second. That ordering is a habit worth building now.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:operators#g1',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `Console.WriteLine(2 + 3 * 4);`,
      accept: ['14'],
      hints: ['Multiplication binds tighter than addition.', 'So it is 2 + (3 * 4), not (2 + 3) * 4.'],
      explanation: '`*` has higher precedence than `+`, so the multiplication happens first.',
      solution: '14'
    },
    {
      id: 'fundamentals:operators#g2',
      type: 'mcq', level: 2, difficulty: 'Medium',
      prompt: 'Which expression is safe when `name` might be null?',
      options: [
        '`if (name.Length > 0 && name != null)`',
        '`if (name != null && name.Length > 0)`',
        '`if (name.Length > 0 & name != null)`',
        '`if (name != null & name.Length > 0)`'
      ],
      answer: 1,
      hints: [
        'The null check has to happen before anything reads a member of the object.',
        'Also check which operator short-circuits: `&&` does, `&` does not.'
      ],
      explanation: 'Only option 2 both puts the null check first and uses the short-circuiting `&&`. Option 4 checks null first but `&` evaluates both sides regardless, so it still throws.',
      solution: '`if (name != null && name.Length > 0)`'
    },
    {
      id: 'fundamentals:operators#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Print whether each of the numbers 10, 15, 21 and 8 is divisible by 3, using the modulo operator.\n\nPrint exactly:\n\n```\n10 no\n15 yes\n21 yes\n8 no\n```',
      starterCode: `int[] numbers = { 10, 15, 21, 8 };

`,
      expectedConcepts: ['%'],
      checks: [
        { kind: 'regex', value: '%\\s*3', message: 'Uses modulo 3' },
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Loops over the numbers' }
      ],
      run: { expectedOutput: '10 no\n15 yes\n21 yes\n8 no' },
      hints: [
        'A number is divisible by 3 when the remainder of dividing by 3 is zero.',
        'That is `n % 3 == 0`.',
        'Use the ternary operator to pick between "yes" and "no" inside the interpolation.'
      ],
      solution: `int[] numbers = { 10, 15, 21, 8 };

foreach (int n in numbers)
{
    Console.WriteLine($"{n} {(n % 3 == 0 ? "yes" : "no")}");
}`,
      explanation: 'Note the extra brackets around the ternary inside the interpolated string - without them the `:` would be read as a format specifier.'
    },
    {
      id: 'fundamentals:operators#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Write FizzBuzz for 1 to 20, one value per line.\n\nMultiples of 3 print `Fizz`, multiples of 5 print `Buzz`, multiples of both print `FizzBuzz`, everything else prints the number.',
      starterCode: ``,
      expectedConcepts: ['%'],
      checks: [
        { kind: 'regex', value: '%', message: 'Uses the modulo operator' },
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses a loop' },
        { kind: 'notContains', value: '"Fizz" "Buzz" "FizzBuzz"', message: 'Does not hard-code the sequence' }
      ],
      run: { expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz' },
      hints: [
        'Loop from 1 to 20 inclusive.',
        'Check divisibility by 15 first, then 3, then 5, then fall through to the number itself.',
        'Checking 15 first is essential - otherwise 15 matches the `% 3` branch and never reaches the combined case.'
      ],
      solution: `for (int i = 1; i <= 20; i++)
{
    if (i % 15 == 0) Console.WriteLine("FizzBuzz");
    else if (i % 3 == 0) Console.WriteLine("Fizz");
    else if (i % 5 == 0) Console.WriteLine("Buzz");
    else Console.WriteLine(i);
}`,
      explanation: 'The classic interview question, and it really is about one thing: does the candidate order the conditions from most specific to least specific.'
    },
    {
      id: 'fundamentals:operators#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Extract the digits of the number 4821 and print them one per line, most significant first.\n\nUse only arithmetic - no string conversion.\n\nPrint exactly:\n\n```\n4\n8\n2\n1\n```',
      starterCode: `int number = 4821;
`,
      expectedConcepts: ['%', '/'],
      checks: [
        { kind: 'regex', value: '%', message: 'Uses modulo to pull out a digit' },
        { kind: 'regex', value: '/', message: 'Uses division to move along' },
        { kind: 'notContains', value: 'ToString', message: 'Does not convert to a string' }
      ],
      run: { expectedOutput: '4\n8\n2\n1' },
      hints: [
        '`n % 10` gives you the **last** digit; `n / 10` removes it.',
        'That produces the digits in reverse order, so you need to turn them around.',
        'Either collect them into a list and reverse it, or divide by a decreasing power of ten.'
      ],
      solution: `int number = 4821;
int divisor = 1000;

while (divisor > 0)
{
    Console.WriteLine(number / divisor % 10);
    divisor /= 10;
}`,
      explanation: '`number / divisor` shifts the digit you want into the ones place, and `% 10` isolates it. Integer division is doing the work here - the same behaviour that trips people up is exactly what makes this neat.'
    },
    {
      id: 'fundamentals:operators#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain short-circuit evaluation, and give a concrete example where replacing `&&` with `&` would crash a program.',
      expectedConcepts: ['short|stop|skip|not evaluated', 'null', 'left|first', 'both sides|always'],
      minLength: 120,
      hints: [
        'What does `&&` do when the left operand is already false?',
        'Think about a null check followed by a member access.',
        'What is different about `&`?'
      ],
      solution: '`&&` evaluates its left operand first and, if that is false, skips the right operand entirely because the answer is already settled. That makes `if (user != null && user.Name.Length > 0)` safe - when `user` is null the second half never runs. `&` performs the same logical AND but always evaluates both sides, so the identical line written with `&` would dereference a null `user` and throw a NullReferenceException.',
      explanation: 'This is why `&&` is called a conditional operator: the evaluation of the right side is conditional on the left.'
    },
    {
      id: 'fundamentals:operators#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This discount calculation gives the wrong answer.',
      brokenCode: `decimal price = 100m;
decimal discountPercent = 20m;

decimal finalPrice = price - discountPercent / 100 * price;
decimal wrong = (price - discountPercent) / 100 * price;

Console.WriteLine(wrong);`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong with the `wrong` calculation?',
          options: [
            'The brackets change the meaning - it subtracts the percentage from the price before dividing',
            'Decimal cannot be divided by an int',
            'The discount should be added, not subtracted',
            'The variables are declared in the wrong order'
          ],
          answer: 0,
          label: 'Identified the bracket mistake'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What value does the `wrong` expression produce?',
          accept: ['80'],
          label: 'Worked out the wrong value'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Print the correctly discounted price. It prints `80.0` - decimal keeps the scale of the calculation.',
          starterCode: `decimal price = 100m;
decimal discountPercent = 20m;

decimal wrong = (price - discountPercent) / 100 * price;

Console.WriteLine(wrong);`,
          checks: [
            { kind: 'regex', value: 'price\\s*-|1\\s*-', message: 'Subtracts the discount from the price' }
          ],
          run: { expectedOutput: '80.0' },
          label: 'Fixed the expression'
        }
      ],
      hints: [],
      solution: `decimal price = 100m;
decimal discountPercent = 20m;

decimal finalPrice = price - (discountPercent / 100 * price);

Console.WriteLine(finalPrice);`,
      explanation: 'Both expressions happen to produce the same answer for these particular numbers, which is exactly what makes this bug dangerous - it passes the first test you write. Change the price to 50 and they diverge immediately. Brackets that state your intent are free.\n\nThe output is `80.0` rather than `80` because `decimal` carries the scale of the calculation through - another reminder that decimal arithmetic tracks precision deliberately.'
    },
    {
      id: 'fundamentals:operators#d2',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This crashes when the name is missing.',
      brokenCode: `string? name = null;

if (name.Length > 0 && name != null)
{
    Console.WriteLine($"Hello {name}");
}
else
{
    Console.WriteLine("Hello stranger");
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The null check happens after the property access, so it never protects anything',
            '`string?` is not a valid type',
            '`&&` should be `&`',
            'The else branch is unreachable'
          ],
          answer: 0,
          label: 'Spotted the ordering mistake'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which exception does this throw?',
          accept: ['nullreferenceexception', 'null reference exception'],
          acceptContains: ['nullreference'],
          label: 'Named the exception'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Hello stranger`.',
          starterCode: `string? name = null;

if (name.Length > 0 && name != null)
{
    Console.WriteLine($"Hello {name}");
}
else
{
    Console.WriteLine("Hello stranger");
}`,
          checks: [
            { kind: 'regex', value: 'name\\s*!=\\s*null|IsNullOrEmpty|name\\?\\.', message: 'Checks for null before using the value' }
          ],
          run: { expectedOutput: 'Hello stranger' },
          label: 'Fixed the guard'
        }
      ],
      hints: [],
      solution: `string? name = null;

if (!string.IsNullOrEmpty(name))
{
    Console.WriteLine($"Hello {name}");
}
else
{
    Console.WriteLine("Hello stranger");
}`,
      explanation: 'Short-circuiting only helps if the guard comes first. `string.IsNullOrEmpty` expresses the whole intent in one call and is the idiomatic answer here.'
    },
    {
      id: 'fundamentals:operators#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: work out whether an order qualifies for free delivery.\n\nAn order qualifies if the total is 50 or more, **or** the customer is a member and the total is 25 or more. Orders to a restricted region never qualify.\n\nTest these four orders and print `yes` or `no` for each:\n\n1. total 60, not a member, not restricted\n2. total 30, member, not restricted\n3. total 30, not a member, not restricted\n4. total 100, member, restricted\n\nPrint exactly:\n\n```\n1: yes\n2: yes\n3: no\n4: no\n```',
      starterCode: `decimal[] totals = { 60m, 30m, 30m, 100m };
bool[] members = { false, true, false, true };
bool[] restricted = { false, false, false, true };
`,
      expectedConcepts: ['&&', '||'],
      checks: [
        { kind: 'regex', value: '&&', message: 'Combines conditions with AND' },
        { kind: 'regex', value: '\\|\\|', message: 'Combines conditions with OR' },
        { kind: 'regex', value: '\\(', message: 'Uses brackets to make the precedence explicit' }
      ],
      run: { expectedOutput: '1: yes\n2: yes\n3: no\n4: no' },
      hints: [
        'Write the rule out in words first, then translate it one clause at a time.',
        'The restriction is an overriding NOT: `!restricted && (...)`.',
        'The inner part is `total >= 50 || (isMember && total >= 25)`.'
      ],
      solution: `decimal[] totals = { 60m, 30m, 30m, 100m };
bool[] members = { false, true, false, true };
bool[] restricted = { false, false, false, true };

for (int i = 0; i < totals.Length; i++)
{
    bool qualifies = !restricted[i] && (totals[i] >= 50m || (members[i] && totals[i] >= 25m));
    Console.WriteLine($"{i + 1}: {(qualifies ? "yes" : "no")}");
}`,
      explanation: 'Business rules like this are where brackets earn their keep. Without them, `&&` binding tighter than `||` would silently give a different rule - and it would still compile.'
    },
    {
      id: 'fundamentals:operators#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Digit sum and reversal',
      prompt: 'No hints.\n\nFor the number 91735, print the sum of its digits and the number reversed, using arithmetic only - no strings, no `ToString`, no arrays.\n\nPrint exactly:\n\n```\nSum: 25\nReversed: 53719\n```',
      starterCode: ``,
      expectedConcepts: ['%', '/'],
      checks: [
        { kind: 'regex', value: '%\\s*10', message: 'Uses modulo 10 to take a digit' },
        { kind: 'notContains', value: 'ToString', message: 'No string conversion' },
        { kind: 'regex', value: 'while|for', message: 'Uses a loop' }
      ],
      run: { expectedOutput: 'Sum: 25\nReversed: 53719' },
      hints: [],
      solution: `int number = 91735;
int sum = 0;
int reversed = 0;
int working = number;

while (working > 0)
{
    int digit = working % 10;
    sum += digit;
    reversed = reversed * 10 + digit;
    working /= 10;
}

Console.WriteLine($"Sum: {sum}");
Console.WriteLine($"Reversed: {reversed}");`,
      explanation: '`reversed * 10 + digit` is the standard idiom for building a number digit by digit: shift everything left one place, then drop the new digit into the ones column.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:operators#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `Console.WriteLine(17 % 5);`,
      accept: ['2'],
      explanation: '17 divided by 5 is 3 with 2 left over. `%` gives the remainder.'
    },
    {
      id: 'fundamentals:operators#q2', type: 'mcq',
      prompt: 'What is the difference between `&&` and `&` for booleans?',
      options: [
        'None, they are aliases',
        '`&&` short-circuits; `&` always evaluates both sides',
        '`&` short-circuits; `&&` always evaluates both sides',
        '`&` only works on integers'
      ],
      answer: 1,
      explanation: '`&&` stops as soon as the result is determined. That is what makes null guards work.'
    },
    {
      id: 'fundamentals:operators#q3', type: 'predict-output',
      prompt: 'What does this print?',
      code: `bool a = false;
bool b = true;
Console.WriteLine(a || b && false);`,
      accept: ['false'],
      explanation: '`&&` binds tighter than `||`, so this is `a || (b && false)` which is `false || false`.'
    },
    {
      id: 'fundamentals:operators#q4', type: 'explain',
      prompt: 'Give two genuinely useful things the modulo operator is used for, other than checking whether a number is even.',
      expectedConcepts: ['divisib|multiple|wrap|cycle|index|digit|every nth|alternat'],
      minLength: 60,
      explanation: 'Wrapping an index around the end of an array, taking the last digit of a number, alternating row colours, running something every Nth iteration, and converting seconds into minutes and seconds are all modulo problems.'
    },
    {
      id: 'fundamentals:operators#q5', type: 'mcq',
      prompt: 'What does `name ?? "Guest"` do?',
      options: [
        'Throws if `name` is null',
        'Returns `name` unless it is null, in which case it returns "Guest"',
        'Always returns "Guest"',
        'Compares `name` with "Guest"'
      ],
      answer: 1,
      explanation: 'The null-coalescing operator supplies a fallback value for null.'
    }
  ],
  commonMistakes: [
    { mistake: 'Integer division where a decimal result was wanted', why: '`a / b` looks the same regardless of the types.', fix: 'Check the operand types. Cast one side to `double` or `decimal` if you need the fraction.' },
    { mistake: 'Using `&` or `|` instead of `&&` or `||`', why: 'A typo that still compiles, because both are valid for booleans.', fix: 'Default to `&&` and `||`. You almost never want the non-short-circuiting version.' },
    { mistake: 'Relying on precedence in a complex condition', why: 'It works, so it feels fine.', fix: 'Add brackets. The reader should not have to recall whether `&&` binds tighter than `||`.' },
    { mistake: 'Checking the general case before the specific one', why: 'The conditions are written in the order you thought of them.', fix: 'Order from most specific to least - the FizzBuzz `% 15` case has to come first.' },
    { mistake: 'Chaining ternaries', why: 'It is compact and feels clever.', fix: 'Two levels maximum. Beyond that, use `if` or a `switch` expression.' }
  ],
  realWorld: [
    'Pagination is modulo and integer division: `totalPages = (count + pageSize - 1) / pageSize`.',
    'Every authorisation check in ASP.NET Core is a boolean expression, and getting the bracket placement wrong is a security bug, not a style bug.',
    'Short-circuiting is how you safely walk a chain of optional data from an API response.',
    'Alternating table row styling in Angular is `index % 2`.'
  ],
  resources: [
    { label: 'FizzBuzz from memory', note: 'Write it without looking. If you cannot, that is useful information about how solid the ordering idea is.' }
  ]
},

/* ============================================================
   5. STRINGS
   ============================================================ */
{
  topicId: 'fundamentals:strings',
  title: 'Strings',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 50,
  prerequisites: ['fundamentals:data-types'],
  objectives: [
    'Explain what string immutability means and what it costs',
    'Build strings efficiently and know when `StringBuilder` is worth it',
    'Use the common string methods confidently: Split, Join, Trim, Contains, Replace, Substring',
    'Compare strings correctly, including case-insensitive comparison',
    'Avoid the classic index-out-of-range and null-string mistakes'
  ],
  sections: [
    {
      id: 'immutable',
      title: 'Strings are immutable, and that changes everything',
      blocks: [
        { type: 'text', text: 'A `string` can never be modified. Every operation that looks like it changes a string actually creates a **new** one and leaves the original untouched.' },
        { type: 'code', code: `string name = "barani";
name.ToUpper();                 // creates "BARANI" and throws it away!
Console.WriteLine(name);        // still "barani"

name = name.ToUpper();          // you must assign the result
Console.WriteLine(name);        // "BARANI"` },
        { type: 'warning', text: 'Calling a string method and ignoring the return value is one of the most common beginner mistakes in C#. The compiler will not warn you - the call is perfectly legal, it just does nothing useful.' },
        { type: 'text', text: 'Immutability buys real safety: you can pass a string to any method and be certain it comes back unchanged. It costs allocations - each operation makes a new object.' }
      ]
    },
    {
      id: 'building',
      title: 'Building strings, and when concatenation becomes a problem',
      blocks: [
        { type: 'code', code: `string first = "Barani";
string last = "Dharan";

string a = first + " " + last;                  // concatenation
string b = string.Concat(first, " ", last);     // the same thing
string c = $"{first} {last}";                   // interpolation - prefer this
string d = string.Join(" ", first, last);       // joins with a separator` },
        { type: 'text', text: 'For a handful of pieces, use interpolation - it is the clearest. The problem appears in loops:' },
        { type: 'code', caption: 'This is quadratic - avoid it', code: `string result = "";
for (int i = 0; i < 10000; i++)
{
    result += i;      // allocates a whole new string every iteration
}` },
        { type: 'text', text: 'Because strings are immutable, each `+=` copies everything built so far into a new string. Ten thousand iterations means ten thousand ever-larger copies.' },
        { type: 'code', caption: 'Use StringBuilder in a loop', code: `var builder = new StringBuilder();
for (int i = 0; i < 10000; i++)
{
    builder.Append(i);
}
string result = builder.ToString();` },
        { type: 'whenNot', text: 'Do not reach for `StringBuilder` for three or four pieces - it is slower and noisier than interpolation. The rule of thumb is: a loop of unknown length means `StringBuilder`; a fixed handful means interpolation.' }
      ]
    },
    {
      id: 'methods',
      title: 'The methods you will use constantly',
      blocks: [
        { type: 'table', head: ['Method', 'Does', 'Example'], rows: [
          ['`Length`', 'character count', '`"abc".Length` is 3'],
          ['`ToUpper` / `ToLower`', 'change case', '`"abc".ToUpper()` is `"ABC"`'],
          ['`Trim`', 'remove surrounding whitespace', '`"  x  ".Trim()` is `"x"`'],
          ['`Contains`', 'is a substring present', '`"hello".Contains("ell")` is true'],
          ['`StartsWith` / `EndsWith`', 'prefix / suffix test', '`"file.txt".EndsWith(".txt")`'],
          ['`Replace`', 'swap all occurrences', '`"a-b".Replace("-", "_")`'],
          ['`Split`', 'text to array', '`"a,b,c".Split(",")`'],
          ['`string.Join`', 'array to text', '`string.Join(", ", items)`'],
          ['`Substring`', 'take part of it', '`"hello".Substring(1, 3)` is `"ell"`'],
          ['`IndexOf`', 'position, or -1', '`"hello".IndexOf("l")` is 2'],
          ['`string.IsNullOrWhiteSpace`', 'the safe emptiness test', 'handles null too']
        ] },
        { type: 'note', text: '`string.IsNullOrWhiteSpace` is the one to reach for when validating input. It handles null, empty and "   " in a single call, and it never throws.' }
      ]
    },
    {
      id: 'comparing',
      title: 'Comparing strings properly',
      blocks: [
        { type: 'code', code: `string a = "Hello";
string b = "hello";

Console.WriteLine(a == b);                                       // False
Console.WriteLine(a.Equals(b, StringComparison.OrdinalIgnoreCase)); // True
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase)); // True - null safe` },
        { type: 'text', text: '`==` on strings compares the characters, which is what you usually want. For case-insensitive comparison, pass a `StringComparison` rather than calling `ToLower()` on both sides - it is faster and avoids culture surprises.' },
        { type: 'warning', text: '`a.Equals(b)` throws if `a` is null. `string.Equals(a, b)` does not. Prefer the static form when either side might be null.' }
      ]
    },
    {
      id: 'indexing',
      title: 'Indexing and the off-by-one trap',
      blocks: [
        { type: 'code', code: `string text = "hello";

Console.WriteLine(text[0]);           // 'h' - indexes start at 0
Console.WriteLine(text[text.Length - 1]);  // 'o' - the last one
// Console.WriteLine(text[5]);        // IndexOutOfRangeException

Console.WriteLine(text[^1]);          // 'o' - index-from-end operator
Console.WriteLine(text[1..4]);        // "ell" - range operator` },
        { type: 'text', text: 'Valid indexes run from `0` to `Length - 1`. The last character is at `Length - 1`, never at `Length`. Modern C# gives you `^1` for "one from the end", which removes the arithmetic and therefore the off-by-one.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Parsing a line of CSV',
      code: `string line = " Barani , 28 , Engineer ";

string[] parts = line.Split(',');

for (int i = 0; i < parts.Length; i++)
{
    parts[i] = parts[i].Trim();
}

Console.WriteLine($"Name: {parts[0]}");
Console.WriteLine($"Age: {parts[1]}");
Console.WriteLine($"Role: {parts[2]}");
Console.WriteLine(string.Join(" | ", parts));`,
      walkthrough: [
        { line: 'line.Split(\',\')', note: 'Splits on each comma and returns a `string[]`. The spaces are still attached at this point.' },
        { line: 'parts[i] = parts[i].Trim();', note: 'Note the assignment - `Trim()` returns a new string, it does not modify the one in the array.' },
        { line: 'string.Join(" | ", parts)', note: 'The inverse of `Split`. Very handy for building readable output from an array.' }
      ],
      output: 'Name: Barani\nAge: 28\nRole: Engineer\nBarani | 28 | Engineer',
      takeaway: 'Split then Trim is the standard opening move for any delimited text. Real-world data always has stray whitespace.'
    },
    {
      id: 'ex2',
      title: 'Immutability caught in the act',
      code: `string original = "hello world";

original.ToUpper();
original.Replace("world", "there");
Console.WriteLine(original);

string changed = original.ToUpper().Replace("WORLD", "THERE");
Console.WriteLine(changed);
Console.WriteLine(original);`,
      walkthrough: [
        { line: 'original.ToUpper();', note: 'Creates a new uppercase string, which is immediately discarded because nothing captures it. `original` is untouched.' },
        { line: 'original.ToUpper().Replace(...)', note: 'Chaining works because each call returns a new string for the next one to work on.' },
        { line: 'Console.WriteLine(original);', note: 'Still lowercase. The original has not changed and never can.' }
      ],
      output: 'hello world\nHELLO THERE\nhello world',
      takeaway: 'If a string operation appears to do nothing, check that you assigned the result.'
    },
    {
      id: 'ex3',
      title: 'Safe validation of user input',
      code: `string[] inputs = { "Barani", "", "   ", "  Dharan  " };

foreach (string input in inputs)
{
    if (string.IsNullOrWhiteSpace(input))
    {
        Console.WriteLine("(rejected: empty)");
    }
    else
    {
        Console.WriteLine($"accepted: '{input.Trim()}' ({input.Trim().Length} chars)");
    }
}`,
      walkthrough: [
        { line: 'string.IsNullOrWhiteSpace(input)', note: 'One call covering null, "" and any amount of whitespace. It is a static method, so it cannot throw on a null argument.' }
      ],
      output: "accepted: 'Barani' (6 chars)\n(rejected: empty)\n(rejected: empty)\naccepted: 'Dharan' (6 chars)",
      takeaway: 'Reach for `IsNullOrWhiteSpace` over `== ""` or `.Length == 0` - both of those throw when the value is null.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:strings#g1',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `string s = "hello";
s.ToUpper();
Console.WriteLine(s);`,
      accept: ['hello'],
      hints: [
        'Strings are immutable - nothing can change one in place.',
        '`ToUpper()` returns a new string. Is anything capturing the return value here?'
      ],
      explanation: 'The uppercase string is created and immediately discarded. You need `s = s.ToUpper();`.',
      solution: 'hello'
    },
    {
      id: 'fundamentals:strings#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'Which is the safest way to check that a user actually typed something?',
      options: [
        '`if (input != "")`',
        '`if (input.Length > 0)`',
        '`if (!string.IsNullOrWhiteSpace(input))`',
        '`if (input != null)`'
      ],
      answer: 2,
      hints: [
        'Consider what happens to each option if `input` is null.',
        'Also consider what happens if the user typed three spaces.'
      ],
      explanation: 'Options 1, 2 and 4 all miss at least one case - option 2 throws on null, and options 1 and 4 accept "   " as valid input.',
      solution: '`if (!string.IsNullOrWhiteSpace(input))`'
    },
    {
      id: 'fundamentals:strings#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Take the string `"  Barani Dharan  "`, trim it, convert it to uppercase and print both the result and its length.\n\nPrint exactly:\n\n```\nBARANI DHARAN\n13\n```',
      starterCode: `string raw = "  Barani Dharan  ";

`,
      expectedConcepts: ['Trim', 'ToUpper'],
      checks: [
        { kind: 'regex', value: 'Trim\\(\\)', message: 'Trims the whitespace' },
        { kind: 'regex', value: 'ToUpper\\(\\)', message: 'Converts to uppercase' },
        { kind: 'regex', value: 'Length', message: 'Prints the length' }
      ],
      run: { expectedOutput: 'BARANI DHARAN\n13' },
      hints: [
        'Remember that string methods return a new string - you must assign or chain.',
        'You can chain: `raw.Trim().ToUpper()`.',
        'Store the result in a variable so you can print both it and its `Length`.'
      ],
      solution: `string raw = "  Barani Dharan  ";
string clean = raw.Trim().ToUpper();

Console.WriteLine(clean);
Console.WriteLine(clean.Length);`,
      explanation: 'Trim first, then uppercase. Doing it the other way round works too - but trimming first means the uppercase operation handles fewer characters.'
    },
    {
      id: 'fundamentals:strings#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Count the vowels in the sentence `"The quick brown fox jumps over the lazy dog"`, ignoring case.\n\nPrint exactly:\n\n```\nVowels: 11\n```',
      starterCode: `string sentence = "The quick brown fox jumps over the lazy dog";

`,
      expectedConcepts: ['loop', 'ToLower'],
      checks: [
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Loops over the characters' },
        { kind: 'regex', value: 'ToLower|ToUpper|IndexOf|Contains', message: 'Handles case insensitivity' }
      ],
      run: { expectedOutput: 'Vowels: 11' },
      hints: [
        'A string can be iterated with `foreach (char c in sentence)`.',
        'Lowercase each character before testing it, so you only need to check five vowels.',
        '`"aeiou".Contains(c)` is a tidy way to test membership.'
      ],
      solution: `string sentence = "The quick brown fox jumps over the lazy dog";
int vowels = 0;

foreach (char c in sentence.ToLower())
{
    if ("aeiou".Contains(c))
    {
        vowels++;
    }
}

Console.WriteLine($"Vowels: {vowels}");`,
      explanation: 'Calling `ToLower()` once on the whole string is better than calling it on every character - one allocation instead of forty-three.'
    },
    {
      id: 'fundamentals:strings#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Reverse the string `"engineer"` without using `Array.Reverse` or LINQ, and report whether it is a palindrome.\n\nPrint exactly:\n\n```\nreenigne\nPalindrome: False\n```',
      starterCode: `string word = "engineer";

`,
      expectedConcepts: ['loop', 'index'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses a loop' },
        { kind: 'notContains', value: 'Array.Reverse', message: 'Does not use Array.Reverse' },
        { kind: 'notContains', value: 'System.Linq', message: 'Does not use LINQ' }
      ],
      run: { expectedOutput: 'reenigne\nPalindrome: False' },
      hints: [
        'Walk the string backwards: start at `word.Length - 1` and decrement to 0.',
        'Build the result with a `StringBuilder`, or concatenate into a string.',
        'It is a palindrome when the reversed string equals the original.'
      ],
      solution: `string word = "engineer";
var builder = new System.Text.StringBuilder();

for (int i = word.Length - 1; i >= 0; i--)
{
    builder.Append(word[i]);
}

string reversed = builder.ToString();

Console.WriteLine(reversed);
Console.WriteLine($"Palindrome: {reversed == word}");`,
      explanation: 'Note `word.Length - 1` as the starting index - the last valid index is always one less than the length. Starting at `Length` is the single most common off-by-one error in C#.'
    },
    {
      id: 'fundamentals:strings#i3',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Turn a full name into initials.\n\nGiven `"barani kumar dharan"`, produce `B.K.D.` - uppercase first letters, each followed by a dot.\n\nPrint exactly:\n\n```\nB.K.D.\n```',
      starterCode: `string fullName = "barani kumar dharan";

`,
      expectedConcepts: ['Split', 'ToUpper'],
      checks: [
        { kind: 'regex', value: 'Split', message: 'Splits the name into parts' },
        { kind: 'regex', value: 'ToUpper|char\\.ToUpper', message: 'Uppercases the initials' }
      ],
      run: { expectedOutput: 'B.K.D.' },
      hints: [
        'Split on the space character to get the individual names.',
        'The first letter of a word is `word[0]`, which is a `char`.',
        '`char.ToUpper(word[0])` uppercases a single character. Append it plus a dot each time.'
      ],
      solution: `string fullName = "barani kumar dharan";
var builder = new System.Text.StringBuilder();

foreach (string part in fullName.Split(' '))
{
    if (part.Length > 0)
    {
        builder.Append(char.ToUpper(part[0]));
        builder.Append('.');
    }
}

Console.WriteLine(builder.ToString());`,
      explanation: 'The `part.Length > 0` guard matters: splitting a string with two consecutive spaces produces an empty entry, and `part[0]` on an empty string throws.'
    },
    {
      id: 'fundamentals:strings#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This is supposed to clean up a username, but it prints the original.',
      brokenCode: `string username = "  BaraniDharan  ";

username.Trim();
username.ToLower();

Console.WriteLine($"[{username}]");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`Trim` and `ToLower` cannot be used on the same string',
            'The return values are discarded - strings are immutable',
            '`username` should be declared as `var`',
            'The methods must be called in the opposite order'
          ],
          answer: 1,
          label: 'Identified the discarded return values'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why can these methods not modify the string in place?',
          accept: ['strings are immutable'],
          acceptContains: ['immutable'],
          label: 'Explained immutability'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `[baranidharan]`.',
          starterCode: `string username = "  BaraniDharan  ";

username.Trim();
username.ToLower();

Console.WriteLine($"[{username}]");`,
          checks: [
            { kind: 'regex', value: 'username\\s*=\\s*username\\.|=\\s*username\\.Trim', message: 'Assigns the result back' }
          ],
          run: { expectedOutput: '[baranidharan]' },
          label: 'Captured the results'
        }
      ],
      hints: [],
      solution: `string username = "  BaraniDharan  ";

username = username.Trim().ToLower();

Console.WriteLine($"[{username}]");`,
      explanation: 'Every string method returns a new string. If you do not assign it, the work is thrown away. The compiler cannot warn you because discarding a return value is legal.'
    },
    {
      id: 'fundamentals:strings#d2',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This crashes with an IndexOutOfRangeException.',
      brokenCode: `string word = "hello";

for (int i = 0; i <= word.Length; i++)
{
    Console.WriteLine(word[i]);
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The loop condition uses `<=`, so it runs one iteration too many',
            '`word[i]` is not valid syntax for a string',
            'The loop should start at 1',
            '`word.Length` is not a property'
          ],
          answer: 0,
          label: 'Identified the off-by-one'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'For a 5-character string, what is the highest valid index?',
          accept: ['4'],
          label: 'Knew the last valid index'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints each letter of "hello" on its own line.',
          starterCode: `string word = "hello";

for (int i = 0; i <= word.Length; i++)
{
    Console.WriteLine(word[i]);
}`,
          checks: [
            { kind: 'regex', value: 'i\\s*<\\s*word\\.Length|foreach', message: 'Stops at the last valid index' }
          ],
          run: { expectedOutput: 'h\ne\nl\nl\no' },
          label: 'Fixed the bound'
        }
      ],
      hints: [],
      solution: `string word = "hello";

for (int i = 0; i < word.Length; i++)
{
    Console.WriteLine(word[i]);
}`,
      explanation: 'Indexes run 0 to `Length - 1`, so the loop condition is `<`, never `<=`. A `foreach` avoids the question entirely and is usually the better choice when you do not need the index.'
    },
    {
      id: 'fundamentals:strings#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: normalise a batch of messy email addresses for import.\n\nGiven `"  Barani@Example.COM "`, `"sam@test.io"`, `"   "` and `"NoAtSign.com"`, an address is valid if it is not blank and contains an `@`. Normalise valid ones by trimming and lowercasing.\n\nPrint exactly:\n\n```\nbarani@example.com\nsam@test.io\nInvalid: 2\n```',
      starterCode: `string[] raw = { "  Barani@Example.COM ", "sam@test.io", "   ", "NoAtSign.com" };
`,
      expectedConcepts: ['IsNullOrWhiteSpace', 'Contains', 'Trim', 'ToLower'],
      checks: [
        { kind: 'regex', value: 'IsNullOrWhiteSpace', message: 'Rejects blank entries safely' },
        { kind: 'regex', value: 'Contains\\(', message: 'Checks for an @ sign' },
        { kind: 'regex', value: 'Trim\\(\\)', message: 'Trims whitespace' },
        { kind: 'regex', value: 'ToLower\\(\\)', message: 'Lowercases the address' }
      ],
      run: { expectedOutput: 'barani@example.com\nsam@test.io\nInvalid: 2' },
      hints: [
        'Check `string.IsNullOrWhiteSpace` first - it is the guard that makes everything after it safe.',
        'Trim before testing for the `@`, so trailing spaces do not confuse anything.',
        'Count the rejected ones in a separate variable and print the count at the end.'
      ],
      solution: `string[] raw = { "  Barani@Example.COM ", "sam@test.io", "   ", "NoAtSign.com" };
int invalid = 0;

foreach (string entry in raw)
{
    if (string.IsNullOrWhiteSpace(entry))
    {
        invalid++;
        continue;
    }

    string normalised = entry.Trim().ToLower();

    if (!normalised.Contains('@'))
    {
        invalid++;
        continue;
    }

    Console.WriteLine(normalised);
}

Console.WriteLine($"Invalid: {invalid}");`,
      explanation: 'Real normalisation code looks like this: guard, clean, validate, use. The `continue` statements keep the happy path flat rather than nesting three levels of `if`.'
    },
    {
      id: 'fundamentals:strings#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Word frequency',
      prompt: 'No hints.\n\nFor the sentence `"the cat sat on the mat the cat slept"`, count how many times each word appears and print the words in order of first appearance, with their counts.\n\nPrint exactly:\n\n```\nthe: 3\ncat: 2\nsat: 1\non: 1\nmat: 1\nslept: 1\n```',
      starterCode: ``,
      expectedConcepts: ['Split', 'Dictionary'],
      checks: [
        { kind: 'regex', value: 'Split', message: 'Splits the sentence into words' },
        { kind: 'regex', value: 'Dictionary', message: 'Uses a dictionary to count' }
      ],
      run: { expectedOutput: 'the: 3\ncat: 2\nsat: 1\non: 1\nmat: 1\nslept: 1' },
      hints: [],
      solution: `string sentence = "the cat sat on the mat the cat slept";
var counts = new Dictionary<string, int>();

foreach (string word in sentence.Split(' '))
{
    if (counts.ContainsKey(word))
    {
        counts[word]++;
    }
    else
    {
        counts[word] = 1;
    }
}

foreach (var pair in counts)
{
    Console.WriteLine($"{pair.Key}: {pair.Value}");
}`,
      explanation: 'A `Dictionary<string, int>` preserves insertion order in practice for this simple case, which is why the output comes out in order of first appearance. Do not rely on that in production code - if order matters, track it explicitly.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:strings#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `string s = "abc";
s.Replace("a", "z");
Console.WriteLine(s);`,
      accept: ['abc'],
      explanation: 'The result of `Replace` is discarded. Strings cannot be modified in place.'
    },
    {
      id: 'fundamentals:strings#q2', type: 'mcq',
      prompt: 'Why is `StringBuilder` faster than `+=` inside a large loop?',
      options: [
        'It uses a different character encoding',
        'It avoids creating a new string on every iteration',
        'It runs the loop in parallel',
        'It compresses the text'
      ],
      answer: 1,
      explanation: 'Because strings are immutable, `+=` allocates a whole new string each time. `StringBuilder` keeps a resizable buffer and appends into it.'
    },
    {
      id: 'fundamentals:strings#q3', type: 'predict-output',
      prompt: 'What does this print?',
      code: `string text = "hello";
Console.WriteLine(text[text.Length - 1]);`,
      accept: ['o'],
      explanation: 'The last valid index is `Length - 1`. `text[text.Length]` would throw.'
    },
    {
      id: 'fundamentals:strings#q4', type: 'explain',
      prompt: 'Explain why `string.IsNullOrWhiteSpace(input)` is safer than `input.Trim().Length == 0` for validating a form field.',
      expectedConcepts: ['null', 'throw|exception|crash', 'static|does not'],
      minLength: 70,
      explanation: 'If `input` is null, `input.Trim()` throws a NullReferenceException. `string.IsNullOrWhiteSpace` is a static method that takes the value as an argument, so it handles null, empty and whitespace-only in one safe call.'
    },
    {
      id: 'fundamentals:strings#q5', type: 'mcq',
      prompt: 'What does `"a,b,,c".Split(\',\')` return?',
      options: [
        'An array of 3 items',
        'An array of 4 items, one of which is empty',
        'An exception',
        'An array of 4 items with no empty entries'
      ],
      answer: 1,
      explanation: 'Split produces one entry per delimiter boundary, including empty ones. Pass `StringSplitOptions.RemoveEmptyEntries` if you do not want them.'
    }
  ],
  commonMistakes: [
    { mistake: 'Calling a string method and ignoring the result', why: 'It looks like the method modifies the string, as it would in a mutable language.', fix: 'Always assign: `s = s.Trim();`. If a string operation seems to do nothing, this is almost always why.' },
    { mistake: 'Using `+=` to build a string in a long loop', why: 'It is the obvious way and works fine for ten items.', fix: 'Use `StringBuilder` once the loop length is unbounded. Below a handful of pieces, interpolation is clearer and fine.' },
    { mistake: 'Looping with `i <= text.Length`', why: 'Length feels like it should be a valid index.', fix: 'Valid indexes stop at `Length - 1`. Use `<`, or use `foreach` and avoid the question.' },
    { mistake: 'Comparing with `ToLower()` on both sides', why: 'It reads naturally and works.', fix: 'Use `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)`. It allocates nothing and avoids culture-specific surprises like the Turkish dotless i.' },
    { mistake: 'Using `input != ""` to test for empty', why: 'It is the obvious test.', fix: 'It misses null and whitespace. Use `string.IsNullOrWhiteSpace`.' }
  ],
  realWorld: [
    'Every HTTP request arrives as text; parsing headers, query strings and form fields is string work.',
    'Log messages built with `+=` inside a hot loop are a real and common source of memory pressure in .NET services.',
    'Case-insensitive comparison bugs cause "user not found" errors when someone signs in with a differently cased email.',
    'CSV and fixed-width file imports are almost entirely Split, Trim and TryParse.'
  ],
  resources: [
    { label: 'Immutability check', note: 'Run example 2. If the output surprises you at all, run it again with a change and predict the result first.' }
  ]
}


]);
