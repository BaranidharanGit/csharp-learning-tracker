/* ============================================================
   js/data/lessons/fundamentals-collections.js
   C# Fundamentals, part 3: Arrays, Lists, Dictionaries,
   HashSet, Debugging.
   ============================================================ */
window.App = window.App || {};

App.registerLessons([

/* ============================================================
   11. ARRAYS
   ============================================================ */
{
  topicId: 'fundamentals:arrays',
  title: 'Arrays',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 40,
  prerequisites: ['fundamentals:loops'],
  objectives: [
    'Declare, initialise and access arrays with confidence',
    'Explain why an array has a fixed size and what that costs',
    'Avoid IndexOutOfRangeException by reasoning about bounds',
    'Understand that arrays are reference types and what that means when you pass or copy them',
    'Choose between an array and a List and justify the choice'
  ],
  sections: [
    {
      id: 'basics',
      title: 'Declaring and using an array',
      blocks: [
        { type: 'code', code: `int[] scores = new int[5];              // 5 slots, all 0
int[] fixedScores = { 90, 85, 77 };     // initialised inline
string[] names = new string[] { "a", "b" };
var prices = new decimal[] { 1.5m, 2.5m };

Console.WriteLine(scores.Length);       // 5
Console.WriteLine(fixedScores[0]);      // 90
fixedScores[2] = 80;                    // assign by index` },
        { type: 'text', text: 'An array is a **fixed-size, contiguous block** of same-typed values. The size is decided when it is created and can never change.' },
        { type: 'note', text: 'A new array is not empty - it is filled with the default for its type: `0` for numbers, `false` for bools, `null` for reference types.' }
      ]
    },
    {
      id: 'bounds',
      title: 'Indexes and bounds',
      blocks: [
        { type: 'code', code: `string[] items = { "a", "b", "c" };   // Length 3, indexes 0..2

Console.WriteLine(items[0]);          // "a"
Console.WriteLine(items[2]);          // "c"
Console.WriteLine(items[^1]);         // "c" - from the end
// Console.WriteLine(items[3]);       // IndexOutOfRangeException

string[] middle = items[0..2];        // "a", "b" - range operator` },
        { type: 'text', text: 'The single rule: indexes run `0` to `Length - 1`. Almost every array bug is a violation of that one sentence.' },
        { type: 'warning', text: '`IndexOutOfRangeException` is a **runtime** error, not a compile error. The compiler cannot know what value `i` will hold, so this is one of the few classes of mistake C# cannot catch for you.' }
      ]
    },
    {
      id: 'fixed',
      title: 'Fixed size: the cost and the benefit',
      blocks: [
        { type: 'text', text: 'You cannot add to an array. `Array.Resize` exists, but it allocates a whole new array and copies everything - it is not a real resize.' },
        { type: 'code', code: `int[] numbers = { 1, 2, 3 };
Array.Resize(ref numbers, 5);         // new array, copied, old one discarded
Console.WriteLine(numbers.Length);    // 5 (last two are 0)` },
        { type: 'text', text: 'In exchange you get the fastest possible element access and the smallest memory footprint. Arrays sit contiguously in memory, which is why they are the foundation every other collection is built on - `List<T>` is an array plus bookkeeping.' },
        { type: 'whenNot', text: 'Do not use an array when the number of items is not known up front or will change. Use `List<T>`. Reach for an array when the size is genuinely fixed, when you are interoperating with an API that wants one, or in tight numeric code where the extra indirection matters.' }
      ]
    },
    {
      id: 'reference',
      title: 'Arrays are reference types',
      blocks: [
        { type: 'code', code: `int[] a = { 1, 2, 3 };
int[] b = a;              // same array, two names
b[0] = 99;
Console.WriteLine(a[0]);  // 99

int[] c = (int[])a.Clone();   // a real copy
c[1] = 50;
Console.WriteLine(a[1]);      // 2 - unaffected` },
        { type: 'text', text: 'Assignment shares. If a method needs its own copy - especially before sorting - it must make one explicitly.' }
      ]
    },
    {
      id: 'helpers',
      title: 'The Array helpers worth knowing',
      blocks: [
        { type: 'table', head: ['Call', 'Does'], rows: [
          ['`Array.Sort(arr)`', 'sorts in place - mutates the array'],
          ['`Array.Reverse(arr)`', 'reverses in place'],
          ['`Array.IndexOf(arr, value)`', 'position, or -1'],
          ['`Array.Copy(src, dst, n)`', 'copies elements'],
          ['`arr.Clone()`', 'shallow copy of the whole array'],
          ['`Array.Empty<int>()`', 'a shared empty array, no allocation']
        ] },
        { type: 'warning', text: '`Array.Sort` and `Array.Reverse` modify the array you give them. If it came in as a parameter, you have just changed the caller\'s data.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Walking an array in both directions',
      code: `string[] days = { "Mon", "Tue", "Wed", "Thu", "Fri" };

for (int i = 0; i < days.Length; i++)
{
    Console.Write($"{i}:{days[i]} ");
}
Console.WriteLine();

for (int i = days.Length - 1; i >= 0; i--)
{
    Console.Write(days[i] + " ");
}
Console.WriteLine();

Console.WriteLine($"First: {days[0]}, Last: {days[^1]}, Count: {days.Length}");`,
      walkthrough: [
        { line: 'for (int i = 0; i < days.Length; i++)', note: 'Forwards: start at 0, stop **before** Length.' },
        { line: 'for (int i = days.Length - 1; i >= 0; i--)', note: 'Backwards: start one below Length, stop at 0 inclusive. Both bounds change.' },
        { line: 'days[^1]', note: 'The index-from-end operator. Equivalent to `days[days.Length - 1]` but with no arithmetic to get wrong.' }
      ],
      output: '0:Mon 1:Tue 2:Wed 3:Thu 4:Fri \nFri Thu Wed Tue Mon \nFirst: Mon, Last: Fri, Count: 5',
      takeaway: 'Getting the two bound patterns into muscle memory removes most array bugs.'
    },
    {
      id: 'ex2',
      title: 'Sorting mutates - so copy first',
      code: `int[] original = { 5, 2, 9, 1 };

int[] sorted = (int[])original.Clone();
Array.Sort(sorted);

Console.WriteLine("original: " + string.Join(",", original));
Console.WriteLine("sorted:   " + string.Join(",", sorted));

Array.Sort(original);
Console.WriteLine("after in-place sort: " + string.Join(",", original));`,
      walkthrough: [
        { line: '(int[])original.Clone()', note: '`Clone` returns `object`, so it needs a cast. This is the standard way to duplicate an array.' },
        { line: 'Array.Sort(sorted);', note: 'Sorts in place and returns nothing. It changes the array you hand it.' }
      ],
      output: 'original: 5,2,9,1\nsorted:   1,2,5,9\nafter in-place sort: 1,2,5,9',
      takeaway: 'If a method sorts an array it was given, the caller\'s data changes too. Clone first unless mutating is the stated job.'
    },
    {
      id: 'ex3',
      title: 'A 2D array',
      code: `int[,] grid = new int[3, 3];

for (int row = 0; row < 3; row++)
{
    for (int col = 0; col < 3; col++)
    {
        grid[row, col] = (row + 1) * (col + 1);
    }
}

for (int row = 0; row < grid.GetLength(0); row++)
{
    for (int col = 0; col < grid.GetLength(1); col++)
    {
        Console.Write($"{grid[row, col],3}");
    }
    Console.WriteLine();
}`,
      walkthrough: [
        { line: 'int[,] grid = new int[3, 3];', note: 'A rectangular 2D array. Note the comma in the type - `int[,]` is different from `int[][]`.' },
        { line: 'grid.GetLength(0)', note: '`Length` gives the total number of elements (9 here). `GetLength(dimension)` gives the size of one dimension.' }
      ],
      output: '  1  2  3\n  2  4  6\n  3  6  9',
      takeaway: 'Multi-dimensional arrays appear in grids, matrices and board games. `GetLength` is the part people forget.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:arrays#g1',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `int[] numbers = new int[3];
Console.WriteLine(numbers[0]);`,
      accept: ['0'],
      hints: [
        'The array was created but nothing was assigned to it.',
        'New arrays are filled with the default value for their element type.'
      ],
      explanation: 'A new `int[]` is filled with zeros. A `string[]` would be filled with nulls.',
      solution: '0'
    },
    {
      id: 'fundamentals:arrays#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'For `string[] items = { "a", "b", "c" };` which expression throws?',
      options: ['`items[0]`', '`items[2]`', '`items[3]`', '`items[^1]`'],
      answer: 2,
      hints: [
        'Length is 3. What are the valid indexes?',
        'They run from 0 to Length - 1.'
      ],
      explanation: 'Valid indexes are 0, 1 and 2. Index 3 is out of range - the classic off-by-one.',
      solution: '`items[3]`'
    },
    {
      id: 'fundamentals:arrays#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Create an array of the five numbers 10, 25, 3, 47, 8 and print the first element, the last element and the length.\n\nPrint exactly:\n\n```\nFirst: 10\nLast: 8\nLength: 5\n```',
      starterCode: ``,
      expectedConcepts: ['array', 'Length'],
      checks: [
        { kind: 'regex', value: 'int\\[\\]', message: 'Declares an int array' },
        { kind: 'regex', value: 'Length', message: 'Uses Length' },
        { kind: 'notContains', value: 'Last: 8"', message: 'Reads the last element rather than hard-coding it' }
      ],
      run: { expectedOutput: 'First: 10\nLast: 8\nLength: 5' },
      hints: [
        'Initialise inline: `int[] numbers = { 10, 25, 3, 47, 8 };`',
        'The first element is at index 0.',
        'The last is at `numbers.Length - 1`, or `numbers[^1]`.'
      ],
      solution: `int[] numbers = { 10, 25, 3, 47, 8 };

Console.WriteLine($"First: {numbers[0]}");
Console.WriteLine($"Last: {numbers[^1]}");
Console.WriteLine($"Length: {numbers.Length}");`,
      explanation: 'Using `^1` rather than `Length - 1` removes one opportunity for an off-by-one.'
    },
    {
      id: 'fundamentals:arrays#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Reverse an array in place without using `Array.Reverse` or LINQ.\n\nFor `{ 1, 2, 3, 4, 5 }` print exactly:\n\n```\n5 4 3 2 1\n```',
      starterCode: `int[] numbers = { 1, 2, 3, 4, 5 };

`,
      expectedConcepts: ['loop', 'swap'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses a loop' },
        { kind: 'notContains', value: 'Array.Reverse', message: 'Does not use Array.Reverse' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '5 4 3 2 1' },
      hints: [
        'Swap the first with the last, the second with the second-to-last, and so on.',
        'You only need to go halfway - swapping the whole way would undo your own work.',
        'The partner of index `i` is `Length - 1 - i`.'
      ],
      solution: `int[] numbers = { 1, 2, 3, 4, 5 };

for (int i = 0; i < numbers.Length / 2; i++)
{
    int opposite = numbers.Length - 1 - i;
    int temp = numbers[i];
    numbers[i] = numbers[opposite];
    numbers[opposite] = temp;
}

Console.WriteLine(string.Join(" ", numbers));`,
      explanation: 'Stopping at `Length / 2` is essential. Running the full length would swap every pair twice and return the array to its original order - a bug that produces the *input* as output, which is confusingly easy to misread as "nothing happened".'
    },
    {
      id: 'fundamentals:arrays#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Find the second-largest value in `{ 12, 45, 7, 98, 23, 98 }` in a single pass.\n\nDuplicates of the largest do not count, so the answer is 45.\n\nPrint exactly:\n\n```\nSecond largest: 45\n```',
      starterCode: `int[] numbers = { 12, 45, 7, 98, 23, 98 };

`,
      expectedConcepts: ['loop', 'comparison'],
      checks: [
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Uses a single loop' },
        { kind: 'notContains', value: 'Array.Sort', message: 'Does not sort' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: 'Second largest: 45' },
      hints: [
        'Track two values as you go: the largest and the second largest.',
        'When you find a new largest, the old largest becomes the second largest.',
        'Skip values equal to the current largest, or duplicates will overwrite your second place.'
      ],
      solution: `int[] numbers = { 12, 45, 7, 98, 23, 98 };

int largest = int.MinValue;
int second = int.MinValue;

foreach (int n in numbers)
{
    if (n > largest)
    {
        second = largest;
        largest = n;
    }
    else if (n > second && n != largest)
    {
        second = n;
    }
}

Console.WriteLine($"Second largest: {second}");`,
      explanation: 'The `n != largest` guard is what handles the duplicate 98. Sorting would also work but costs O(n log n) instead of O(n) - and this pattern generalises to finding the top K.'
    },
    {
      id: 'fundamentals:arrays#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain when you would choose an array over a `List<T>`, and why arrays are fixed size at all.',
      expectedConcepts: ['fixed|known|size', 'performance|fast|memory|contiguous', 'list|grow|add'],
      minLength: 120,
      hints: [
        'What does knowing the size in advance let the runtime do?',
        'What does a List have to do when it runs out of room?',
        'What does an API like `string.Split` hand you back?'
      ],
      solution: 'An array is right when the number of items is known and fixed - a chessboard, an RGB triple, the result of `string.Split`. Arrays are fixed size because they are a single contiguous block of memory, which is what makes element access as fast as it can possibly be and keeps overhead to a minimum. A `List<T>` is built on top of an array and handles growth by allocating a bigger one and copying, so it trades a little speed and memory for the ability to add and remove.',
      explanation: 'Knowing that `List<T>` is an array underneath explains both why it is fast to index and why adding can occasionally be slow.'
    },
    {
      id: 'fundamentals:arrays#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This throws IndexOutOfRangeException. Work out why and fix it.',
      brokenCode: `int[] values = { 10, 20, 30 };
int total = 0;

for (int i = 1; i <= values.Length; i++)
{
    total += values[i];
}

Console.WriteLine(total);`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The loop starts at 1 and ends at Length, so it misses index 0 and reads index 3',
            '`total` should be a double',
            'Arrays cannot be summed with a for loop',
            '`values.Length` is 4'
          ],
          answer: 0,
          label: 'Identified both bound errors'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What are the valid indexes for a 3-element array?',
          accept: ['0 1 2', '0, 1, 2', '0-2', '0 to 2'],
          acceptContains: ['0'],
          label: 'Stated the valid range'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `60`.',
          starterCode: `int[] values = { 10, 20, 30 };
int total = 0;

for (int i = 1; i <= values.Length; i++)
{
    total += values[i];
}

Console.WriteLine(total);`,
          checks: [
            { kind: 'regex', value: 'i\\s*=\\s*0|foreach', message: 'Starts from the first element' },
            { kind: 'regex', value: 'i\\s*<\\s*values\\.Length|foreach', message: 'Stops at the last valid index' }
          ],
          run: { expectedOutput: '60' },
          label: 'Fixed both bounds'
        }
      ],
      hints: [],
      solution: `int[] values = { 10, 20, 30 };
int total = 0;

foreach (int v in values)
{
    total += v;
}

Console.WriteLine(total);`,
      explanation: 'Two bugs in one line: starting at 1 skipped the first element, and `<=` ran past the end. `foreach` eliminates both possibilities, which is why it is the default choice when you do not need the index.'
    },
    {
      id: 'fundamentals:arrays#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This method is supposed to return a sorted copy. The caller\'s array gets sorted too.',
      brokenCode: `int[] data = { 5, 1, 4 };
int[] sorted = SortedCopy(data);

Console.WriteLine("original: " + string.Join(",", data));

static int[] SortedCopy(int[] values)
{
    Array.Sort(values);
    return values;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`Array.Sort` sorts in place, so it mutates the caller\'s array',
            '`Array.Sort` cannot be used on int arrays',
            'The method should return void',
            'The array should be passed with `ref`'
          ],
          answer: 0,
          label: 'Identified the in-place sort'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Why does the method receive the same array rather than a copy?',
          accept: ['arrays are reference types'],
          acceptContains: ['reference'],
          label: 'Explained reference semantics'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so `original` still prints as `5,1,4`.',
          starterCode: `int[] data = { 5, 1, 4 };
int[] sorted = SortedCopy(data);

Console.WriteLine("original: " + string.Join(",", data));

static int[] SortedCopy(int[] values)
{
    Array.Sort(values);
    return values;
}`,
          checks: [
            { kind: 'regex', value: 'Clone\\(\\)|ToArray\\(\\)|new int\\[', message: 'Copies before sorting' }
          ],
          run: { expectedOutput: 'original: 5,1,4' },
          label: 'Removed the side effect'
        }
      ],
      hints: [],
      solution: `int[] data = { 5, 1, 4 };
int[] sorted = SortedCopy(data);

Console.WriteLine("original: " + string.Join(",", data));

static int[] SortedCopy(int[] values)
{
    int[] copy = (int[])values.Clone();
    Array.Sort(copy);
    return copy;
}`,
      explanation: 'The method name promises a copy, so the caller reasonably assumes its own array is untouched. Any method whose name does not say "sort" should not sort its input.'
    },
    {
      id: 'fundamentals:arrays#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: report on a week of temperature readings.\n\nGiven `{ 12, 15, 9, 21, 18, 7, 14 }`, report the highest, the lowest, the average to one decimal place, and how many days were above the average.\n\nPrint exactly:\n\n```\nHigh: 21\nLow: 7\nAverage: 13.7\nAbove average: 4\n```',
      starterCode: `int[] temps = { 12, 15, 9, 21, 18, 7, 14 };

`,
      expectedConcepts: ['array', 'loop'],
      checks: [
        { kind: 'regex', value: 'foreach|for\\s*\\(', message: 'Loops over the readings' },
        { kind: 'regex', value: '\\(double\\)|1\\.0', message: 'Avoids integer division' },
        { kind: 'notContains', value: '13.7;', message: 'Calculates the average' }
      ],
      run: { expectedOutput: 'High: 21\nLow: 7\nAverage: 13.7\nAbove average: 4' },
      hints: [
        'One pass finds the high, low and total.',
        'The average needs a cast to avoid integer division.',
        'Counting how many are above average needs a **second** pass, because you cannot know the average until the first pass is finished.'
      ],
      solution: `int[] temps = { 12, 15, 9, 21, 18, 7, 14 };

int high = temps[0];
int low = temps[0];
int total = 0;

foreach (int t in temps)
{
    if (t > high) high = t;
    if (t < low) low = t;
    total += t;
}

double average = (double)total / temps.Length;

int aboveAverage = 0;
foreach (int t in temps)
{
    if (t > average) aboveAverage++;
}

Console.WriteLine($"High: {high}");
Console.WriteLine($"Low: {low}");
Console.WriteLine($"Average: {average:F1}");
Console.WriteLine($"Above average: {aboveAverage}");`,
      explanation: 'The two-pass structure is forced by the data dependency: nothing can be compared to the average until the average exists. Recognising when a second pass is genuinely required - rather than a sign of sloppiness - is a useful instinct.'
    },
    {
      id: 'fundamentals:arrays#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Rotate an array',
      prompt: 'No hints.\n\nRotate the array `{ 1, 2, 3, 4, 5, 6, 7 }` right by 3 positions, in place, without allocating a second array of the same size.\n\nPrint exactly:\n\n```\n5 6 7 1 2 3 4\n```',
      starterCode: ``,
      expectedConcepts: ['array', 'reverse'],
      checks: [
        { kind: 'regex', value: 'for\\s*\\(|while', message: 'Uses loops' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' },
        { kind: 'notContains', value: 'new int[7]', message: 'Does not allocate a full second array' }
      ],
      run: { expectedOutput: '5 6 7 1 2 3 4' },
      hints: [],
      solution: `int[] numbers = { 1, 2, 3, 4, 5, 6, 7 };
int shift = 3;

Reverse(numbers, 0, numbers.Length - 1);
Reverse(numbers, 0, shift - 1);
Reverse(numbers, shift, numbers.Length - 1);

Console.WriteLine(string.Join(" ", numbers));

static void Reverse(int[] values, int start, int end)
{
    while (start < end)
    {
        int temp = values[start];
        values[start] = values[end];
        values[end] = temp;
        start++;
        end--;
    }
}`,
      explanation: 'The triple-reverse trick: reverse the whole array, then reverse the first `k` elements, then reverse the rest. It rotates in O(n) time with O(1) extra space, and it is a genuinely surprising algorithm the first time you see it.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:arrays#q1', type: 'predict-output',
      prompt: 'What does this print?',
      code: `string[] items = new string[2];
Console.WriteLine(items[0] == null);`,
      accept: ['true'],
      explanation: 'A new array of a reference type is filled with nulls, not empty strings.'
    },
    {
      id: 'fundamentals:arrays#q2', type: 'mcq',
      prompt: 'What does `Array.Sort(myArray)` return?',
      options: ['A new sorted array', 'Nothing - it sorts in place', 'The number of swaps', 'A bool indicating success'],
      answer: 1,
      explanation: 'It returns void and modifies the array you pass in. Clone first if the caller must not see the change.'
    },
    {
      id: 'fundamentals:arrays#q3', type: 'explain',
      prompt: 'Why can you not add an element to an array, and what would you use instead?',
      expectedConcepts: ['fixed|size|contiguous', 'list'],
      minLength: 70,
      explanation: 'An array is one contiguous block of memory allocated at a fixed size, so there is nowhere to put an extra element. `List<T>` handles this by keeping a larger internal array and reallocating when it fills up.'
    },
    {
      id: 'fundamentals:arrays#q4', type: 'predict-output',
      prompt: 'What does this print?',
      code: `int[] a = { 1, 2 };
int[] b = a;
b[0] = 9;
Console.WriteLine(a[0]);`,
      accept: ['9'],
      explanation: 'Arrays are reference types - `b` is another name for the same array.'
    },
    {
      id: 'fundamentals:arrays#q5', type: 'mcq',
      prompt: 'For `int[,] grid = new int[4, 6];` what does `grid.Length` return?',
      options: ['4', '6', '24', '10'],
      answer: 2,
      explanation: '`Length` is the total element count across all dimensions. Use `GetLength(0)` and `GetLength(1)` for the individual dimensions.'
    }
  ],
  commonMistakes: [
    { mistake: 'Using `<=` with `Length` in a loop', why: 'Length looks like the last index.', fix: 'Indexes stop at `Length - 1`. Use `<`, or `foreach`.' },
    { mistake: 'Expecting assignment to copy the array', why: 'It copies for value types.', fix: 'Arrays are reference types. Use `Clone()`, `ToArray()` or `Array.Copy`.' },
    { mistake: 'Sorting an array that was passed in as a parameter', why: '`Array.Sort` is the obvious tool and there is no warning.', fix: 'Clone first unless mutating is the method\'s stated purpose.' },
    { mistake: 'Using an array when the size will change', why: 'It is the first collection you learn.', fix: '`List<T>` is almost always the right default. Use arrays for genuinely fixed data.' },
    { mistake: 'Reversing an array by looping the full length', why: 'Looping the whole thing feels complete.', fix: 'Swapping pairs needs only half the passes - going all the way undoes the work.' }
  ],
  realWorld: [
    '`string.Split` returns an array, so every CSV parser starts with one.',
    'Byte arrays are how files, network payloads and cryptographic data are represented throughout .NET.',
    'In graphics and game code, arrays are chosen over lists specifically for their contiguous memory layout.',
    '`IndexOutOfRangeException` is among the most common runtime exceptions in production .NET logs.'
  ],
  resources: [
    { label: 'Practise the bounds', note: 'Write a forward loop and a backward loop from memory. Both bound patterns should become automatic.' }
  ]
}
,
/* ============================================================
   12. LISTS
   ============================================================ */
{
  topicId: 'fundamentals:lists',
  title: 'Lists',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 40,
  prerequisites: ['fundamentals:arrays'],
  objectives: [
    'Create and use a List<T> and explain what the <T> means',
    'Add, insert, remove and search items safely',
    'Explain how a List grows and why that matters for performance',
    'Avoid modifying a list while iterating it',
    'Choose between List<T> and an array with a reason'
  ],
  sections: [
    {
      id: 'basics',
      title: 'What a List is',
      blocks: [
        { type: 'code', code: `var names = new List<string>();
names.Add("Barani");
names.Add("Sam");

var numbers = new List<int> { 1, 2, 3 };   // collection initialiser

Console.WriteLine(names.Count);     // 2  (Count, not Length)
Console.WriteLine(names[0]);        // indexable like an array
names.RemoveAt(0);` },
        { type: 'text', text: '`List<T>` is a resizable array. The `<T>` is a **type parameter** - `List<string>` holds strings and nothing else, checked at compile time.' },
        { type: 'note', text: 'Note `Count`, not `Length`. Arrays have `Length`; lists and most other collections have `Count`. Mixing them up is a very common early error.' }
      ]
    },
    {
      id: 'operations',
      title: 'The operations you will actually use',
      blocks: [
        { type: 'table', head: ['Call', 'Does', 'Cost'], rows: [
          ['`Add(item)`', 'append to the end', 'fast (usually)'],
          ['`Insert(i, item)`', 'insert at a position', 'slow - shifts everything after'],
          ['`Remove(item)`', 'remove the first match', 'slow - searches then shifts'],
          ['`RemoveAt(i)`', 'remove by position', 'slow - shifts'],
          ['`RemoveAll(predicate)`', 'remove everything matching', 'one pass'],
          ['`Contains(item)`', 'is it there?', 'slow - scans every item'],
          ['`IndexOf(item)`', 'where is it, or -1', 'slow - scans'],
          ['`list[i]`', 'read or write by position', 'instant'],
          ['`Sort()`', 'sort in place', 'n log n'],
          ['`Clear()`', 'empty it', 'fast']
        ] },
        { type: 'warning', text: '`Contains` and `IndexOf` scan the whole list. Calling `Contains` inside a loop over another list is the classic accidental O(n squared) - for membership tests use a `HashSet<T>` instead.' }
      ]
    },
    {
      id: 'growth',
      title: 'How a List grows',
      blocks: [
        { type: 'text', text: 'Internally a `List<T>` holds an array with spare room. `Count` is how many items you have put in; `Capacity` is how many will fit before it has to grow.' },
        { type: 'code', code: `var list = new List<int>();
Console.WriteLine($"{list.Count} {list.Capacity}");   // 0 0

list.Add(1);
Console.WriteLine($"{list.Count} {list.Capacity}");   // 1 4

for (int i = 0; i < 4; i++) list.Add(i);
Console.WriteLine($"{list.Count} {list.Capacity}");   // 5 8` },
        { type: 'text', text: 'When it runs out of room it allocates a new array of **double** the size and copies everything across. Doubling means the copying is rare enough that `Add` averages out to fast.' },
        { type: 'note', text: 'If you know roughly how many items are coming, say so: `new List<int>(1000)`. It avoids the repeated allocate-and-copy entirely.' }
      ]
    },
    {
      id: 'mutation',
      title: 'Do not modify while iterating',
      blocks: [
        { type: 'code', code: `var list = new List<int> { 1, 2, 3, 4 };

foreach (int n in list)
{
    if (n % 2 == 0) list.Remove(n);   // InvalidOperationException
}` },
        { type: 'code', caption: 'Three correct ways', code: `list.RemoveAll(n => n % 2 == 0);                 // best

for (int i = list.Count - 1; i >= 0; i--)        // backwards
    if (list[i] % 2 == 0) list.RemoveAt(i);

var kept = list.Where(n => n % 2 != 0).ToList();  // new list` },
        { type: 'text', text: 'The same rule as arrays and any other collection: changing a collection invalidates any enumerator over it, and .NET throws rather than misbehaving silently.' }
      ]
    },
    {
      id: 'choosing',
      title: 'List or array?',
      blocks: [
        { type: 'table', head: ['Use', 'When'], rows: [
          ['`List<T>`', 'the size changes, or you do not know it up front - the default choice'],
          ['`T[]`', 'the size is genuinely fixed, or an API requires one'],
          ['`IEnumerable<T>`', 'as a **parameter** type, when you only need to read it once'],
          ['`IReadOnlyList<T>`', 'as a **return** type, when the caller must not modify it']
        ] },
        { type: 'text', text: 'A useful habit: accept the least specific type you can (`IEnumerable<T>`) and return the most useful one you can. That keeps your methods usable with arrays, lists and LINQ results alike.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Building and querying a list',
      code: `var tasks = new List<string> { "write tests", "review PR" };

tasks.Add("deploy");
tasks.Insert(0, "stand-up");
tasks.Remove("review PR");

Console.WriteLine($"Count: {tasks.Count}");
Console.WriteLine(string.Join(" | ", tasks));
Console.WriteLine($"Contains deploy: {tasks.Contains("deploy")}");
Console.WriteLine($"Index of deploy: {tasks.IndexOf("deploy")}");`,
      walkthrough: [
        { line: 'tasks.Insert(0, "stand-up");', note: 'Inserting at the front shifts every other item up one place. Cheap for 4 items, expensive for 400,000.' },
        { line: 'tasks.Remove("review PR");', note: 'Removes the **first** match by value. Returns a bool telling you whether anything was found.' },
        { line: 'tasks.IndexOf("deploy")', note: 'Returns -1 when not found - not an exception, and not null.' }
      ],
      output: 'Count: 3\nstand-up | write tests | deploy\nContains deploy: True\nIndex of deploy: 2',
      takeaway: 'Add at the end is cheap; inserting and removing in the middle is not. Choose the operation that matches the shape of your data.'
    },
    {
      id: 'ex2',
      title: 'Removing safely',
      code: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

numbers.RemoveAll(n => n % 2 == 0);
Console.WriteLine(string.Join(",", numbers));

var more = new List<int> { 1, 2, 3, 4, 5, 6 };
for (int i = more.Count - 1; i >= 0; i--)
{
    if (more[i] % 2 == 0) more.RemoveAt(i);
}
Console.WriteLine(string.Join(",", more));`,
      walkthrough: [
        { line: 'numbers.RemoveAll(n => n % 2 == 0);', note: 'One call, one pass, no enumerator problem. The lambda is a predicate - it answers "should this go?".' },
        { line: 'for (int i = more.Count - 1; i >= 0; i--)', note: 'Backwards works because removing index `i` only shifts elements you have already visited.' }
      ],
      output: '1,3,5\n1,3,5',
      takeaway: 'Both are correct. `RemoveAll` says what you mean in one line, so prefer it.'
    },
    {
      id: 'ex3',
      title: 'Capacity growing behind the scenes',
      code: `var list = new List<int>();
int lastCapacity = -1;

for (int i = 0; i < 20; i++)
{
    list.Add(i);
    if (list.Capacity != lastCapacity)
    {
        Console.WriteLine($"Count {list.Count} -> Capacity {list.Capacity}");
        lastCapacity = list.Capacity;
    }
}`,
      walkthrough: [
        { line: 'list.Capacity', note: 'How many items fit before the internal array must be replaced.' },
        { line: 'if (list.Capacity != lastCapacity)', note: 'Only prints when the capacity actually changed, so you see each growth step.' }
      ],
      output: 'Count 1 -> Capacity 4\nCount 5 -> Capacity 8\nCount 9 -> Capacity 16\nCount 17 -> Capacity 32',
      takeaway: 'Capacity doubles: 4, 8, 16, 32. Each doubling copies everything, which is why pre-sizing a large list is worth doing when you can.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:lists#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'Which property gives the number of items in a `List<T>`?',
      options: ['`Length`', '`Count`', '`Size`', '`Capacity`'],
      answer: 1,
      hints: [
        'Arrays and lists use different names for this.',
        '`Capacity` is a different thing - it is how many would fit, not how many are there.'
      ],
      explanation: 'Lists use `Count`; arrays use `Length`. `Capacity` is the internal array size, which is usually larger than `Count`.',
      solution: '`Count`'
    },
    {
      id: 'fundamentals:lists#g2',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `var list = new List<int> { 10, 20, 30 };
list.RemoveAt(0);
Console.WriteLine(list[0]);`,
      accept: ['20'],
      hints: [
        'Removing an item shifts everything after it down one position.',
        'After removing index 0, what is now at index 0?'
      ],
      explanation: 'Removing the first item shifts 20 into position 0. This shifting is exactly why removing from the front of a list is slow.',
      solution: '20'
    },
    {
      id: 'fundamentals:lists#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Build a list of the three names Barani, Sam and Alex, add a fourth, remove Sam, then print the count and the names separated by commas.\n\nPrint exactly:\n\n```\nCount: 3\nBarani,Alex,Jo\n```',
      starterCode: ``,
      expectedConcepts: ['List', 'Add', 'Remove'],
      checks: [
        { kind: 'regex', value: 'List<string>', message: 'Uses a List<string>' },
        { kind: 'regex', value: '\\.Add\\(', message: 'Adds an item' },
        { kind: 'regex', value: '\\.Remove\\(', message: 'Removes an item' },
        { kind: 'regex', value: 'Count', message: 'Prints the count' }
      ],
      run: { expectedOutput: 'Count: 3\nBarani,Alex,Jo' },
      hints: [
        'Create with a collection initialiser: `var names = new List<string> { "Barani", "Sam", "Alex" };`',
        'Add "Jo" - it goes on the end.',
        'Then `names.Remove("Sam");` and print with `string.Join(",", names)`.'
      ],
      solution: `var names = new List<string> { "Barani", "Sam", "Alex" };

names.Add("Jo");
names.Remove("Sam");

Console.WriteLine($"Count: {names.Count}");
Console.WriteLine(string.Join(",", names));`,
      explanation: 'Note the order of the output: removing Sam leaves Barani, Alex, Jo - the addition happened before the removal, so Jo is at the end.'
    },
    {
      id: 'fundamentals:lists#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'From the list `{ 4, 7, 2, 9, 4, 1, 7 }` build a new list containing only the values that appear exactly once, keeping their original order.\n\nPrint exactly:\n\n```\n2 9 1\n```\n\nDo not use LINQ.',
      starterCode: `var numbers = new List<int> { 4, 7, 2, 9, 4, 1, 7 };

`,
      expectedConcepts: ['List', 'loop'],
      checks: [
        { kind: 'regex', value: 'new List<int>', message: 'Builds a second list' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '2 9 1' },
      hints: [
        'For each value, you need to know how many times it appears in the whole list.',
        'A nested loop counting occurrences is fine at this size.',
        'Add to the result only when the count is exactly 1.'
      ],
      solution: `var numbers = new List<int> { 4, 7, 2, 9, 4, 1, 7 };
var unique = new List<int>();

foreach (int candidate in numbers)
{
    int occurrences = 0;
    foreach (int n in numbers)
    {
        if (n == candidate) occurrences++;
    }

    if (occurrences == 1) unique.Add(candidate);
}

Console.WriteLine(string.Join(" ", unique));`,
      explanation: 'This is O(n squared) - fine for seven items, poor for seventy thousand. A `Dictionary<int,int>` of counts would make it O(n), which is the next topic.'
    },
    {
      id: 'fundamentals:lists#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Merge two already-sorted lists into one sorted list, without sorting afterwards.\n\nGiven `{ 1, 4, 7 }` and `{ 2, 3, 9 }` print exactly:\n\n```\n1 2 3 4 7 9\n```\n\nDo not call `Sort()` or use LINQ.',
      starterCode: `var a = new List<int> { 1, 4, 7 };
var b = new List<int> { 2, 3, 9 };

`,
      expectedConcepts: ['List', 'index'],
      checks: [
        { kind: 'regex', value: 'while|for\\s*\\(', message: 'Uses a loop' },
        { kind: 'notContains', value: '.Sort()', message: 'Does not sort' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '1 2 3 4 7 9' },
      hints: [
        'Keep an index into each list and always take the smaller of the two current items.',
        'Advance only the index you took from.',
        'When one list runs out, append everything left in the other.'
      ],
      solution: `var a = new List<int> { 1, 4, 7 };
var b = new List<int> { 2, 3, 9 };
var merged = new List<int>();

int i = 0, j = 0;

while (i < a.Count && j < b.Count)
{
    if (a[i] <= b[j]) merged.Add(a[i++]);
    else merged.Add(b[j++]);
}

while (i < a.Count) merged.Add(a[i++]);
while (j < b.Count) merged.Add(b[j++]);

Console.WriteLine(string.Join(" ", merged));`,
      explanation: 'This is the merge step of merge sort. It runs in O(n + m) because each item is looked at once - far better than concatenating and sorting.'
    },
    {
      id: 'fundamentals:lists#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain what happens internally when you `Add` to a full `List<T>`, and why that makes `Add` "usually fast".',
      expectedConcepts: ['capacity|array|internal', 'double|grow|bigger', 'copy', 'amortis|average|rare|occasional'],
      minLength: 120,
      hints: [
        'A List is built on an array. What has to happen when that array is full?',
        'By how much does it grow?',
        'How often does that growth actually occur as you add thousands of items?'
      ],
      solution: 'A `List<T>` holds an internal array with some spare capacity. When you add to a full list it allocates a new array of double the size, copies every existing element across and then adds the new one. That copy is O(n), but because the capacity doubles it happens increasingly rarely - adding n items triggers only about log n growths and copies roughly 2n elements in total, so the average cost per `Add` is constant.',
      explanation: 'This is called amortised constant time, and the same doubling strategy is used by growable arrays in most languages.'
    },
    {
      id: 'fundamentals:lists#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This throws InvalidOperationException. Work out why, explain it, then fix it.',
      brokenCode: `var names = new List<string> { "Barani", "", "Sam", "" };

foreach (string name in names)
{
    if (string.IsNullOrEmpty(name))
    {
        names.Remove(name);
    }
}

Console.WriteLine(string.Join(",", names));`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The list is being modified while a foreach is iterating it',
            '`Remove` needs an index',
            '`IsNullOrEmpty` cannot take a non-null string',
            'The list should be an array'
          ],
          answer: 0,
          label: 'Identified the collection-modified error'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which method would remove all matching items in one safe call?',
          accept: ['removeall', 'removeall()'],
          acceptContains: ['removeall'],
          label: 'Named the right method'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Barani,Sam`.',
          starterCode: `var names = new List<string> { "Barani", "", "Sam", "" };

foreach (string name in names)
{
    if (string.IsNullOrEmpty(name))
    {
        names.Remove(name);
    }
}

Console.WriteLine(string.Join(",", names));`,
          checks: [
            { kind: 'regex', value: 'RemoveAll|for\\s*\\(\\s*int\\s+i\\s*=\\s*names\\.Count', message: 'Removes safely' }
          ],
          run: { expectedOutput: 'Barani,Sam' },
          label: 'Fixed the removal'
        }
      ],
      hints: [],
      solution: `var names = new List<string> { "Barani", "", "Sam", "" };

names.RemoveAll(string.IsNullOrEmpty);

Console.WriteLine(string.Join(",", names));`,
      explanation: '`RemoveAll` takes a predicate and does the whole job in one safe pass. Note that `string.IsNullOrEmpty` can be passed directly as a method group - it already has the right shape.'
    },
    {
      id: 'fundamentals:lists#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This runs, but is far slower than it should be on large inputs. Explain and fix.',
      brokenCode: `var allIds = new List<int>();
for (int i = 0; i < 20; i++) allIds.Add(i);

var bannedIds = new List<int> { 3, 7, 11, 15 };
var allowed = new List<int>();

foreach (int id in allIds)
{
    if (!bannedIds.Contains(id))
    {
        allowed.Add(id);
    }
}

Console.WriteLine(allowed.Count);`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is the performance problem?',
          options: [
            '`List.Contains` scans the whole list, so this is O(n x m)',
            '`Add` is slow because the list grows',
            'The loop should be a `for` loop',
            '`allowed` should be an array'
          ],
          answer: 0,
          label: 'Identified the nested scan'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which collection type gives near-instant membership tests?',
          accept: ['hashset', 'hashset<t>'],
          acceptContains: ['hashset'],
          label: 'Named the right collection'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it using a HashSet so the lookup is O(1). It should still print `16`.',
          starterCode: `var allIds = new List<int>();
for (int i = 0; i < 20; i++) allIds.Add(i);

var bannedIds = new List<int> { 3, 7, 11, 15 };
var allowed = new List<int>();

foreach (int id in allIds)
{
    if (!bannedIds.Contains(id))
    {
        allowed.Add(id);
    }
}

Console.WriteLine(allowed.Count);`,
          checks: [
            { kind: 'regex', value: 'HashSet<int>', message: 'Uses a HashSet for the lookup' }
          ],
          run: { expectedOutput: '16' },
          label: 'Made the lookup O(1)'
        }
      ],
      hints: [],
      solution: `var allIds = new List<int>();
for (int i = 0; i < 20; i++) allIds.Add(i);

var bannedIds = new HashSet<int> { 3, 7, 11, 15 };
var allowed = new List<int>();

foreach (int id in allIds)
{
    if (!bannedIds.Contains(id))
    {
        allowed.Add(id);
    }
}

Console.WriteLine(allowed.Count);`,
      explanation: 'At 20 items the difference is invisible. At 20,000 against 5,000 banned ids it is 100 million comparisons versus 20,000 - the difference between instant and a coffee break. Spotting a `Contains` on a list inside a loop is one of the most valuable performance instincts you can build.'
    },
    {
      id: 'fundamentals:lists#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: manage a simple to-do list.\n\nStart with `{ "write tests", "review PR", "deploy" }`. Add "update docs", mark "review PR" done by removing it, insert "stand-up" at the front, then report the count and the position of "deploy".\n\nPrint exactly:\n\n```\nCount: 4\nstand-up, write tests, deploy, update docs\ndeploy is at position 2\n```',
      starterCode: ``,
      expectedConcepts: ['List', 'Insert', 'IndexOf'],
      checks: [
        { kind: 'regex', value: '\\.Insert\\(', message: 'Uses Insert' },
        { kind: 'regex', value: '\\.IndexOf\\(', message: 'Uses IndexOf' },
        { kind: 'regex', value: '\\.Remove\\(', message: 'Uses Remove' }
      ],
      run: { expectedOutput: 'Count: 4\nstand-up, write tests, deploy, update docs\ndeploy is at position 2' },
      hints: [
        'Do the operations in the order described - the order changes the final positions.',
        '`Insert(0, item)` puts something at the front.',
        '`IndexOf` returns the position, or -1 if the item is not there.'
      ],
      solution: `var tasks = new List<string> { "write tests", "review PR", "deploy" };

tasks.Add("update docs");
tasks.Remove("review PR");
tasks.Insert(0, "stand-up");

Console.WriteLine($"Count: {tasks.Count}");
Console.WriteLine(string.Join(", ", tasks));
Console.WriteLine($"deploy is at position {tasks.IndexOf("deploy")}");`,
      explanation: 'Every index in the list shifted when "stand-up" was inserted at the front - which is why the final `IndexOf` is needed rather than a remembered position. Cached indexes into a mutable list go stale.'
    },
    {
      id: 'fundamentals:lists#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Group into chunks',
      prompt: 'No hints.\n\nSplit the list `{ 1, 2, 3, 4, 5, 6, 7 }` into chunks of 3 and print each chunk on its own line.\n\nPrint exactly:\n\n```\n1,2,3\n4,5,6\n7\n```\n\nDo not use LINQ.',
      starterCode: ``,
      expectedConcepts: ['List', 'loop'],
      checks: [
        { kind: 'regex', value: 'List<List<int>>|new List<int>\\(\\)', message: 'Builds chunk lists' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '1,2,3\n4,5,6\n7' },
      hints: [],
      solution: `var source = new List<int> { 1, 2, 3, 4, 5, 6, 7 };
int chunkSize = 3;
var chunks = new List<List<int>>();

for (int i = 0; i < source.Count; i += chunkSize)
{
    var chunk = new List<int>();

    for (int j = i; j < i + chunkSize && j < source.Count; j++)
    {
        chunk.Add(source[j]);
    }

    chunks.Add(chunk);
}

foreach (var chunk in chunks)
{
    Console.WriteLine(string.Join(",", chunk));
}`,
      explanation: 'The `j < source.Count` guard in the inner loop is what handles the short final chunk. Chunking is how you batch database writes, paginate results and stay within API rate limits, so it is worth being able to write from memory.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:lists#q1', type: 'mcq',
      prompt: 'What is the difference between `Count` and `Capacity`?',
      options: [
        'They are the same',
        '`Count` is how many items there are; `Capacity` is how many would fit before growing',
        '`Capacity` is how many items there are',
        '`Count` only works on arrays'
      ],
      answer: 1,
      explanation: '`Capacity` is the size of the internal array. It is normally larger than `Count`.'
    },
    {
      id: 'fundamentals:lists#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var list = new List<int> { 1, 2, 3 };
Console.WriteLine(list.IndexOf(5));`,
      accept: ['-1'],
      explanation: '`IndexOf` returns -1 when the item is not present. It does not throw and does not return null.'
    },
    {
      id: 'fundamentals:lists#q3', type: 'explain',
      prompt: 'Why is calling `list.Contains(x)` inside a loop over another list a performance problem, and what would you use instead?',
      expectedConcepts: ['scan|every item|linear|o(n)', 'nested|loop|squared|multiply', 'hashset|dictionary|set'],
      minLength: 90,
      explanation: '`Contains` on a list scans every element, so doing it once per item of another list multiplies the two sizes together. A `HashSet<T>` answers the same question in roughly constant time, turning O(n x m) into O(n + m).'
    },
    {
      id: 'fundamentals:lists#q4', type: 'mcq',
      prompt: 'Which is the safe way to remove every even number from a list?',
      options: [
        'A `foreach` calling `Remove`',
        '`list.RemoveAll(n => n % 2 == 0)`',
        'A forwards `for` loop calling `RemoveAt`',
        'Setting the matching items to null'
      ],
      answer: 1,
      explanation: '`RemoveAll` does it in one safe pass. A forwards `for` loop with `RemoveAt` skips items because the indexes shift underneath it.'
    },
    {
      id: 'fundamentals:lists#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var list = new List<int> { 1, 2, 3 };
var other = list;
other.Add(4);
Console.WriteLine(list.Count);`,
      accept: ['4'],
      explanation: '`List<T>` is a reference type, so `other` and `list` name the same list.'
    }
  ],
  commonMistakes: [
    { mistake: 'Using `Length` on a list', why: 'Arrays use `Length`.', fix: 'Lists use `Count`. The compiler will tell you, but it is worth knowing why they differ.' },
    { mistake: 'Removing inside a `foreach`', why: 'It is the natural way to express "delete the ones I do not want".', fix: 'Use `RemoveAll`, or loop backwards with a `for`.' },
    { mistake: 'Removing in a forwards `for` loop', why: 'It looks like it avoids the enumerator problem.', fix: 'It does, but the indexes shift and you skip items. Go backwards.' },
    { mistake: '`Contains` inside a loop', why: 'It reads perfectly clearly.', fix: 'For repeated membership tests, put the lookup data in a `HashSet<T>` first.' },
    { mistake: 'Not pre-sizing a list you know will be large', why: 'The default constructor is right there.', fix: '`new List<int>(expectedCount)` avoids repeated doubling and copying.' }
  ],
  realWorld: [
    'Every collection returned from an EF Core query materialises into a `List<T>` when you call `ToList()`.',
    'API responses are almost always serialised from lists, and the `Count` is what drives pagination.',
    'The collection-modified exception is one of the most frequently searched .NET runtime errors.',
    'Accidental O(n squared) from `Contains` in a loop is a classic cause of a service that works in testing and times out in production.'
  ],
  resources: [
    { label: 'Watch it grow', note: 'Run example 3 and change the starting capacity. Seeing the doubling makes the amortised-cost argument concrete.' }
  ]
}

,
/* ============================================================
   13. DICTIONARIES
   ============================================================ */
{
  topicId: 'fundamentals:dictionaries',
  title: 'Dictionaries',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 45,
  prerequisites: ['fundamentals:lists'],
  objectives: [
    'Create and use a Dictionary<TKey, TValue> and explain what problem it solves',
    'Explain why lookup is near-instant regardless of size',
    'Choose correctly between the indexer, ContainsKey, TryGetValue and GetValueOrDefault',
    'Avoid KeyNotFoundException and duplicate-key exceptions',
    'Recognise the counting and grouping patterns that dictionaries make trivial'
  ],
  sections: [
    {
      id: 'what',
      title: 'What a dictionary is for',
      blocks: [
        { type: 'text', text: 'A dictionary maps **keys** to **values** and finds a value by its key almost instantly, no matter how many entries there are.' },
        { type: 'code', code: `var ages = new Dictionary<string, int>();

ages["Barani"] = 28;          // add or update
ages.Add("Sam", 34);          // add - throws if the key already exists

Console.WriteLine(ages["Barani"]);   // 28
Console.WriteLine(ages.Count);       // 2` },
        { type: 'analogy', text: 'A list is a row of numbered boxes: to find something you open every box. A dictionary is a filing cabinet with labelled drawers: you go straight to the label.' },
        { type: 'text', text: 'The performance difference is the entire point. Finding an item in a list of a million entries means up to a million comparisons. In a dictionary it is one hash calculation and a handful of comparisons - the same cost as finding it in a dictionary of ten.' }
      ]
    },
    {
      id: 'access',
      title: 'Four ways to read a value, and when to use each',
      blocks: [
        { type: 'code', code: `var ages = new Dictionary<string, int> { ["Barani"] = 28 };

// 1. Indexer - throws KeyNotFoundException if missing
int a = ages["Barani"];

// 2. ContainsKey then index - two lookups
if (ages.ContainsKey("Sam")) { int b = ages["Sam"]; }

// 3. TryGetValue - one lookup, no exception  <- usually best
if (ages.TryGetValue("Sam", out int c)) { Console.WriteLine(c); }

// 4. GetValueOrDefault - when a default is fine
int d = ages.GetValueOrDefault("Sam", 0);` },
        { type: 'table', head: ['Approach', 'Missing key', 'Lookups', 'Use when'], rows: [
          ['`dict[key]`', 'throws', '1', 'the key must be there; missing is a bug'],
          ['`ContainsKey` + index', 'you branch', '2', 'rarely - prefer TryGetValue'],
          ['`TryGetValue`', 'returns false', '1', 'the key may or may not be there'],
          ['`GetValueOrDefault`', 'gives a default', '1', 'a default is genuinely meaningful']
        ] },
        { type: 'warning', text: '`ContainsKey` followed by the indexer does the hashing work twice. `TryGetValue` does it once. In a hot loop that is a real difference, and it reads better too.' }
      ]
    },
    {
      id: 'adding',
      title: 'Add versus the indexer',
      blocks: [
        { type: 'code', code: `var d = new Dictionary<string, int>();

d["a"] = 1;
d["a"] = 2;      // fine - overwrites, d["a"] is now 2

d.Add("b", 1);
// d.Add("b", 2); // ArgumentException: an item with the same key has already been added

d.TryAdd("b", 3);  // returns false, changes nothing, never throws` },
        { type: 'text', text: 'The indexer means "set this key to this value, whatever was there before". `Add` means "this key is new, and it is a bug if it is not". Pick the one that matches your intent - the exception is useful when a duplicate really would be a bug.' }
      ]
    },
    {
      id: 'iterating',
      title: 'Iterating',
      blocks: [
        { type: 'code', code: `var stock = new Dictionary<string, int> { ["apple"] = 5, ["pear"] = 2 };

foreach (var pair in stock)
{
    Console.WriteLine($"{pair.Key}: {pair.Value}");
}

foreach (var (item, count) in stock)     // deconstruct
{
    Console.WriteLine($"{item} x{count}");
}

foreach (string key in stock.Keys) { }
foreach (int value in stock.Values) { }` },
        { type: 'warning', text: 'Do not rely on the order. A dictionary makes no ordering guarantee and the order can change between .NET versions. If order matters, sort the keys explicitly or use a different structure.' }
      ]
    },
    {
      id: 'patterns',
      title: 'The two patterns you will use constantly',
      blocks: [
        { type: 'code', caption: 'Counting', code: `var counts = new Dictionary<string, int>();

foreach (string word in words)
{
    counts[word] = counts.GetValueOrDefault(word, 0) + 1;
}` },
        { type: 'code', caption: 'Grouping', code: `var byLetter = new Dictionary<char, List<string>>();

foreach (string name in names)
{
    char first = name[0];

    if (!byLetter.TryGetValue(first, out var group))
    {
        group = new List<string>();
        byLetter[first] = group;
    }

    group.Add(name);
}` },
        { type: 'text', text: 'Counting and grouping cover an enormous proportion of real data work. Recognising a problem as one of these two shapes is most of the battle.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Counting words',
      code: `string[] words = { "red", "blue", "red", "green", "blue", "red" };
var counts = new Dictionary<string, int>();

foreach (string word in words)
{
    counts[word] = counts.GetValueOrDefault(word, 0) + 1;
}

foreach (var pair in counts)
{
    Console.WriteLine($"{pair.Key}: {pair.Value}");
}`,
      walkthrough: [
        { line: 'counts.GetValueOrDefault(word, 0)', note: 'Returns the current count, or 0 the first time the word is seen. That removes the "have I seen this before?" branch entirely.' },
        { line: 'counts[word] = ... + 1;', note: 'The indexer adds the key if it is new and overwrites it if it is not - exactly what counting needs.' }
      ],
      output: 'red: 3\nblue: 2\ngreen: 1',
      takeaway: 'Three lines to count anything. Doing this with a list would need a nested scan and be far slower.'
    },
    {
      id: 'ex2',
      title: 'Safe lookup with TryGetValue',
      code: `var prices = new Dictionary<string, decimal>
{
    ["keyboard"] = 89.99m,
    ["mouse"] = 24.50m
};

string[] wanted = { "mouse", "monitor" };

foreach (string item in wanted)
{
    if (prices.TryGetValue(item, out decimal price))
    {
        Console.WriteLine($"{item}: {price}");
    }
    else
    {
        Console.WriteLine($"{item}: not stocked");
    }
}`,
      walkthrough: [
        { line: 'TryGetValue(item, out decimal price)', note: 'One lookup. Returns true and fills `price`, or returns false and leaves `price` as 0.' },
        { line: 'prices["monitor"]', note: 'Had you used the indexer here instead, this would have thrown `KeyNotFoundException` and crashed the loop.' }
      ],
      output: 'mouse: 24.50\nmonitor: not stocked',
      takeaway: 'The same `Try` shape as `int.TryParse`. Whenever .NET offers you a `Try` method, it is telling you that failure is expected.'
    },
    {
      id: 'ex3',
      title: 'Grouping names by first letter',
      code: `string[] names = { "Barani", "Sam", "Bella", "Alex", "Sara" };
var groups = new Dictionary<char, List<string>>();

foreach (string name in names)
{
    char key = name[0];

    if (!groups.TryGetValue(key, out var bucket))
    {
        bucket = new List<string>();
        groups[key] = bucket;
    }

    bucket.Add(name);
}

foreach (char key in groups.Keys.OrderBy(k => k))
{
    Console.WriteLine($"{key}: {string.Join(", ", groups[key])}");
}`,
      walkthrough: [
        { line: 'if (!groups.TryGetValue(key, out var bucket))', note: 'The "get it or create it" pattern. Without this, the first name for each letter would have nowhere to go.' },
        { line: 'groups.Keys.OrderBy(k => k)', note: 'Dictionary order is not guaranteed, so the keys are sorted explicitly for predictable output.' }
      ],
      output: 'A: Alex\nB: Barani, Bella\nS: Sam, Sara',
      takeaway: 'A dictionary whose values are lists is how you group anything. LINQ has `GroupBy` for this, but writing it by hand once makes `GroupBy` obvious later.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:dictionaries#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'What happens when you read `dict["missing"]` for a key that is not there?',
      options: [
        'It returns null',
        'It returns the default value for the type',
        'It throws a `KeyNotFoundException`',
        'It adds the key with a default value'
      ],
      answer: 2,
      hints: [
        'Reading and writing through the indexer behave differently.',
        'Writing adds the key. Reading cannot invent a value, so what is left?'
      ],
      explanation: 'The indexer throws on a missing key when reading. Use `TryGetValue` or `GetValueOrDefault` when the key may be absent.',
      solution: 'It throws a `KeyNotFoundException`'
    },
    {
      id: 'fundamentals:dictionaries#g2',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `var d = new Dictionary<string, int>();
d["a"] = 1;
d["a"] = 2;
Console.WriteLine(d.Count);`,
      accept: ['1'],
      hints: [
        'Keys in a dictionary are unique.',
        'Assigning to an existing key does not add a second entry.'
      ],
      explanation: 'The second assignment overwrites the value for the existing key, so there is still only one entry.',
      solution: '1'
    },
    {
      id: 'fundamentals:dictionaries#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'Build a dictionary of three country codes to country names (`"IN"` to `"India"`, `"GB"` to `"United Kingdom"`, `"US"` to `"United States"`), then look up `"GB"` and `"FR"` safely.\n\nPrint exactly:\n\n```\nGB: United Kingdom\nFR: unknown\n```',
      starterCode: ``,
      expectedConcepts: ['Dictionary', 'TryGetValue'],
      checks: [
        { kind: 'regex', value: 'Dictionary<string,\\s*string>', message: 'Uses a Dictionary<string, string>' },
        { kind: 'regex', value: 'TryGetValue|GetValueOrDefault', message: 'Looks up safely' }
      ],
      run: { expectedOutput: 'GB: United Kingdom\nFR: unknown' },
      hints: [
        'Initialise inline: `var countries = new Dictionary<string, string> { ["IN"] = "India", ... };`',
        'Use `TryGetValue` so the missing key does not throw.',
        'Print "unknown" in the else branch.'
      ],
      solution: `var countries = new Dictionary<string, string>
{
    ["IN"] = "India",
    ["GB"] = "United Kingdom",
    ["US"] = "United States"
};

string[] codes = { "GB", "FR" };

foreach (string code in codes)
{
    if (countries.TryGetValue(code, out string? name))
    {
        Console.WriteLine($"{code}: {name}");
    }
    else
    {
        Console.WriteLine($"{code}: unknown");
    }
}`,
      explanation: 'Note `out string? name` - the compiler knows the value may be null when the lookup fails, and the nullable annotation keeps it honest.'
    },
    {
      id: 'fundamentals:dictionaries#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Count how many times each character appears in `"programming"` and print them in the order they first appear.\n\nPrint exactly:\n\n```\np:1 r:2 o:1 g:2 a:1 m:2 i:1 n:1\n```\n\n(One line, entries separated by single spaces.)',
      starterCode: ``,
      expectedConcepts: ['Dictionary', 'counting'],
      checks: [
        { kind: 'regex', value: 'Dictionary<char,\\s*int>', message: 'Uses a Dictionary<char, int>' },
        { kind: 'regex', value: 'GetValueOrDefault|ContainsKey|TryGetValue', message: 'Handles the first occurrence of each character' }
      ],
      run: { expectedOutput: 'p:1 r:2 o:1 g:2 a:1 m:2 i:1 n:1' },
      hints: [
        'Loop the characters and use the counting pattern.',
        '`counts[c] = counts.GetValueOrDefault(c, 0) + 1;` handles both the first and subsequent occurrences.',
        'A `Dictionary<char,int>` keeps insertion order for this simple case, so a plain foreach gives first-appearance order.'
      ],
      solution: `string word = "programming";
var counts = new Dictionary<char, int>();

foreach (char c in word)
{
    counts[c] = counts.GetValueOrDefault(c, 0) + 1;
}

var parts = new List<string>();
foreach (var pair in counts)
{
    parts.Add($"{pair.Key}:{pair.Value}");
}

Console.WriteLine(string.Join(" ", parts));`,
      explanation: 'The counting pattern in three lines. Note the caveat: insertion order happens to be preserved here, but the documentation does not guarantee it - if order truly matters, keep a separate `List<char>` of first-seen keys.'
    },
    {
      id: 'fundamentals:dictionaries#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Invert a dictionary: turn `{ "a" -> 1, "b" -> 2, "c" -> 3 }` into `{ 1 -> "a", 2 -> "b", 3 -> "c" }` and print the inverted pairs sorted by key.\n\nPrint exactly:\n\n```\n1=a\n2=b\n3=c\n```',
      starterCode: `var original = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2, ["c"] = 3 };

`,
      expectedConcepts: ['Dictionary', 'loop'],
      checks: [
        { kind: 'regex', value: 'Dictionary<int,\\s*string>', message: 'Builds a Dictionary<int, string>' },
        { kind: 'regex', value: 'foreach', message: 'Loops the original' }
      ],
      run: { expectedOutput: '1=a\n2=b\n3=c' },
      hints: [
        'Loop the original pairs and add `pair.Value` as the new key and `pair.Key` as the new value.',
        'Inverting only works if the original values are unique - otherwise you would lose entries.',
        'Sort the inverted keys before printing so the output is deterministic.'
      ],
      solution: `var original = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2, ["c"] = 3 };
var inverted = new Dictionary<int, string>();

foreach (var pair in original)
{
    inverted[pair.Value] = pair.Key;
}

var keys = new List<int>(inverted.Keys);
keys.Sort();

foreach (int key in keys)
{
    Console.WriteLine($"{key}={inverted[key]}");
}`,
      explanation: 'Inversion silently loses data when the original values are not unique - the last one written wins. In production code you would either guard against that or invert into a `Dictionary<int, List<string>>`.'
    },
    {
      id: 'fundamentals:dictionaries#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain why a dictionary lookup is much faster than searching a list, and name one thing you give up in exchange.',
      expectedConcepts: ['hash', 'scan|every|linear|o(n)', 'order|unordered|memory|overhead'],
      minLength: 110,
      hints: [
        'What does the dictionary do with the key before it looks anything up?',
        'What does a list have to do to find an item by value?',
        'What guarantees does a list give you that a dictionary does not?'
      ],
      solution: 'A dictionary hashes the key to work out roughly where the value is stored, so it can jump almost straight to it regardless of how many entries exist. A list has to compare against each element in turn, so the cost grows with its size. In exchange you give up ordering - a dictionary makes no guarantee about the sequence you get when iterating - and you use more memory, because the internal table keeps spare space to keep collisions rare.',
      explanation: 'The trade is memory and ordering for speed. That trade is almost always worth it when you are looking things up by key.'
    },
    {
      id: 'fundamentals:dictionaries#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This throws a KeyNotFoundException. Work out why, explain it, then fix it.',
      brokenCode: `var stock = new Dictionary<string, int> { ["apple"] = 5 };

string[] wanted = { "apple", "pear" };

foreach (string item in wanted)
{
    Console.WriteLine($"{item}: {stock[item]}");
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            'The indexer is used for a key that may not exist',
            'The dictionary should hold strings, not ints',
            '`foreach` cannot be used over a string array',
            'The dictionary needs to be sorted first'
          ],
          answer: 0,
          label: 'Identified the unsafe lookup'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which method looks up a key safely in a single operation?',
          accept: ['trygetvalue'],
          acceptContains: ['trygetvalue'],
          label: 'Named the safe method'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `apple: 5` then `pear: 0`.',
          starterCode: `var stock = new Dictionary<string, int> { ["apple"] = 5 };

string[] wanted = { "apple", "pear" };

foreach (string item in wanted)
{
    Console.WriteLine($"{item}: {stock[item]}");
}`,
          checks: [
            { kind: 'regex', value: 'TryGetValue|GetValueOrDefault', message: 'Looks up safely' }
          ],
          run: { expectedOutput: 'apple: 5\npear: 0' },
          label: 'Made the lookup safe'
        }
      ],
      hints: [],
      solution: `var stock = new Dictionary<string, int> { ["apple"] = 5 };

string[] wanted = { "apple", "pear" };

foreach (string item in wanted)
{
    Console.WriteLine($"{item}: {stock.GetValueOrDefault(item, 0)}");
}`,
      explanation: '`GetValueOrDefault` is perfect here because 0 is a meaningful answer for "how many do we have". Where there is no meaningful default, `TryGetValue` and an explicit branch is the right choice.'
    },
    {
      id: 'fundamentals:dictionaries#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This counting code throws on the second occurrence of a word. Find the bug.',
      brokenCode: `string[] words = { "a", "b", "a" };
var counts = new Dictionary<string, int>();

foreach (string word in words)
{
    counts.Add(word, counts.GetValueOrDefault(word, 0) + 1);
}

Console.WriteLine(counts["a"]);`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`Add` throws when the key already exists - it cannot update',
            '`GetValueOrDefault` is not a real method',
            'The array should be a list',
            'The counts dictionary needs an initial capacity'
          ],
          answer: 0,
          label: 'Identified the misuse of Add'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which exception type does Add throw for a duplicate key?',
          accept: ['argumentexception'],
          acceptContains: ['argument'],
          label: 'Named the exception'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `2`.',
          starterCode: `string[] words = { "a", "b", "a" };
var counts = new Dictionary<string, int>();

foreach (string word in words)
{
    counts.Add(word, counts.GetValueOrDefault(word, 0) + 1);
}

Console.WriteLine(counts["a"]);`,
          checks: [
            { kind: 'regex', value: 'counts\\[word\\]\\s*=', message: 'Uses the indexer to add or update' },
            { kind: 'notContains', value: 'counts.Add', message: 'No longer uses Add' }
          ],
          run: { expectedOutput: '2' },
          label: 'Used the indexer'
        }
      ],
      hints: [],
      solution: `string[] words = { "a", "b", "a" };
var counts = new Dictionary<string, int>();

foreach (string word in words)
{
    counts[word] = counts.GetValueOrDefault(word, 0) + 1;
}

Console.WriteLine(counts["a"]);`,
      explanation: '`Add` means "this key is new". The indexer means "set this key, whatever was there". For counting you always want the indexer. The distinction is useful though: `Add` throwing is exactly what you want when a duplicate really would indicate a bug.'
    },
    {
      id: 'fundamentals:dictionaries#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: summarise sales by region.\n\nGiven parallel arrays of regions `{ "north", "south", "north", "east", "south", "north" }` and amounts `{ 100, 250, 75, 300, 125, 50 }`, total the sales per region and print them sorted by region name, then the busiest region.\n\nPrint exactly:\n\n```\neast: 300\nnorth: 225\nsouth: 375\nBusiest: south\n```',
      starterCode: `string[] regions = { "north", "south", "north", "east", "south", "north" };
int[] amounts = { 100, 250, 75, 300, 125, 50 };

`,
      expectedConcepts: ['Dictionary', 'GetValueOrDefault'],
      checks: [
        { kind: 'regex', value: 'Dictionary<string,\\s*int>', message: 'Totals into a dictionary' },
        { kind: 'regex', value: 'GetValueOrDefault|TryGetValue|ContainsKey', message: 'Handles the first sale per region' },
        { kind: 'regex', value: 'Sort|OrderBy', message: 'Sorts for predictable output' }
      ],
      run: { expectedOutput: 'east: 300\nnorth: 225\nsouth: 375\nBusiest: south' },
      hints: [
        'Loop both arrays with a single index, since they line up.',
        'Accumulate with `totals[region] = totals.GetValueOrDefault(region, 0) + amount;`',
        'Sort the keys into a list before printing, and track the maximum separately.'
      ],
      solution: `string[] regions = { "north", "south", "north", "east", "south", "north" };
int[] amounts = { 100, 250, 75, 300, 125, 50 };

var totals = new Dictionary<string, int>();

for (int i = 0; i < regions.Length; i++)
{
    totals[regions[i]] = totals.GetValueOrDefault(regions[i], 0) + amounts[i];
}

var keys = new List<string>(totals.Keys);
keys.Sort();

string busiest = "";
int best = -1;

foreach (string key in keys)
{
    Console.WriteLine($"{key}: {totals[key]}");

    if (totals[key] > best)
    {
        best = totals[key];
        busiest = key;
    }
}

Console.WriteLine($"Busiest: {busiest}");`,
      explanation: 'Accumulating into a dictionary is the single most common data-summarisation pattern there is. Sorting the keys before printing matters - without it the output order is not guaranteed and your tests would be flaky.'
    },
    {
      id: 'fundamentals:dictionaries#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Find the anagram groups',
      prompt: 'No hints.\n\nGroup these words by their anagram signature: `{ "listen", "silent", "enlist", "google", "banana" }`.\n\nPrint each group on its own line, sorted alphabetically by the first word in the group, with the words in their original order.\n\nPrint exactly:\n\n```\nbanana\ngoogle\nlisten,silent,enlist\n```',
      starterCode: ``,
      expectedConcepts: ['Dictionary', 'grouping'],
      checks: [
        { kind: 'regex', value: 'Dictionary<string,\\s*List<string>>', message: 'Groups into a dictionary of lists' },
        { kind: 'regex', value: 'Array\\.Sort|OrderBy|ToCharArray', message: 'Builds a signature by sorting the letters' }
      ],
      run: { expectedOutput: 'banana\ngoogle\nlisten,silent,enlist' },
      hints: [],
      solution: `string[] words = { "listen", "silent", "enlist", "google", "banana" };
var groups = new Dictionary<string, List<string>>();

foreach (string word in words)
{
    char[] letters = word.ToCharArray();
    Array.Sort(letters);
    string signature = new string(letters);

    if (!groups.TryGetValue(signature, out var bucket))
    {
        bucket = new List<string>();
        groups[signature] = bucket;
    }

    bucket.Add(word);
}

var lines = new List<string>();
foreach (var group in groups.Values)
{
    lines.Add(string.Join(",", group));
}

lines.Sort();

foreach (string line in lines)
{
    Console.WriteLine(line);
}`,
      explanation: 'Sorting a word letters gives every anagram the same signature, which becomes the dictionary key. This "canonical form as key" idea turns an O(n squared) pairwise comparison into a single pass.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:dictionaries#q1', type: 'mcq',
      prompt: 'Which is the best way to read a value when the key may not be present?',
      options: ['`dict[key]`', '`dict.ContainsKey(key)` then `dict[key]`', '`dict.TryGetValue(key, out var v)`', 'A try/catch around `dict[key]`'],
      answer: 2,
      explanation: '`TryGetValue` does one lookup and reports failure as a bool. `ContainsKey` plus the indexer hashes the key twice; the indexer alone throws; the try/catch uses an exception for something entirely expected.'
    },
    {
      id: 'fundamentals:dictionaries#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var d = new Dictionary<string, int>();
Console.WriteLine(d.GetValueOrDefault("x", 7));`,
      accept: ['7'],
      explanation: '`GetValueOrDefault` returns the supplied default when the key is absent, without throwing or adding anything.'
    },
    {
      id: 'fundamentals:dictionaries#q3', type: 'explain',
      prompt: 'Explain the difference between `dict.Add(key, value)` and `dict[key] = value`, and when each is the right choice.',
      expectedConcepts: ['throw|exception|duplicate', 'overwrite|update|replace'],
      minLength: 80,
      explanation: '`Add` throws if the key is already present, which is what you want when a duplicate would mean a bug. The indexer adds or overwrites silently, which is what you want for counting, caching or any "set this value" operation.'
    },
    {
      id: 'fundamentals:dictionaries#q4', type: 'mcq',
      prompt: 'Can you rely on the order of items when iterating a `Dictionary<K,V>`?',
      options: [
        'Yes, it is insertion order',
        'Yes, it is sorted by key',
        'No - the order is not guaranteed',
        'Only for string keys'
      ],
      answer: 2,
      explanation: 'No ordering is guaranteed and it can change between runtime versions. Sort the keys explicitly if order matters.'
    },
    {
      id: 'fundamentals:dictionaries#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var d = new Dictionary<string, int> { ["a"] = 1 };
Console.WriteLine(d.TryGetValue("b", out int v));
Console.WriteLine(v);`,
      accept: ['false\n0', 'false 0', 'false0'],
      acceptContains: ['false'],
      explanation: 'When the lookup fails, `TryGetValue` returns false and sets the out parameter to the default for its type - 0 for `int`.'
    }
  ],
  commonMistakes: [
    { mistake: 'Using the indexer to read a key that might not exist', why: 'It is the shortest way to read a value.', fix: '`TryGetValue` or `GetValueOrDefault`. The indexer throws `KeyNotFoundException`.' },
    { mistake: 'Calling `Add` in a counting loop', why: 'Add sounds like the right word for "put this in the dictionary".', fix: 'Use the indexer. `Add` throws on a key that is already there.' },
    { mistake: '`ContainsKey` followed by the indexer', why: 'It reads naturally and is safe.', fix: 'It hashes the key twice. `TryGetValue` does the same job in one lookup.' },
    { mistake: 'Relying on iteration order', why: 'It often looks like insertion order in small tests.', fix: 'No order is guaranteed. Sort the keys if it matters, or use a structure that does guarantee order.' },
    { mistake: 'Using a list plus `Contains` where a dictionary belongs', why: 'Lists are more familiar.', fix: 'If you are looking things up by a key, use a dictionary. The difference is O(n) versus O(1).' }
  ],
  realWorld: [
    'Configuration, HTTP headers, query strings and JSON objects are all key-value data and all map onto dictionaries.',
    'In-memory caching in ASP.NET Core is a dictionary with expiry policies on top.',
    'Counting and grouping with a dictionary is the foundation of every reporting feature you will build.',
    'LINQ `GroupBy` and `ToDictionary` are the declarative version of the patterns in this lesson.'
  ],
  resources: [
    { label: 'Rewrite a nested loop', note: 'Find any code you have written with a `Contains` inside a loop and convert it to a dictionary or set lookup.' }
  ]
}

,
/* ============================================================
   14. HASHSET
   ============================================================ */
{
  topicId: 'fundamentals:hashset',
  title: 'HashSet',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 35,
  prerequisites: ['fundamentals:dictionaries'],
  objectives: [
    'Explain what a set is and the two guarantees it gives you',
    'Use a HashSet to deduplicate and to test membership quickly',
    'Use the set operations: union, intersection, difference',
    'Choose between List, HashSet and Dictionary with a reason',
    'Recognise when replacing a list with a set removes an O(n squared) problem'
  ],
  sections: [
    {
      id: 'what',
      title: 'What a set guarantees',
      blocks: [
        { type: 'text', text: 'A `HashSet<T>` gives you exactly two things: **no duplicates**, and **near-instant membership testing**. It does not give you order or indexing.' },
        { type: 'code', code: `var seen = new HashSet<string>();

Console.WriteLine(seen.Add("a"));   // True  - it was new
Console.WriteLine(seen.Add("a"));   // False - already there, nothing happened
Console.WriteLine(seen.Count);      // 1
Console.WriteLine(seen.Contains("a"));  // True - and this is O(1)

// seen[0];   // does not compile - a set has no index` },
        { type: 'text', text: '`Add` returning a bool is unusually useful: it tells you whether the item was new, which means "have I seen this before?" and "remember this" become a single operation.' }
      ]
    },
    {
      id: 'why',
      title: 'Why it is fast',
      blocks: [
        { type: 'text', text: 'A `HashSet<T>` is a dictionary without the values. It hashes the item to find where it would live and looks only there, so the cost does not grow with the size of the set.' },
        { type: 'table', head: ['Operation', 'List<T>', 'HashSet<T>'], rows: [
          ['`Contains`', 'O(n) - scans every item', 'O(1) - one hash'],
          ['`Add`', 'O(1) amortised', 'O(1)'],
          ['`Remove`', 'O(n)', 'O(1)'],
          ['Keeps order', 'yes', 'no'],
          ['Allows duplicates', 'yes', 'no'],
          ['Index access', 'yes', 'no']
        ] },
        { type: 'warning', text: 'The `Contains` row is the one that matters. Swapping a list for a set in a membership test inside a loop can turn minutes into milliseconds.' }
      ]
    },
    {
      id: 'operations',
      title: 'Set operations',
      blocks: [
        { type: 'code', code: `var a = new HashSet<int> { 1, 2, 3, 4 };
var b = new HashSet<int> { 3, 4, 5 };

var union = new HashSet<int>(a);
union.UnionWith(b);              // 1,2,3,4,5 - everything in either

var intersection = new HashSet<int>(a);
intersection.IntersectWith(b);   // 3,4 - only what is in both

var difference = new HashSet<int>(a);
difference.ExceptWith(b);        // 1,2 - in a but not b

Console.WriteLine(a.IsSubsetOf(new[] { 1, 2, 3, 4, 5 }));  // True
Console.WriteLine(a.Overlaps(b));                           // True` },
        { type: 'warning', text: '`UnionWith`, `IntersectWith` and `ExceptWith` all **modify the set you call them on**. Copy first - `new HashSet<int>(a)` - if you need to keep the original.' }
      ]
    },
    {
      id: 'choosing',
      title: 'List, HashSet or Dictionary?',
      blocks: [
        { type: 'table', head: ['You need', 'Use'], rows: [
          ['ordered items, duplicates allowed, access by position', '`List<T>`'],
          ['unique items, fast "is it there?"', '`HashSet<T>`'],
          ['look up a value by a key', '`Dictionary<K,V>`'],
          ['unique items **and** insertion order', 'a `List<T>` plus a `HashSet<T>` for the checks']
        ] },
        { type: 'text', text: 'The last row is a genuinely common pattern: keep the list for order and output, and the set purely to answer "have I already added this?" in constant time.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Deduplicating while keeping order',
      code: `string[] input = { "red", "blue", "red", "green", "blue" };

var seen = new HashSet<string>();
var unique = new List<string>();

foreach (string colour in input)
{
    if (seen.Add(colour))       // Add returns true only the first time
    {
        unique.Add(colour);
    }
}

Console.WriteLine(string.Join(",", unique));
Console.WriteLine($"{input.Length} in, {unique.Count} unique");`,
      walkthrough: [
        { line: 'if (seen.Add(colour))', note: 'One call does both jobs: it records the colour and tells you whether it was new. No separate `Contains` check needed.' },
        { line: 'unique.Add(colour);', note: 'The list preserves the original order, which the set alone would not.' }
      ],
      output: 'red,blue,green\n5 in, 3 unique',
      takeaway: 'The set-plus-list pairing gives you uniqueness and order together. `input.Distinct()` in LINQ does the same thing, and this is what it does underneath.'
    },
    {
      id: 'ex2',
      title: 'Set operations on two groups',
      code: `var backend = new HashSet<string> { "Barani", "Sam", "Alex" };
var frontend = new HashSet<string> { "Alex", "Jo" };

var everyone = new HashSet<string>(backend);
everyone.UnionWith(frontend);

var fullStack = new HashSet<string>(backend);
fullStack.IntersectWith(frontend);

var backendOnly = new HashSet<string>(backend);
backendOnly.ExceptWith(frontend);

Console.WriteLine("everyone: " + string.Join(",", Sorted(everyone)));
Console.WriteLine("full stack: " + string.Join(",", Sorted(fullStack)));
Console.WriteLine("backend only: " + string.Join(",", Sorted(backendOnly)));

static List<string> Sorted(HashSet<string> set)
{
    var list = new List<string>(set);
    list.Sort();
    return list;
}`,
      walkthrough: [
        { line: 'new HashSet<string>(backend)', note: 'Copy first. `UnionWith` would otherwise modify `backend` itself.' },
        { line: 'static List<string> Sorted(...)', note: 'Sets have no order, so anything you print must be sorted explicitly if the output needs to be stable.' }
      ],
      output: 'everyone: Alex,Barani,Jo,Sam\nfull stack: Alex\nbackend only: Barani,Sam',
      takeaway: 'Union, intersection and difference answer a surprising number of real questions - who has both permissions, which records are new, what has been removed since last time.'
    },
    {
      id: 'ex3',
      title: 'The performance difference, demonstrated',
      code: `var banned = new List<int>();
var bannedSet = new HashSet<int>();

for (int i = 0; i < 5000; i++)
{
    banned.Add(i);
    bannedSet.Add(i);
}

int listHits = 0;
var listWatch = System.Diagnostics.Stopwatch.StartNew();
for (int i = 0; i < 20000; i++) if (banned.Contains(i)) listHits++;
listWatch.Stop();

int setHits = 0;
var setWatch = System.Diagnostics.Stopwatch.StartNew();
for (int i = 0; i < 20000; i++) if (bannedSet.Contains(i)) setHits++;
setWatch.Stop();

Console.WriteLine($"Same answer: {listHits == setHits}");
Console.WriteLine($"List was slower: {listWatch.ElapsedTicks > setWatch.ElapsedTicks}");`,
      walkthrough: [
        { line: 'banned.Contains(i)', note: 'Scans up to 5000 items, 20000 times - up to 100 million comparisons.' },
        { line: 'bannedSet.Contains(i)', note: 'One hash per call, 20000 times.' },
        { line: 'listHits == setHits', note: 'Identical results. Only the cost differs - which is what makes this a free win.' }
      ],
      output: 'Same answer: True\nList was slower: True',
      takeaway: 'Same answer, dramatically different cost. This is the single easiest performance improvement available to a junior engineer.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:hashset#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'What does `set.Add(item)` return when the item is already in the set?',
      options: ['`true`', '`false`', 'It throws an exception', 'The existing item'],
      answer: 1,
      hints: [
        'A set cannot contain duplicates, so what can Add usefully tell you?',
        'It reports whether the item was actually new.'
      ],
      explanation: 'It returns `false` and changes nothing. That return value is what makes `if (seen.Add(x))` such a neat deduplication idiom.',
      solution: '`false`'
    },
    {
      id: 'fundamentals:hashset#g2',
      type: 'predict-output', level: 2, difficulty: 'Easy',
      prompt: 'What does this print?',
      code: `var set = new HashSet<int> { 1, 2, 2, 3, 3, 3 };
Console.WriteLine(set.Count);`,
      accept: ['3'],
      hints: [
        'A set holds each value at most once.',
        'Count the distinct values in the initialiser.'
      ],
      explanation: 'The duplicates are silently ignored, leaving 1, 2 and 3.',
      solution: '3'
    },
    {
      id: 'fundamentals:hashset#g3',
      type: 'coding', level: 2, difficulty: 'Easy',
      prompt: 'From the array `{ 3, 7, 3, 1, 7, 9, 1 }` report how many values there are in total and how many are distinct.\n\nPrint exactly:\n\n```\nTotal: 7\nDistinct: 4\n```',
      starterCode: `int[] numbers = { 3, 7, 3, 1, 7, 9, 1 };

`,
      expectedConcepts: ['HashSet'],
      checks: [
        { kind: 'regex', value: 'HashSet<int>', message: 'Uses a HashSet' },
        { kind: 'regex', value: 'Count', message: 'Reports the counts' }
      ],
      run: { expectedOutput: 'Total: 7\nDistinct: 4' },
      hints: [
        'You can construct a set directly from a collection: `new HashSet<int>(numbers)`.',
        'The duplicates disappear automatically.',
        'The array has `Length`; the set has `Count`.'
      ],
      solution: `int[] numbers = { 3, 7, 3, 1, 7, 9, 1 };
var distinct = new HashSet<int>(numbers);

Console.WriteLine($"Total: {numbers.Length}");
Console.WriteLine($"Distinct: {distinct.Count}");`,
      explanation: 'Constructing a set from a collection is the shortest deduplication there is - though it discards the original order.'
    },
    {
      id: 'fundamentals:hashset#i1',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Find the values common to both `{ 1, 2, 3, 4, 5 }` and `{ 4, 5, 6, 7 }`, and the values that are in the first but not the second. Print each group sorted.\n\nPrint exactly:\n\n```\nBoth: 4,5\nFirst only: 1,2,3\n```\n\nThe original sets must not be modified.',
      starterCode: `var first = new HashSet<int> { 1, 2, 3, 4, 5 };
var second = new HashSet<int> { 4, 5, 6, 7 };

`,
      expectedConcepts: ['IntersectWith', 'ExceptWith'],
      checks: [
        { kind: 'regex', value: 'IntersectWith', message: 'Uses IntersectWith' },
        { kind: 'regex', value: 'ExceptWith', message: 'Uses ExceptWith' },
        { kind: 'regex', value: 'new HashSet<int>\\(first\\)', message: 'Copies before modifying' }
      ],
      run: { expectedOutput: 'Both: 4,5\nFirst only: 1,2,3' },
      hints: [
        'The set operations modify the set they are called on, so copy first.',
        '`var both = new HashSet<int>(first); both.IntersectWith(second);`',
        'Sets have no order - copy into a `List<int>` and sort it before printing.'
      ],
      solution: `var first = new HashSet<int> { 1, 2, 3, 4, 5 };
var second = new HashSet<int> { 4, 5, 6, 7 };

var both = new HashSet<int>(first);
both.IntersectWith(second);

var firstOnly = new HashSet<int>(first);
firstOnly.ExceptWith(second);

Console.WriteLine("Both: " + string.Join(",", Sorted(both)));
Console.WriteLine("First only: " + string.Join(",", Sorted(firstOnly)));

static List<int> Sorted(HashSet<int> set)
{
    var list = new List<int>(set);
    list.Sort();
    return list;
}`,
      explanation: 'Copying before each operation is essential - without it the first call would destroy `first` and the second would produce nonsense. This is the same "methods should not mutate their inputs" principle seen with `Array.Sort`.'
    },
    {
      id: 'fundamentals:hashset#i2',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Find the first character that repeats in the string `"abcdbea"`, in one pass.\n\nPrint exactly:\n\n```\nFirst repeat: b\n```',
      starterCode: `string text = "abcdbea";

`,
      expectedConcepts: ['HashSet', 'Add'],
      checks: [
        { kind: 'regex', value: 'HashSet<char>', message: 'Uses a HashSet<char>' },
        { kind: 'regex', value: '\\.Add\\(', message: 'Uses Add to detect repeats' },
        { kind: 'regex', value: 'break|return', message: 'Stops at the first repeat' }
      ],
      run: { expectedOutput: 'First repeat: b' },
      hints: [
        'Walk the characters and remember each one you have seen.',
        '`Add` returns false the moment you meet a character for the second time.',
        'Stop as soon as that happens - the first false is the answer.'
      ],
      solution: `string text = "abcdbea";
var seen = new HashSet<char>();

foreach (char c in text)
{
    if (!seen.Add(c))
    {
        Console.WriteLine($"First repeat: {c}");
        break;
    }
}`,
      explanation: 'One pass, one set, constant-time checks. The nested-loop version would be O(n squared) and much longer to write.'
    },
    {
      id: 'fundamentals:hashset#i3',
      type: 'explain', level: 3, difficulty: 'Medium',
      prompt: 'Explain when you would choose a HashSet over a List, and what you give up by doing so.',
      expectedConcepts: ['unique|duplicate', 'contains|membership|lookup|fast', 'order|index'],
      minLength: 110,
      hints: [
        'What two guarantees does a set give you?',
        'What can you do with a list that you cannot do with a set?',
        'Think about the cost of `Contains` on each.'
      ],
      solution: 'Choose a HashSet when you need unique items and you will be asking "is this already there?" often - membership testing is constant time rather than a full scan. You give up ordering, so you cannot rely on the sequence when iterating, and you give up indexing, so there is no `set[0]`. You also cannot store duplicates, which is sometimes the point and sometimes a problem. When you need uniqueness and order together, keep a list for the order and a set purely for the checks.',
      explanation: 'Being able to state what you give up is what turns "I know HashSet exists" into "I know when to use it".'
    },
    {
      id: 'fundamentals:hashset#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'This is meant to keep the original set intact. It does not. Find the bug.',
      brokenCode: `var permissions = new HashSet<string> { "read", "write", "delete" };
var readOnly = new HashSet<string> { "read" };

permissions.IntersectWith(readOnly);

Console.WriteLine("permissions: " + permissions.Count);`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`IntersectWith` modifies the set it is called on, destroying `permissions`',
            '`IntersectWith` needs two arguments',
            'Sets cannot hold strings',
            'The sets must be the same size'
          ],
          answer: 0,
          label: 'Identified the in-place modification'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What should you do before calling a set operation you do not want to be destructive?',
          accept: ['copy the set'],
          acceptContains: ['copy'],
          label: 'Named the fix'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so `permissions` still has 3 entries.',
          starterCode: `var permissions = new HashSet<string> { "read", "write", "delete" };
var readOnly = new HashSet<string> { "read" };

permissions.IntersectWith(readOnly);

Console.WriteLine("permissions: " + permissions.Count);`,
          checks: [
            { kind: 'regex', value: 'new HashSet<string>\\(permissions\\)', message: 'Copies before intersecting' }
          ],
          run: { expectedOutput: 'permissions: 3' },
          label: 'Protected the original'
        }
      ],
      hints: [],
      solution: `var permissions = new HashSet<string> { "read", "write", "delete" };
var readOnly = new HashSet<string> { "read" };

var effective = new HashSet<string>(permissions);
effective.IntersectWith(readOnly);

Console.WriteLine("permissions: " + permissions.Count);`,
      explanation: 'The `With` suffix on `UnionWith`, `IntersectWith` and `ExceptWith` is the clue: they modify *this* set with the other one. LINQ `Union`, `Intersect` and `Except` return new sequences instead and leave the originals alone.'
    },
    {
      id: 'fundamentals:hashset#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This deduplication loses the original order. Fix it so order is preserved.',
      brokenCode: `string[] input = { "red", "blue", "red", "green" };

var unique = new HashSet<string>(input);

Console.WriteLine(string.Join(",", unique));`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is the problem with using a HashSet alone here?',
          options: [
            'A set does not guarantee any iteration order',
            'A set cannot hold strings',
            'The constructor does not accept an array',
            'HashSet keeps duplicates'
          ],
          answer: 0,
          label: 'Identified the ordering guarantee'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What second collection would you add to preserve the original order?',
          accept: ['a list'],
          acceptContains: ['list'],
          label: 'Named the pairing'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so it prints `red,blue,green` and is guaranteed to stay in that order.',
          starterCode: `string[] input = { "red", "blue", "red", "green" };

var unique = new HashSet<string>(input);

Console.WriteLine(string.Join(",", unique));`,
          checks: [
            { kind: 'regex', value: 'List<string>', message: 'Keeps a list for the order' },
            { kind: 'regex', value: 'HashSet<string>', message: 'Still uses a set for the checks' }
          ],
          run: { expectedOutput: 'red,blue,green' },
          label: 'Preserved the order'
        }
      ],
      hints: [],
      solution: `string[] input = { "red", "blue", "red", "green" };

var seen = new HashSet<string>();
var unique = new List<string>();

foreach (string item in input)
{
    if (seen.Add(item)) unique.Add(item);
}

Console.WriteLine(string.Join(",", unique));`,
      explanation: 'A set alone may well print in insertion order today and in a different order after a runtime upgrade - which is the worst kind of bug, because it passes every test until it does not. The list-plus-set pairing makes the guarantee explicit.'
    },
    {
      id: 'fundamentals:hashset#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: work out what changed between two deployments.\n\nYesterday the servers were `{ "web1", "web2", "db1" }`. Today they are `{ "web2", "db1", "db2", "cache1" }`.\n\nReport which servers were added, which were removed and which stayed, each sorted alphabetically.\n\nPrint exactly:\n\n```\nAdded: cache1,db2\nRemoved: web1\nUnchanged: db1,web2\n```',
      starterCode: `var yesterday = new HashSet<string> { "web1", "web2", "db1" };
var today = new HashSet<string> { "web2", "db1", "db2", "cache1" };

`,
      expectedConcepts: ['ExceptWith', 'IntersectWith'],
      checks: [
        { kind: 'regex', value: 'ExceptWith', message: 'Uses ExceptWith for added and removed' },
        { kind: 'regex', value: 'IntersectWith', message: 'Uses IntersectWith for unchanged' },
        { kind: 'regex', value: 'new HashSet<string>\\(', message: 'Copies before each operation' }
      ],
      run: { expectedOutput: 'Added: cache1,db2\nRemoved: web1\nUnchanged: db1,web2' },
      hints: [
        'Added is "today except yesterday". Removed is "yesterday except today".',
        'Unchanged is the intersection.',
        'Copy before every operation, and sort before printing.'
      ],
      solution: `var yesterday = new HashSet<string> { "web1", "web2", "db1" };
var today = new HashSet<string> { "web2", "db1", "db2", "cache1" };

var added = new HashSet<string>(today);
added.ExceptWith(yesterday);

var removed = new HashSet<string>(yesterday);
removed.ExceptWith(today);

var unchanged = new HashSet<string>(yesterday);
unchanged.IntersectWith(today);

Console.WriteLine("Added: " + string.Join(",", Sorted(added)));
Console.WriteLine("Removed: " + string.Join(",", Sorted(removed)));
Console.WriteLine("Unchanged: " + string.Join(",", Sorted(unchanged)));

static List<string> Sorted(HashSet<string> set)
{
    var list = new List<string>(set);
    list.Sort();
    return list;
}`,
      explanation: 'This three-way diff is exactly what deployment tooling, database sync and change-detection code do. Expressed with set operations it is six lines; expressed with nested loops it is thirty and much easier to get wrong.'
    },
    {
      id: 'fundamentals:hashset#c1',
      type: 'coding', level: 5, difficulty: 'Hard',
      title: 'Two-sum with a set',
      prompt: 'No hints.\n\nGiven `{ 2, 7, 11, 15, 3, 6 }` and a target of 9, find **all** distinct pairs that sum to the target, in a single pass.\n\nPrint each pair as `smaller+larger`, sorted by the smaller value:\n\n```\n2+7\n3+6\n```\n\nDo not use nested loops.',
      starterCode: ``,
      expectedConcepts: ['HashSet'],
      checks: [
        { kind: 'regex', value: 'HashSet<int>', message: 'Uses a HashSet' },
        { kind: 'notContains', value: 'System.Linq', message: 'No LINQ' }
      ],
      run: { expectedOutput: '2+7\n3+6' },
      hints: [],
      solution: `int[] numbers = { 2, 7, 11, 15, 3, 6 };
int target = 9;

var seen = new HashSet<int>();
var pairs = new List<string>();

foreach (int n in numbers)
{
    int needed = target - n;

    if (seen.Contains(needed))
    {
        int small = Math.Min(n, needed);
        int large = Math.Max(n, needed);
        pairs.Add($"{small}+{large}");
    }

    seen.Add(n);
}

pairs.Sort();

foreach (string pair in pairs)
{
    Console.WriteLine(pair);
}`,
      explanation: 'The insight: instead of comparing every pair, ask "have I already seen the number that would complete this one?". The set answers that in constant time, turning an O(n squared) problem into O(n). This is one of the most commonly asked interview questions, and the set-based solution is the one interviewers are hoping for.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:hashset#q1', type: 'mcq',
      prompt: 'Which of these can a HashSet NOT do?',
      options: [
        'Tell you whether an item is present quickly',
        'Prevent duplicates',
        'Give you the item at index 2',
        'Report how many items it holds'
      ],
      answer: 2,
      explanation: 'Sets have no ordering and therefore no indexing. If you need `set[2]`, you want a list.'
    },
    {
      id: 'fundamentals:hashset#q2', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var s = new HashSet<string>();
s.Add("x");
Console.WriteLine(s.Add("x"));`,
      accept: ['false'],
      explanation: '`Add` returns false when the item is already present.'
    },
    {
      id: 'fundamentals:hashset#q3', type: 'explain',
      prompt: 'Your colleague has a loop over 50,000 orders that calls `bannedCustomerIds.Contains(order.CustomerId)` on a `List<int>` of 5,000 ids. Explain the problem and the fix.',
      expectedConcepts: ['scan|every|linear|o(n)', 'hashset|set', 'multipl|250|million|squared'],
      minLength: 100,
      explanation: 'Each `Contains` scans up to 5,000 items, and it runs 50,000 times - up to 250 million comparisons. Changing the list to a `HashSet<int>` makes each lookup a single hash, reducing the whole operation to roughly 50,000 constant-time checks.'
    },
    {
      id: 'fundamentals:hashset#q4', type: 'mcq',
      prompt: 'What does `a.ExceptWith(b)` do?',
      options: [
        'Returns a new set containing items in a but not b',
        'Removes from `a` every item that is also in `b`',
        'Removes from `b` every item that is also in `a`',
        'Returns true if the sets differ'
      ],
      answer: 1,
      explanation: 'It modifies `a` in place. The LINQ `Except` method is the non-destructive version that returns a new sequence.'
    },
    {
      id: 'fundamentals:hashset#q5', type: 'predict-output',
      prompt: 'What does this print?',
      code: `var s = new HashSet<int>(new[] { 5, 5, 5, 2 });
Console.WriteLine(s.Count);`,
      accept: ['2'],
      explanation: 'Duplicates collapse, leaving 5 and 2.'
    }
  ],
  commonMistakes: [
    { mistake: 'Expecting a set to preserve insertion order', why: 'It often appears to in small tests.', fix: 'No order is guaranteed. Pair a `List<T>` with the set when order matters.' },
    { mistake: 'Calling `UnionWith`/`IntersectWith`/`ExceptWith` on a set you need to keep', why: 'They read like they return a result.', fix: 'They modify in place. Copy first, or use the LINQ equivalents which return new sequences.' },
    { mistake: 'Using a list for membership tests in a loop', why: 'Lists are the familiar default.', fix: 'Any repeated `Contains` should be a `HashSet<T>`. It is usually a one-word change.' },
    { mistake: 'Using a HashSet when you also need the values', why: 'It is fast, so it feels like the right tool.', fix: 'If you need a value associated with each key, that is a `Dictionary<K,V>`.' },
    { mistake: 'Using a HashSet with a custom type without equality', why: 'It compiles and appears to work.', fix: 'Without `Equals` and `GetHashCode`, reference equality is used and two identical-looking objects both get stored. You will meet this properly in Core C#.' }
  ],
  realWorld: [
    'Permission and role checks are set operations - does this user have any of the required roles?',
    'Detecting which records are new, changed or deleted between two data loads is a three-way set diff.',
    'Deduplicating email recipients, tags or ids before a bulk operation is a one-line HashSet job.',
    'Swapping a list for a set in a hot lookup is one of the most common and most effective performance fixes in .NET code review.'
  ],
  resources: [
    { label: 'Run example 3', note: 'Increase the sizes and watch the gap widen. Measuring it once makes the lesson stick permanently.' }
  ]
}

,
/* ============================================================
   15. DEBUGGING
   ============================================================ */
{
  topicId: 'fundamentals:debugging',
  title: 'Debugging',
  phaseId: 'fundamentals',
  difficulty: 'Beginner',
  estimatedMinutes: 50,
  prerequisites: ['fundamentals:arrays'],
  objectives: [
    'Read a compiler error and a stack trace and act on what they actually say',
    'Apply a systematic method instead of changing things at random',
    'Use breakpoints, stepping and the watch window deliberately',
    'Recognise the handful of exceptions that cause most .NET crashes',
    'Reproduce a bug reliably before attempting to fix it'
  ],
  sections: [
    {
      id: 'kinds',
      title: 'Three kinds of bug, three different approaches',
      blocks: [
        { type: 'table', head: ['Kind', 'When it appears', 'How you find it'], rows: [
          ['Compile-time', 'before it runs', 'read the error - it names the file, line and problem'],
          ['Runtime', 'it crashes', 'read the stack trace - it names the exact line'],
          ['Logic', 'it runs and is wrong', 'the hard one - reproduce, narrow, inspect']
        ] },
        { type: 'text', text: 'The first two tell you where to look. The third does not, and that is why most debugging skill is really about the third.' }
      ]
    },
    {
      id: 'errors',
      title: 'Reading a compiler error',
      blocks: [
        { type: 'code', code: `Program.cs(12,20): error CS0029: Cannot implicitly convert type 'string' to 'int'
//        ^   ^         ^                ^
//        |   |         |                what is wrong, in plain words
//        |   |         the error code - searchable
//        |   column
//        line` },
        { type: 'text', text: 'Fix the **first** error first. One mistake often cascades into a dozen follow-on errors that vanish the moment you correct the original.' },
        { type: 'table', head: ['Code', 'Means'], rows: [
          ['`CS0029`', 'type mismatch - you assigned the wrong type'],
          ['`CS0103`', 'name does not exist - typo or wrong scope'],
          ['`CS0165`', 'use of unassigned local variable'],
          ['`CS1061`', 'no such member - wrong type, or missing `using`'],
          ['`CS0161`', 'not all code paths return a value']
        ] }
      ]
    },
    {
      id: 'stack',
      title: 'Reading a stack trace',
      blocks: [
        { type: 'code', code: `Unhandled exception. System.NullReferenceException: Object reference not set to an instance of an object.
   at OrderService.CalculateTotal(Order order) in /src/OrderService.cs:line 42
   at OrderController.Post(Order order) in /src/OrderController.cs:line 18` },
        { type: 'list', items: [
          '**The exception type** tells you the category of mistake - `NullReferenceException` means something was null.',
          '**The top frame** is where it actually blew up: `OrderService.cs` line 42. Start there.',
          '**The frames below** are how you got there. Read downwards to understand the path.'
        ] },
        { type: 'warning', text: 'The top frame is where the symptom appeared, not necessarily where the bug is. Something set that value to null earlier - the trace tells you where to start looking, not where to stop.' }
      ]
    },
    {
      id: 'method',
      title: 'A method that works',
      blocks: [
        { type: 'list', items: [
          '**1. Reproduce it.** If you cannot make it happen on demand, you cannot know you have fixed it.',
          '**2. Read the error properly.** Out loud if necessary. Most "mysterious" bugs are explained by the message.',
          '**3. Form one hypothesis.** "I think `total` is 0 because the loop never runs."',
          '**4. Test that one hypothesis.** A breakpoint or a print. One change at a time.',
          '**5. Narrow the range.** Confirm where the value is still right and where it is first wrong. The bug lives between them.',
          '**6. Fix the cause.** Not the symptom.',
          '**7. Verify.** Re-run the original reproduction.'
        ] },
        { type: 'warning', text: 'The failure mode to avoid is changing several things at once and re-running hopefully. If it then works you do not know why, and you have probably introduced a second bug.' }
      ]
    },
    {
      id: 'tools',
      title: 'The debugger',
      blocks: [
        { type: 'table', head: ['Action', 'Shortcut (VS / Rider)', 'Does'], rows: [
          ['Breakpoint', 'F9', 'pause execution at this line'],
          ['Start debugging', 'F5', 'run until a breakpoint'],
          ['Step over', 'F10', 'run this line, do not go inside calls'],
          ['Step into', 'F11', 'go inside the method being called'],
          ['Step out', 'Shift+F11', 'finish this method and come back'],
          ['Watch', '-', 'show a variable or expression as you step'],
          ['Conditional breakpoint', 'right-click a breakpoint', 'only pause when a condition holds']
        ] },
        { type: 'text', text: 'Conditional breakpoints are the biggest time-saver of the lot. Rather than pressing F5 four hundred times to reach the bad record, break on `order.Id == 8823` and arrive instantly.' },
        { type: 'note', text: '`Console.WriteLine` debugging is not shameful and is sometimes faster - especially in loops and async code. The point is to make the invisible visible; which tool you use is secondary.' }
      ]
    },
    {
      id: 'exceptions',
      title: 'The exceptions you will actually meet',
      blocks: [
        { type: 'table', head: ['Exception', 'Usual cause', 'First thing to check'], rows: [
          ['`NullReferenceException`', 'using something that is null', 'which variable on that line could be null?'],
          ['`IndexOutOfRangeException`', 'array index past the end', 'the loop bound - is it `<=` where it should be `<`?'],
          ['`ArgumentOutOfRangeException`', 'same for List and Substring', 'the index and the Count'],
          ['`InvalidOperationException`', 'modifying a collection while iterating', 'a Remove or Add inside a foreach'],
          ['`FormatException`', 'Parse on text that is not a number', 'should this be TryParse?'],
          ['`KeyNotFoundException`', 'dictionary indexer, missing key', 'should this be TryGetValue?'],
          ['`DivideByZeroException`', 'integer division by zero', 'guard the divisor']
        ] },
        { type: 'text', text: 'Almost every crash a beginner meets is in this table, and each one has a standard first question. Learning the table is worth an afternoon.' }
      ]
    }
  ],
  examples: [
    {
      id: 'ex1',
      title: 'Narrowing a logic bug by printing',
      code: `int[] prices = { 10, 20, 30 };
int total = 0;

for (int i = 0; i < prices.Length; i++)
{
    total = prices[i];          // the bug: = instead of +=
    Console.WriteLine($"i={i} price={prices[i]} runningTotal={total}");
}

Console.WriteLine($"Final: {total}");`,
      walkthrough: [
        { line: 'Console.WriteLine($"i={i} ...")', note: 'Printing the loop variable AND the running total is what exposes the bug - the total never accumulates.' },
        { line: 'total = prices[i];', note: 'Assignment, not addition. Each iteration throws away everything before it.' }
      ],
      output: 'i=0 price=10 runningTotal=10\ni=1 price=20 runningTotal=20\ni=2 price=30 runningTotal=30\nFinal: 30',
      takeaway: 'The output makes the bug obvious: the running total equals the current price every time, so nothing is accumulating. Printing the intermediate state is the whole technique.'
    },
    {
      id: 'ex2',
      title: 'Guarding against the common exceptions',
      code: `string?[] inputs = { "5", null, "abc", "0" };

foreach (string? input in inputs)
{
    Console.WriteLine(Describe(input));
}

static string Describe(string? input)
{
    if (input is null) return "null input";
    if (!int.TryParse(input, out int value)) return $"'{input}' is not a number";
    if (value == 0) return "cannot divide by zero";

    return $"100 / {value} = {100 / value}";
}`,
      walkthrough: [
        { line: 'if (input is null) return "null input";', note: 'Guards against NullReferenceException before anything touches the string.' },
        { line: 'if (!int.TryParse(...))', note: 'Guards against FormatException without using an exception at all.' },
        { line: 'if (value == 0)', note: 'Guards against DivideByZeroException. Three of the seven common exceptions handled in three lines.' }
      ],
      output: "100 / 5 = 20\nnull input\n'abc' is not a number\ncannot divide by zero",
      takeaway: 'Most runtime exceptions are preventable with a guard clause. Writing them is faster than debugging their absence.'
    },
    {
      id: 'ex3',
      title: 'Binary search for the bug',
      code: `int[] data = { 4, 8, 15, 16, 23, 42 };

int total = 0;
Console.WriteLine($"[checkpoint 1] total={total}");

foreach (int n in data)
{
    total += n;
}
Console.WriteLine($"[checkpoint 2] total={total}");

int average = total / data.Length;
Console.WriteLine($"[checkpoint 3] average={average}");

int doubled = average * 2;
Console.WriteLine($"[checkpoint 4] doubled={doubled}");`,
      walkthrough: [
        { line: '[checkpoint 1]', note: 'Confirm the starting state is what you think it is. Surprisingly often it is not.' },
        { line: '[checkpoint 2]', note: 'After the loop. If this is wrong the bug is in the loop; if it is right the bug is later.' },
        { line: '[checkpoint 3]', note: 'Halving the search space each time finds the bug in a handful of runs even in a long method.' }
      ],
      output: '[checkpoint 1] total=0\n[checkpoint 2] total=108\n[checkpoint 3] average=18\n[checkpoint 4] doubled=36',
      takeaway: 'Put a checkpoint halfway through, decide which half the bug is in, repeat. Ten checkpoints can isolate a bug in a thousand-line process.'
    }
  ],
  exercises: [
    {
      id: 'fundamentals:debugging#g1',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'A stack trace shows three frames. Which one is where the exception was actually thrown?',
      options: ['The bottom frame', 'The top frame', 'The middle frame', 'It varies'],
      answer: 1,
      hints: [
        'The trace is printed innermost first.',
        'Read it as "this happened, and it was called by this, which was called by this".'
      ],
      explanation: 'The top frame is where it blew up. The frames below show how you got there - though the underlying cause may still be further down.',
      solution: 'The top frame'
    },
    {
      id: 'fundamentals:debugging#g2',
      type: 'mcq', level: 2, difficulty: 'Easy',
      prompt: 'You get 40 compiler errors after a small edit. What should you do first?',
      options: [
        'Fix them from the bottom up',
        'Fix the first error and rebuild',
        'Undo everything and start again',
        'Fix all the ones you understand, then rebuild'
      ],
      answer: 1,
      hints: [
        'Errors cascade - one mistake can generate many downstream complaints.',
        'What usually happens to the other 39 once the first is fixed?'
      ],
      explanation: 'One error frequently produces dozens of follow-on errors. Fix the first, rebuild, and most of the rest usually disappear.',
      solution: 'Fix the first error and rebuild'
    },
    {
      id: 'fundamentals:debugging#g3',
      type: 'predict-output', level: 2, difficulty: 'Medium',
      prompt: 'Which exception does this throw?',
      code: `var list = new List<int> { 1, 2, 3 };
Console.WriteLine(list[3]);`,
      accept: ['argumentoutofrangeexception', 'argumentoutofrange'],
      acceptContains: ['argumentoutofrange'],
      hints: [
        'The valid indexes are 0, 1 and 2.',
        'Note that `List<T>` and arrays throw *different* exception types for the same mistake.'
      ],
      explanation: 'A `List<T>` throws `ArgumentOutOfRangeException`, while an array throws `IndexOutOfRangeException`. Same mistake, different type - worth knowing when you are reading a trace.',
      solution: 'ArgumentOutOfRangeException'
    },
    {
      id: 'fundamentals:debugging#i1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'The average is always wrong. Diagnose and fix it.',
      brokenCode: `int[] scores = { 80, 90, 95 };
int total = 0;

foreach (int score in scores)
{
    total = score;
}

double average = total / scores.Length;

Console.WriteLine($"Average: {average}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'How many bugs are there?',
          options: [
            'One - the loop uses = instead of +=',
            'One - integer division loses the fraction',
            'Two - the loop assignment and the integer division',
            'None, the code is correct'
          ],
          answer: 2,
          label: 'Found both bugs'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What value does `total` hold after the loop as written?',
          accept: ['95'],
          label: 'Traced the loop'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix both bugs so the program prints `Average: 88.33`.',
          starterCode: `int[] scores = { 80, 90, 95 };
int total = 0;

foreach (int score in scores)
{
    total = score;
}

double average = total / scores.Length;

Console.WriteLine($"Average: {average}");`,
          checks: [
            { kind: 'regex', value: '\\+=', message: 'Accumulates the total' },
            { kind: 'regex', value: '\\(double\\)|1\\.0', message: 'Avoids integer division' }
          ],
          run: { expectedOutput: 'Average: 88.33' },
          label: 'Fixed both'
        }
      ],
      hints: [],
      solution: `int[] scores = { 80, 90, 95 };
int total = 0;

foreach (int score in scores)
{
    total += score;
}

double average = (double)total / scores.Length;

Console.WriteLine($"Average: {average:F2}");`,
      explanation: 'Two separate bugs producing one wrong number. Fixing only the first would still give 88 rather than 88.33. Always ask whether the remaining error is fully explained by the fix you just made.'
    },
    {
      id: 'fundamentals:debugging#i2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This crashes on some rows of the data. Diagnose the exception and make it robust.',
      brokenCode: `string?[] rows = { "12", "", null, "7", "abc" };
int total = 0;

foreach (string? row in rows)
{
    total += int.Parse(row);
}

Console.WriteLine($"Total: {total}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'Which exception is thrown FIRST as this runs?',
          options: [
            '`NullReferenceException` on the null row',
            '`FormatException` on the empty string',
            '`ArgumentNullException` on the null row',
            '`OverflowException` on "abc"'
          ],
          answer: 1,
          label: 'Identified the first failure'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'Which method should replace `int.Parse` for data that may be dirty?',
          accept: ['int.tryparse', 'tryparse'],
          acceptContains: ['tryparse'],
          label: 'Named the right tool'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so invalid rows are skipped and the program prints `Total: 19`.',
          starterCode: `string?[] rows = { "12", "", null, "7", "abc" };
int total = 0;

foreach (string? row in rows)
{
    total += int.Parse(row);
}

Console.WriteLine($"Total: {total}");`,
          checks: [
            { kind: 'regex', value: 'TryParse', message: 'Uses TryParse' },
            { kind: 'notContains', value: 'int.Parse', message: 'No longer uses Parse' }
          ],
          run: { expectedOutput: 'Total: 19' },
          label: 'Made it robust'
        }
      ],
      hints: [],
      solution: `string?[] rows = { "12", "", null, "7", "abc" };
int total = 0;

foreach (string? row in rows)
{
    if (int.TryParse(row, out int value))
    {
        total += value;
    }
}

Console.WriteLine($"Total: {total}");`,
      explanation: 'The empty string fails before the null is ever reached, which matters: if you had only guarded against null you would still crash. `TryParse` handles null, empty and nonsense in a single check.'
    },
    {
      id: 'fundamentals:debugging#i3',
      type: 'coding', level: 3, difficulty: 'Medium',
      prompt: 'Add checkpoints to locate a bug.\n\nThe method below should return the count of positive numbers in `{ 3, -1, 7, -4, 2 }`, which is 3. It returns the wrong answer.\n\nFind the bug and fix it, then print the correct count.\n\nPrint exactly:\n\n```\nPositive: 3\n```',
      starterCode: `int[] numbers = { 3, -1, 7, -4, 2 };

Console.WriteLine($"Positive: {CountPositive(numbers)}");

static int CountPositive(int[] values)
{
    int count = 0;

    foreach (int v in values)
    {
        if (v > 0)
        {
            count = 1;
        }
    }

    return count;
}`,
      expectedConcepts: ['accumulator'],
      checks: [
        { kind: 'regex', value: 'count\\+\\+|count\\s*\\+=\\s*1', message: 'Increments rather than assigning' },
        { kind: 'notContains', value: 'count = 1', message: 'No longer assigns 1' }
      ],
      run: { expectedOutput: 'Positive: 3' },
      hints: [
        'Trace the value of `count` after each iteration. What does it hold?',
        '`count = 1` sets it to 1 every time rather than adding to it.',
        'The fix is `count++`.'
      ],
      solution: `int[] numbers = { 3, -1, 7, -4, 2 };

Console.WriteLine($"Positive: {CountPositive(numbers)}");

static int CountPositive(int[] values)
{
    int count = 0;

    foreach (int v in values)
    {
        if (v > 0)
        {
            count++;
        }
    }

    return count;
}`,
      explanation: 'A one-character bug producing a plausible-looking answer of 1 - which is exactly the kind that survives a casual glance. Tracing the accumulator through each iteration finds it in seconds.'
    },
    {
      id: 'fundamentals:debugging#d1',
      type: 'debug', level: 3, difficulty: 'Medium',
      prompt: 'Diagnose this NullReferenceException and prevent it properly.',
      brokenCode: `string?[] names = { "Barani", null, "Sam" };

foreach (string? name in names)
{
    Console.WriteLine(name.ToUpper());
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`ToUpper` is called on a value that may be null',
            '`string?[]` is not a valid type',
            '`foreach` cannot iterate a nullable array',
            '`ToUpper` does not exist on string'
          ],
          answer: 0,
          label: 'Identified the null dereference'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What is the name of the operator that returns null instead of throwing when the target is null?',
          accept: ['null-conditional', '?.', 'null conditional'],
          acceptContains: ['?.'],
          label: 'Named the operator'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `BARANI`, `(none)` and `SAM` on separate lines.',
          starterCode: `string?[] names = { "Barani", null, "Sam" };

foreach (string? name in names)
{
    Console.WriteLine(name.ToUpper());
}`,
          checks: [
            { kind: 'regex', value: '\\?\\.|!= null|is null|IsNullOrEmpty', message: 'Guards against null' }
          ],
          run: { expectedOutput: 'BARANI\n(none)\nSAM' },
          label: 'Guarded the null'
        }
      ],
      hints: [],
      solution: `string?[] names = { "Barani", null, "Sam" };

foreach (string? name in names)
{
    Console.WriteLine(name?.ToUpper() ?? "(none)");
}`,
      explanation: '`?.` stops and yields null rather than throwing; `??` then supplies the fallback. Two operators replacing a four-line null check. Enabling nullable reference types means the compiler warns you about this before it ever runs.'
    },
    {
      id: 'fundamentals:debugging#d2',
      type: 'debug', level: 3, difficulty: 'Hard',
      prompt: 'This looks correct but silently produces the wrong result. Find the logic bug.',
      brokenCode: `int[] values = { 5, 3, 8, 1 };
int smallest = 0;

foreach (int v in values)
{
    if (v < smallest)
    {
        smallest = v;
    }
}

Console.WriteLine($"Smallest: {smallest}");`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'What is wrong?',
          options: [
            '`smallest` starts at 0, which is smaller than every value in the array',
            'The comparison should be `>`',
            '`foreach` cannot be used to find a minimum',
            'The array needs to be sorted first'
          ],
          answer: 0,
          label: 'Identified the bad initial value'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What does the program print as written?',
          accept: ['0', 'smallest: 0'],
          acceptContains: ['0'],
          label: 'Predicted the wrong output'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix it so the program prints `Smallest: 1`, and make sure it would still work if every value were negative.',
          starterCode: `int[] values = { 5, 3, 8, 1 };
int smallest = 0;

foreach (int v in values)
{
    if (v < smallest)
    {
        smallest = v;
    }
}

Console.WriteLine($"Smallest: {smallest}");`,
          checks: [
            { kind: 'regex', value: 'values\\[0\\]|int\\.MaxValue', message: 'Seeds from the data or from MaxValue' },
            { kind: 'notContains', value: 'smallest = 0;', message: 'No longer starts at zero' }
          ],
          run: { expectedOutput: 'Smallest: 1' },
          label: 'Fixed the seed value'
        }
      ],
      hints: [],
      solution: `int[] values = { 5, 3, 8, 1 };
int smallest = values[0];

foreach (int v in values)
{
    if (v < smallest)
    {
        smallest = v;
    }
}

Console.WriteLine($"Smallest: {smallest}");`,
      explanation: 'Seeding an accumulator with 0 is one of the most common logic bugs there is - it happens to work when all the data is positive, which is exactly why it survives testing and fails in production. Seed from the first element (or `int.MaxValue`) instead.'
    },
    {
      id: 'fundamentals:debugging#a1',
      type: 'coding', level: 4, difficulty: 'Medium',
      prompt: 'Realistic situation: make a fragile data-processing routine robust.\n\nGiven the rows `{ "10,alice", "bad-row", "20,bob", "", "abc,carol", "30,dave" }`, each valid row is `amount,name`. Parse them, skip anything invalid, and report the total, the count processed and the count skipped.\n\nPrint exactly:\n\n```\nProcessed: 3\nSkipped: 3\nTotal: 60\n```',
      starterCode: `string[] rows = { "10,alice", "bad-row", "20,bob", "", "abc,carol", "30,dave" };

`,
      expectedConcepts: ['TryParse', 'guard'],
      checks: [
        { kind: 'regex', value: 'TryParse', message: 'Parses safely' },
        { kind: 'regex', value: 'Split', message: 'Splits each row' },
        { kind: 'regex', value: 'Length\\s*[<!=]|IsNullOrWhiteSpace', message: 'Guards against malformed rows' },
        { kind: 'notContains', value: 'catch', message: 'Uses guards rather than exceptions' }
      ],
      run: { expectedOutput: 'Processed: 3\nSkipped: 3\nTotal: 60' },
      hints: [
        'Guard in order: blank row, wrong number of fields, unparseable amount.',
        '`row.Split(\',\')` gives you the parts - check `parts.Length == 2` before touching `parts[1]`.',
        'Use `continue` for each rejection so the happy path stays flat.'
      ],
      solution: `string[] rows = { "10,alice", "bad-row", "20,bob", "", "abc,carol", "30,dave" };

int processed = 0;
int skipped = 0;
int total = 0;

foreach (string row in rows)
{
    if (string.IsNullOrWhiteSpace(row)) { skipped++; continue; }

    string[] parts = row.Split(',');
    if (parts.Length != 2) { skipped++; continue; }

    if (!int.TryParse(parts[0], out int amount)) { skipped++; continue; }

    processed++;
    total += amount;
}

Console.WriteLine($"Processed: {processed}");
Console.WriteLine($"Skipped: {skipped}");
Console.WriteLine($"Total: {total}");`,
      explanation: 'Three guards in order, each making the next line safe. The `parts.Length != 2` check is the one people forget, and it is the one that prevents an `IndexOutOfRangeException` on `parts[1]`. This is what production import code actually looks like.'
    },
    {
      id: 'fundamentals:debugging#c1',
      type: 'debug', level: 5, difficulty: 'Hard',
      title: 'Four bugs, no hints',
      prompt: 'No hints. This method should return the average of the positive numbers in an array, to two decimal places, and return 0 when there are none.\n\nIt contains **four** distinct bugs. Find them all and fix them.\n\nFor `{ 4, -2, 9, -7, 5 }` it should print `Average: 6.00`. For an empty array it should print `Average: 0.00`.',
      brokenCode: `int[] numbers = { 4, -2, 9, -7, 5 };

Console.WriteLine($"Average: {AverageOfPositive(numbers):F2}");

static double AverageOfPositive(int[] values)
{
    int total = 0;
    int count = 0;

    for (int i = 1; i <= values.Length; i++)
    {
        if (values[i] > 0)
        {
            total = values[i];
            count = 1;
        }
    }

    return total / count;
}`,
      steps: [
        {
          id: 'what', type: 'mcq',
          question: 'Which of these is NOT one of the four bugs?',
          options: [
            'The loop starts at 1 instead of 0',
            'The loop condition uses <= instead of <',
            'The array should be a List',
            'Integer division is used for the average'
          ],
          answer: 2,
          label: 'Distinguished real bugs from noise'
        },
        {
          id: 'why', type: 'predict-output',
          question: 'What happens when the array contains no positive numbers?',
          accept: ['divide by zero', 'dividebyzeroexception', 'division by zero'],
          acceptContains: ['zero'],
          label: 'Spotted the divide-by-zero'
        },
        {
          id: 'fix', type: 'coding',
          question: 'Fix all four bugs. It should print `Average: 6.00`.',
          starterCode: `int[] numbers = { 4, -2, 9, -7, 5 };

Console.WriteLine($"Average: {AverageOfPositive(numbers):F2}");

static double AverageOfPositive(int[] values)
{
    int total = 0;
    int count = 0;

    for (int i = 1; i <= values.Length; i++)
    {
        if (values[i] > 0)
        {
            total = values[i];
            count = 1;
        }
    }

    return total / count;
}`,
          checks: [
            { kind: 'regex', value: 'i\\s*=\\s*0|foreach', message: 'Starts at the first element' },
            { kind: 'regex', value: 'i\\s*<\\s*values\\.Length|foreach', message: 'Stops at the last valid index' },
            { kind: 'regex', value: '\\+=', message: 'Accumulates rather than assigning' },
            { kind: 'regex', value: 'count\\s*==\\s*0|count\\s*<\\s*1|count\\s*>\\s*0', message: 'Guards against dividing by zero' },
            { kind: 'regex', value: '\\(double\\)|1\\.0', message: 'Avoids integer division' }
          ],
          run: { expectedOutput: 'Average: 6.00' },
          label: 'Fixed all four'
        }
      ],
      hints: [],
      solution: `int[] numbers = { 4, -2, 9, -7, 5 };

Console.WriteLine($"Average: {AverageOfPositive(numbers):F2}");

static double AverageOfPositive(int[] values)
{
    int total = 0;
    int count = 0;

    foreach (int v in values)
    {
        if (v > 0)
        {
            total += v;
            count++;
        }
    }

    if (count == 0) return 0;

    return (double)total / count;
}`,
      explanation: 'The four bugs: (1) the loop skipped index 0, (2) `<=` ran past the end, (3) `=` instead of `+=` meant nothing accumulated, and (4) integer division would have truncated the result - plus the divide-by-zero on an empty result. Switching to `foreach` fixes the first two at a stroke, which is a good illustration of why choosing the simpler construct prevents whole classes of bug.'
    }
  ],
  knowledgeChecks: [
    {
      id: 'fundamentals:debugging#q1', type: 'mcq',
      prompt: 'What does `NullReferenceException` tell you?',
      options: [
        'A variable was assigned the wrong type',
        'Something was null when a member was accessed on it',
        'An array index was out of range',
        'A method returned null'
      ],
      answer: 1,
      explanation: 'It means a member was accessed on a null reference. The trace tells you the line; you then work out which thing on that line was null and why.'
    },
    {
      id: 'fundamentals:debugging#q2', type: 'explain',
      prompt: 'Describe, in order, the steps you would take on being handed a bug report you cannot immediately explain.',
      expectedConcepts: ['reproduce', 'hypothes|theory|guess', 'one|single|narrow|isolate', 'verif|confirm|retest'],
      minLength: 130,
      explanation: 'Reproduce it reliably first - otherwise you cannot know when it is fixed. Read the error properly. Form one hypothesis, test that hypothesis alone, and narrow the range between "value is still correct" and "value is now wrong". Fix the cause rather than the symptom, then re-run the original reproduction to verify.'
    },
    {
      id: 'fundamentals:debugging#q3', type: 'predict-output',
      prompt: 'Which exception does this throw?',
      code: `var d = new Dictionary<string, int>();
Console.WriteLine(d["missing"]);`,
      accept: ['keynotfoundexception', 'keynotfound'],
      acceptContains: ['keynotfound'],
      explanation: 'The dictionary indexer throws `KeyNotFoundException` for a key that is not present. `TryGetValue` avoids it.'
    },
    {
      id: 'fundamentals:debugging#q4', type: 'mcq',
      prompt: 'What is a conditional breakpoint most useful for?',
      options: [
        'Making the program run faster',
        'Pausing only when a specific condition is true, e.g. a particular record id',
        'Skipping over methods you do not care about',
        'Catching compile errors'
      ],
      answer: 1,
      explanation: 'Rather than stepping through 400 iterations to reach the bad record, you break directly on `id == 8823`.'
    },
    {
      id: 'fundamentals:debugging#q5', type: 'explain',
      prompt: 'Why is changing several things at once and re-running a poor debugging strategy?',
      expectedConcepts: ['which|know|cause|why', 'new bug|introduce|break'],
      minLength: 70,
      explanation: 'If it starts working you do not know which change fixed it, so you have learned nothing and may have left two of the three changes in as new bugs. One change, one test, one conclusion.'
    }
  ],
  commonMistakes: [
    { mistake: 'Changing code at random until it works', why: 'It occasionally works, and feels like progress.', fix: 'One hypothesis, one change, one test. If it works, you know why.' },
    { mistake: 'Not reading the error message', why: 'Errors look intimidating and long.', fix: 'The message usually says exactly what is wrong. Read the first line and the top stack frame carefully.' },
    { mistake: 'Fixing the symptom instead of the cause', why: 'Adding a null check makes the crash stop.', fix: 'Ask why it was null. A guard in the wrong place hides the real bug until it surfaces somewhere worse.' },
    { mistake: 'Fixing compiler errors from the bottom of the list', why: 'The last one looks simplest.', fix: 'Fix the first and rebuild - the rest are often cascading consequences.' },
    { mistake: 'Not reproducing the bug before fixing it', why: 'The report seems clear enough.', fix: 'Without a reliable reproduction you cannot know whether your fix worked or the problem simply moved.' },
    { mistake: 'Seeding a minimum with 0 or a maximum with 0', why: 'Zero feels like a neutral starting point.', fix: 'Seed from the first element. Zero is only neutral if all your data happens to be on one side of it.' }
  ],
  realWorld: [
    'Reading a production stack trace from Application Insights is exactly this skill, applied to code you did not write.',
    'The seven common exceptions in this lesson account for the large majority of unhandled exceptions in .NET applications.',
    'Conditional breakpoints are how you debug a problem that only occurs for one customer out of fifty thousand.',
    'Being able to reproduce a bug reliably is often most of the work; the fix is frequently one line.'
  ],
  resources: [
    { label: 'Practise deliberately', note: 'Take working code, introduce a bug on purpose, and find it using only the debugger. It builds the instinct far faster than waiting for real bugs.' }
  ]
}


]);
