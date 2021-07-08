import { SnippetString, ViewColumn } from 'vscode';
import { CompactCluster, CompactCursor } from '../utilities/compact';
import { Executor, TestCase, TestGroup } from '../utilities/framework';
import { range } from '../utilities/other';

/**
 * In this prelude that is shared across multiple test cases in this module, a Typescript document 
 * is opened and pairs are inserted in way that simulates a typical usage scenario.
 *
 * The Typescript document is opened in view column 1, and will have the following state when this
 * function is done:
 *
 * ```
 * function () {
 *     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
 * }                                                   ^(cursor position)
 * ```
 * 
 * with pairs: 
 * 
 *     { line: 1, sides: [15, 16, 23, 30, 32, 46, 52, 54, 56, 58, 60, 61] }
 * 
 * and one cursor:
 * 
 *     [1, 52]
 *
 * The Typescript text document that is opened will have an effective value of `leaper.detectedPairs`
 * of:
 *     
 *     [ "()", "[]", "{}", "<>", "``", "''", "\"\"" ]
 */
async function sharedPrelude(executor: Executor): Promise<void> {
    await executor.openFile('./workspace-0/text.ts', { viewColumn: ViewColumn.One });
    await executor.editText([
        {
            kind: 'insert',
            at:   [0, 0],
            text: 'function () {\n    ; // Log object to console.\n}'
        }
    ]);
    await executor.setCursors([ [1, 4] ]);
    await executor.typeText('console.log({  ');
    await executor.moveCursors('left');
    await executor.typeText('obj: {  ');
    await executor.moveCursors('left');
    await executor.typeText('arr: [  ');
    await executor.moveCursors('left');
    await executor.typeText('{  ');
    await executor.moveCursors('left');
    await executor.typeText('prop: someFn(1, 20');
    await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 46, 52, 54, 56, 58, 60, 61] } ]); 
    await executor.assertCursors([ [1, 52] ]);
};

// ----------------------------------------------------------------------------------
// THE TEST CASES BELOW TEST INVALIDATION DUE TO CURSOR MOVING OUT.

const RIGHTWARDS_EXIT_OF_CURSOR_INCREMENTAL_TEST_CASE = new TestCase({
    name: 'Rightwards Exit of Cursor (Incremental)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Move out of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                    ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 54, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 53] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                     ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 54, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 54] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                      ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 55] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                       ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 56] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                        ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 57] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                         ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 58] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                          ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 60, 61] } ]);
        await executor.assertCursors([ [1, 59] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                           ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 60, 61] } ]);
        await executor.assertCursors([ [1, 60] ]);
        
        // Move out of the nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                            ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ { line: 1, sides: [15, 61] } ]);
        await executor.assertCursors([ [1, 61] ]);

        // Move out of the last pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                             ^(cursor position)
        // ```
        await executor.moveCursors('right');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 62] ]);
    }
});
    
const RIGHTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_CLICKING_OUT_TEST_CASE = new TestCase({
    name: 'Rightwards Exit of Cursor (in One Go by Clicking Out)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                             ^(cursor position)
        // ```
        await executor.setCursors([ [1, 62] ]);
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 62] ]);
    }
});

const RIGHTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_PRESSING_END_KEY_TEST_CASE = new TestCase({
    name: 'Rightwards Exit of Cursor (in One Go by Pressing `End` Key)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                                                        ^(cursor position)
        // ```
        await executor.moveCursors('end');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 89] ]);
    }
});

const LEFTWARDS_EXIT_OF_CURSOR_INCREMENTAL_TEST_CASE = new TestCase({
    name: 'Leftwards Exit of Cursor (Incremental)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Move to the boundary of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                              ^(cursor position)
        // ```
        await executor.moveCursors('left', { repetitions: 5 });
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 46, 52, 54, 56, 58, 60, 61] } ]); 
        await executor.assertCursors([ [1, 47] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                             ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 54, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 46] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                ^(cursor position)
        // ```
        await executor.moveCursors('left', { repetitions: 13 });
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 54, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 33] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                               ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 32] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                              ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 56, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 31] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                             ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 30] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                       ^(cursor position)
        // ```
        await executor.moveCursors('left', { repetitions: 6 });
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 58, 60, 61] } ]);
        await executor.assertCursors([ [1, 24] ]);
            
        // Move out of the nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                      ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 60, 61] } ]);
        await executor.assertCursors([ [1, 23] ]);

        // Move to the boundary of the next nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                ^(cursor position)
        // ```
        await executor.moveCursors('left', { repetitions: 6 });
        await executor.assertPairs([ { line: 1, sides: [15, 16, 60, 61] } ]);
        await executor.assertCursors([ [1, 17] ]);

        // Move out of the nearest pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }               ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ { line: 1, sides: [15, 61] } ]);
        await executor.assertCursors([ [1, 16] ]);

        // Move out of the last pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }              ^(cursor position)
        // ```
        await executor.moveCursors('left');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 15] ]);
    }
});

const LEFTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_CLICKING_OUT_TEST_CASE = new TestCase({
    name: 'Leftwards Exit of Cursor (in One Go by Clicking Out)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }              ^(cursor position)
        // ```
        await executor.setCursors([ [1, 15] ]);
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 15] ]);
    }
});

const LEFTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_PRESSING_HOME_KEY_TEST_CASE = new TestCase({
    name: 'Leftwards Exit of Cursor (in One Go by Pressing `Home` Key)',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }   ^(cursor position)
        // ```
        await executor.moveCursors('home');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 4] ]);
    }
});

const UPWARDS_EXIT_OF_CURSOR_TEST_CASE = new TestCase({
    name: 'Upwards Exit of Cursor',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```          
        // function () {
        //              ^(cursor position)
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }
        // ```
        await executor.moveCursors('up');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [0, 13] ]);
    }
});

const DOWNWARDS_EXIT_OF_CURSOR_TEST_CASE = new TestCase({
    name: 'Downwards Exit of Cursor',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Document state after:
        // 
        // ```          
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }
        //  ^(cursor position)
        // ```
        await executor.moveCursors('down');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [2, 1] ]);
    }
});

// ----------------------------------------------------------------------------------
// THE TEST CASES BELOW TEST INVALIDATION DUE TO EITHER SIDE OF PAIRS BEING DELETED.

const DELETION_OF_OPENING_SIDE_TEST_CASE = new TestCase({
    name: 'Deletion of Opening Side',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Move to the opening side of the first pair and then backspace it.
        //
        // Document state after: 
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn1, 20) } ] } }); // Log object to console.
        // }                                             ^(cursor position)
        // ```
        await executor.moveCursors('left', { repetitions: 5 });
        await executor.backspace();
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 53, 55, 57, 59, 60] } ]);
        await executor.assertCursors([ [1, 46] ]);

        // Overwrite text including the third and fourth of the remaining pairs.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: cheesecake{ prop: someFn1, 20) } ] } }); // Log object to console.
        // }                                              ^(cursor position)
        // ```
        await executor.editText([
            { kind: 'replace', range: { start: [1, 23], end: [1, 32] }, with: 'cheesecake' }
        ]);
        await executor.assertPairs([ { line: 1, sides: [15, 16, 33, 54, 60, 61] } ]);
        await executor.assertCursors([ [1, 47] ]);

        // Overwrite some text including the first of the remaining pairs. 
        //
        // Document state after:
        //
        // ```
        // function () {
        //     { obj: cheesecake{ prop: someFn1, 20) } ] } }); // Log object to console.
        // }                                  ^(cursor position)
        // ```
        await executor.editText([ { kind: 'delete', range: { start: [1, 4], end: [1, 16] } } ]);
        await executor.assertPairs([ { line: 1, sides: [4, 21, 42, 48] } ]);
        await executor.assertCursors([ [1, 35] ]);

        // Backspace until the second of the remaining pairs is deleted.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     { obj: cheesecake1, 20) } ] } }); // Log object to console.
        // }                    ^(cursor position)
        // ```
        await executor.backspace({ repetitions: 14 });
        await executor.assertPairs([ { line: 1, sides: [4, 34] } ]);
        await executor.assertCursors([ [1, 21] ]);

        // Overwrite first pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     rabbit obj: cheesecake1, 20) } ] } }); // Log object to console.
        // }                         ^(cursor position)
        // ```
        await executor.editText([
            { kind: 'replace', range: { start: [1, 4], end: [1, 5] }, with: 'rabbit' }
        ]);
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 26] ]);
    }
});

const DELETION_OF_CLOSING_SIDE_TEST_CASE = new TestCase({
    name: 'Deletion of Closing Side',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Delete right the closing character of the first pair. 
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20 } ] } }); // Log object to console.
        // }                                                   ^(cursor position)
        // ```
        await executor.deleteRight();
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 53, 55, 57, 59, 60] } ]);
        await executor.assertCursors([ [1, 52] ]);

        // Overwrite text including the third and fourth of the remaining pairs.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20 } cheesecake}); // Log object to console.
        // }                                                   ^(cursor position)
        // ```
        await executor.editText([
            { kind: 'replace', range: { start: [1, 55], end: [1, 59] }, with: 'cheesecake' }
        ]);
        await executor.assertPairs([ { line: 1, sides: [15, 16, 32, 53, 65, 66] } ]);
        await executor.assertCursors([ [1, 52] ]);

        // Overwrite some text including the first of the remaining pairs.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20 } cheesecake}
        // }                                                   ^(cursor position)
        // ```
        await executor.editText([ { kind: 'delete', range: { start: [1, 66], end: [1, 94] } } ]);
        await executor.assertPairs([ { line: 1, sides: [16, 32, 53, 65] } ]);
        await executor.assertCursors([ [1, 52] ]);
        
        // Delete right until the second of the remaining pairs is deleted.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20 cheesecake}
        // }                                                   ^(cursor position)
        // ```
        await executor.deleteRight({ repetitions: 2 });
        await executor.assertPairs([ { line: 1, sides: [16, 63] } ]);
        await executor.assertCursors([ [1, 52] ]);
        
        // Overwrite text including the final pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //    console.log({rabbit
        // }              ^(cursor position)
        // ```
        await executor.editText([
            { kind: 'replace', range: { start: [1, 17], end: [1, 64] }, with: 'rabbit' }
        ]);
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [1, 23] ]);
    }
});

// ----------------------------------------------------------------------------------
// THE TEST CASES BELOW TEST INVALIDATION DUE TO SIDES OF PAIRS ENDING UP ON DIFFERENT LINES.

const MULTI_LINE_TEXT_INSERTED_BETWEEN_PAIRS_TEST_CASE = new TestCase({
    name: 'Multi-line Text Inserted Between Pairs',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Indent the text after the first pair.
        //
        // Document state after:
        //
        // ```
        // function () {
        //    console.log(
        //        { obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                          ^(cursor position)
        // ```
        await executor.editText([{ kind: 'insert', at: [1, 16], text: '\n        ' }]);
        await executor.assertPairs([ { line: 2, sides: [8, 15, 22, 24, 38, 44, 46, 48, 50, 52] } ]);
        await executor.assertCursors([ [2, 44] ]);

        // Replace the text between the second and third remaining pairs with multiline text.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log(
        //         { obj: { 
        //             Mary
        //             had
        //             a
        //             little
        //             lamb [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                      ^(cursor position)
        // ```
        await executor.editText([
            {
                kind:  'replace',
                range: { start: [2, 17], end: [2, 21] }, 
                with:  '\n'
                    + '            Mary\n'
                    + '            had\n'
                    + '            a\n'
                    + '            little\n'
                    + '            lamb'
            }
        ]);
        await executor.assertPairs([ { line: 7, sides: [17, 19, 33, 39, 41, 43] } ]);
        await executor.assertCursors([ [7, 39] ]);

        // Type in a newline at the cursor position.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log(
        //         { obj: { 
        //             Mary
        //             had
        //             a
        //             little
        //             lamb [ { prop: someFn(1, 20
        //                 ) } ] } }); // Log object to console.
        // }                ^(cursor position)
        // ```
        //
        // (Note that auto-indentation of Typescript applies).
        await executor.typeText('\n');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [8, 16] ]);
    }
});

const MULTI_LINE_SNIPPET_INSERTED_BETWEEN_PAIRS_TEST_CASE = new TestCase({
    name: 'Multi-line Snippet Inserted Between Pairs',
    prelude: sharedPrelude,
    task: async (executor) => {

        // Delete the `20` from the second argument of `someFn`.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, ) } ] } }); // Log object to console.
        // }                                                 ^(cursor position)
        // ```
        await executor.backspace({ repetitions: 2 });
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 46, 50, 52, 54, 56, 58, 59] } ]);
        await executor.assertCursors([ [1, 50] ]);

        // Type in an array of numbers.
        //
        // Document state after:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3]) } ] } }); // Log object to console.
        // }                                                             ^(cursor position)
        // ```
        await executor.typeText('[-1, -2, -3]');
        await executor.assertPairs([ { line: 1, sides: [15, 16, 23, 30, 32, 46, 62, 64, 66, 68, 70, 71] } ]);
        await executor.assertCursors([ [1, 62] ]);

        // Insert a multi-line snippet.
        // 
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3].reduce((acc, curr) => {
        //                                                                        |--^(cursor selection)  
        //     }, init)) } ] } }); // Log object to console.
        // }                                                            
        // ```
        await executor.insertSnippet(
            new SnippetString(
                 '.reduce((${1:acc}, ${2:curr}) => {\n'
               + '    $3\n'
               + '}, ${4:init})$0'
            ) 
        );
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ { anchor: [1, 71], active: [1, 74] } ]);

        // Make sure that the snippet still works by jumping to the second tabstop.
        // 
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3].reduce((acc, curr) => {
        //                                                                             |---^(cursor selection)
        //     }, init)) } ] } }); // Log object to console.
        // }                                                            
        // ```
        await executor.jumpToTabstop('next');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ { anchor: [1, 76], active: [1, 80] } ]);

        // Make sure that the snippet still works by jumping to the third tabstop.
        // 
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3].reduce((acc, curr) => {
        //                                                                              
        //         ^(cursor position)
        //     }, init)) } ] } }); // Log object to console.
        // }                                                            
        // ```
        await executor.jumpToTabstop('next');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [2, 8] ]);

        // Make sure that the snippet still works by jumping to the fourth tabstop.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3].reduce((acc, curr) => {
        //         
        //     }, init)) } ] } }); // Log object to console.
        // }      |---^(cursor selection)
        // ```
        await executor.jumpToTabstop('next');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ { anchor: [3, 7], active: [3, 11] } ]);

        // Make sure that the snippet still works by jumping to the final tabstop.
        //
        // Document state after:
        // 
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, [-1, -2, -3].reduce((acc, curr) => {
        //         
        //     }, init)) } ] } }); // Log object to console.
        // }           ^(cursor position)
        // ```
        await executor.jumpToTabstop('next');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [3, 12] ]);
    }
});

/**
 * Test whether pair invalidation works for an out-of-focus text editor.
 * 
 * We will perform tests similar to what we have done so far but for an out-of-focus text editor. 
 * But since changes occurring in out-of-focus text editors are quite rare, this test case will not 
 * be as comprehensive as the ones we have done so far for in-focus text editors.
 */
const INVALIDATION_IN_OUT_OF_FOCUS_TEXT_EDITOR_TEST_CASE = new TestCase({
    name: 'Invalidation in Out-of-Focus Text Editor',
    prelude: async (executor) => {
        await sharedPrelude(executor);

        // Open another text editor in view column 2. 
        // 
        // During the tests, we will be switching focus to this text editor in order to defocus the 
        // text editor in view column 1. Then we will make changes (through the API) to the text 
        // editor in view column 1 and check that its pairs are appropriately invalidated.
        await executor.openFile('./workspace-3/text.md', { viewColumn: ViewColumn.Two });
    },
    task: async (executor) => {

        /**
         * Reset the text editor in view column 1, then switch focus to view column 2.
         * 
         * This function effectively reruns the prelude.
         */
        async function reset(executor: Executor): Promise<void> {
            await executor.focusEditorGroup('first');
            await executor.deleteAll();
            await sharedPrelude(executor);
            await executor.focusEditorGroup('second');
        }

        // Test setting cursor out rightwards.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                            ^(cursor position)
        // ```
        await reset(executor);
        await executor.setCursors([ [1, 61] ], { viewColumn: ViewColumn.One });
        await executor.assertPairs([ { line: 1, sides: [15, 61] } ], { viewColumn: ViewColumn.One });
        await executor.assertCursors([ [1, 61] ],                    { viewColumn: ViewColumn.One });

        // Test setting cursor out leftwards.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }           |-----^(cursor selection)
        // ```
        await reset(executor);
        await executor.setCursors(
            [ { anchor: [1, 12], active: [1, 18] } ], 
            { viewColumn: ViewColumn.One }
        );
        await executor.assertPairs([ 'None' ], { viewColumn: ViewColumn.One });
        await executor.assertCursors(
            [ { anchor: [1, 12], active: [1, 18] } ],
            { viewColumn: ViewColumn.One }
        );

        // Test setting cursor out upwards.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```       ⌄(cursor position)
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }
        // ```
        await reset(executor);
        await executor.setCursors([ [0, 10] ], { viewColumn: ViewColumn.One });
        await executor.assertPairs([ 'None' ],    { viewColumn: ViewColumn.One });
        await executor.assertCursors([ [0, 10] ], { viewColumn: ViewColumn.One });

        // Test setting cursor out downwards.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```       
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(1, 20) } ] } }); // Log object to console.
        // }
        //  ^(cursor position)
        // ```
        await reset(executor);
        await executor.setCursors([ [2, 1] ], { viewColumn: ViewColumn.One });
        await executor.assertPairs([ 'None' ],   { viewColumn: ViewColumn.One });
        await executor.assertCursors([ [2, 1] ], { viewColumn: ViewColumn.One });

        // Test deletion of opening side.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```       
        // function () {
        //     console.log     { obj:  arr: [  prop: someFn(1, 20) } ] } }); // Log object to console.
        // }                                                     ^(cursor position)
        // ```
        await reset(executor);
        await executor.editText(
            [
                { kind: 'delete',  range: { start: [1, 32], end: [1, 33] } },
                { kind: 'delete',  range: { start: [1, 23], end: [1, 24] } },
                { kind: 'replace', range: { start: [1, 15], end: [1, 16] }, with: '     ' },
            ],
            { viewColumn: ViewColumn.One }
        );
        await executor.assertPairs(
            [ { line: 1, sides: [20, 33, 48, 54, 58, 62] } ], 
            { viewColumn: ViewColumn.One }
        );
        await executor.assertCursors([ [1, 54] ], { viewColumn: ViewColumn.One });

        // Test deletion of closing side.
        //
        // Expected state of the text editor in view column 1 as a result:
        //
        // ```       
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn( }  Woah!); // Log object to console.
        // }                                              ^(cursor position)
        // ```
        await reset(executor);
        await executor.editText(
            [
                { kind: 'replace', range: { start: [1, 60], end: [1, 61] }, with: 'Woah!' },
                { kind: 'delete',  range: { start: [1, 56], end: [1, 59] } },
                { kind: 'delete',  range: { start: [1, 47], end: [1, 53] } },
            ],
            { viewColumn: ViewColumn.One }
        );
        await executor.assertPairs(
            [ { line: 1, sides: [15, 32, 48, 56] } ], 
            { viewColumn: ViewColumn.One }
        );
        await executor.assertCursors([ [1, 47] ], { viewColumn: ViewColumn.One });

        // Test that multi-line text insertion between pairs untracks them.
        //
        // Expected state of text editor in view column 1 as a result:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(
        //             1, 
        // (sel. start)^   20,
        //                     300,
        //                         4000,
        //                             50000
        //     ) } ] } }); // Log object to console.
        // }   ^(selection end)
        // ```
        await reset(executor);
        await executor.editText(
            [
                { 
                    kind:  'replace', 
                    range: { start: [1, 47], end: [1, 52] },
                    with:  '\n'
                         + '            1,\n'
                         + '                20,\n'
                         + '                    300,\n'
                         + '                        4000,\n'
                         + '                            50000\n'
                         + '    '
                },
            ],
            { viewColumn: ViewColumn.One }
        );
        await executor.assertPairs([ 'None' ], { viewColumn: ViewColumn.One });
        await executor.assertCursors(
            [ { anchor: [2, 4], active: [7, 4] } ], 
            { viewColumn: ViewColumn.One }
        );

        // Test that multi-line snippet insertion between pairs untracks them.
        // 
        // Expected state of text editor in view column 1 as a result:
        //
        // ```
        // function () {
        //     console.log({ obj: { arr: [ { prop: someFn(
        //         [1, 20, 300, 4000, 50000].reduce((acc, curr) => )
        //     ) } ] } }); // Log object to console.               ^(cursor position)
        // }
        // ```
        await reset(executor);
        await executor.insertSnippet(
            new SnippetString(
                '\n'
              + '    [1, 20, 300, 4000, 50000].reduce((acc, curr) => $1)$0\n'
            ),
            {
                at: { start: [1, 47], end: [1, 52] },
                viewColumn: ViewColumn.One
            }
        );
        await executor.assertPairs([ 'None' ],    { viewColumn: ViewColumn.One });
        await executor.assertCursors([ [2, 56] ], { viewColumn: ViewColumn.One });
    }
});

/**
 * Test whether pairs are invalidated when the effective value of any configuration has changed.
 * 
 * So far, this only tests the `leaper.decorateAll` and `leaper.detectedPairs` configuration.
 */
const INVALIDATION_DUE_TO_CHANGE_IN_EFFECTIVE_CONFIGURATION_VALUE_TEST_CASE = new TestCase({
    name: 'Invalidation Due To Change in Effective Configuration Value',
    prelude: async (executor) => {

        // Open four text editors.
        //
        // The following table shows the relevant configuration values for each text editor:
        // 
        //     View Column                      1            2            3            4           
        //     ------------------------------------------------------------------------------------
        //     Workspace Folder               | 0          | 2          | 3          | 4          |
        //     File                           | text.ts    | text.ts    | text.md    | text.ts    |
        //     ------------------------------------------------------------------------------------
        //     Language                       | Typescript | Typescript | Markdown   | Typescript |
        //     Autoclosing Pairs              | (A1)       | (A1)       | (A2)       | (A1)       |
        //                                    |            |            |            |            |
        //     leaper.decorateAll Value       |            |            |            |            |
        //       - Workspace                  | false      | false      | false      | false      |
        //       - Workspace Folder           | undefined  | undefined  | undefined  | true       |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | undefined  | undefined  |
        //       - Effective                  | false      | false      | false      | true       |
        //                                    |            |            |            |            |
        //     leaper.detectedPairs Value     |            |            |            |            |
        //       - Workspace                  | (P1)       | (P1)       | (P1)       | (P1)       |
        //       - Workspace Folder           | undefined  | [ "()" ]   | []         | undefined  |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | (P2)       | undefined  |
        //       - Effective                  | (P1)       | [ "()" ]   | (P2)       | (P1)       |
        //     ------------------------------------------------------------------------------------
        //     
        //     (A1): [ "()", "[]", "{}", "``", "''", "\"\"" ]
        //     *(A2): [ "()", "[]", "{}", "<>" ]
        //     (P1): [ "()", "[]", "{}", "<>", "``", "''", "\"\"" ]
        //     (P2): [ "{}", "<>" ]
        //
        //     *Note that Markdown has an odd behavior where `<>` pairs within square brackets are 
        //     not consistently autoclosed.
        //
        await executor.openFile('./workspace-0/text.ts');
        await executor.openFile('./workspace-2/text.ts', { viewColumn: ViewColumn.Two });
        await executor.openFile('./workspace-3/text.md', { viewColumn: ViewColumn.Three });
        await executor.openFile('./workspace-4/text.ts', { viewColumn: ViewColumn.Four });
    }, 
    task: async (executor) => {

        /**
         * Prepare a visible text editor.
         * 
         * This function focuses on a visible text editor, deletes all text in it, types new text in, 
         * then checks (for the focused text editor) the pairs that the engine is tracking as well 
         * as the state of the cursors.
         */
        async function prepare(
            executor:        Executor, 
            whichTextEditor: 'first' | 'second' | 'third' | 'fourth',
            newText:         string,
            expectPairs:     CompactCluster[],
            expectCursors:   CompactCursor[]
        ): Promise<void> {
            await executor.focusEditorGroup(whichTextEditor);
            await executor.deleteAll();
            await executor.typeText(newText);
            await executor.assertPairs(expectPairs);
            await executor.assertCursors(expectCursors);
        }

        /**
         * For each text editor, check the pairs that the engine is tracking for that text editor
         * and the state of the cursors in that text editor.
         */
        async function check(
            executor: Executor,
            expect: {
                firstTextEditor:  { pairs: CompactCluster[], cursors: CompactCursor[] }
                secondTextEditor: { pairs: CompactCluster[], cursors: CompactCursor[] }
                thirdTextEditor:  { pairs: CompactCluster[], cursors: CompactCursor[] }
                fourthTextEditor: { pairs: CompactCluster[], cursors: CompactCursor[] }
            }
        ): Promise<void> {
            await executor.assertPairs(expect.firstTextEditor.pairs,      { viewColumn: ViewColumn.One });
            await executor.assertCursors(expect.firstTextEditor.cursors,  { viewColumn: ViewColumn.One });
            await executor.assertPairs(expect.secondTextEditor.pairs,     { viewColumn: ViewColumn.Two });
            await executor.assertCursors(expect.secondTextEditor.cursors, { viewColumn: ViewColumn.Two });
            await executor.assertPairs(expect.thirdTextEditor.pairs,      { viewColumn: ViewColumn.Three });
            await executor.assertCursors(expect.thirdTextEditor.cursors,  { viewColumn: ViewColumn.Three });
            await executor.assertPairs(expect.fourthTextEditor.pairs,     { viewColumn: ViewColumn.Four });
            await executor.assertCursors(expect.fourthTextEditor.cursors, { viewColumn: ViewColumn.Four });
        }

        /**
         * The expected pairs of a text editor that has been prepared.
         */
        const preparedPairs: CompactCluster[] = [ { line: 0, sides: range(0, 20) } ];

        /**
         * The expected cursors of a text editor that has been prepared.
         */
        const preparedCursors: CompactCursor[] = [ [0, 10] ];

        // Prepare-1. Prepare for step 1 by clearing then typing 10 pairs into each text editor.
        //
        // We are careful to only type in pairs that will be autoclosed and detected since the text 
        // editors have different effective `leaper.detectedPairs` values and different pairs that
        // get autoclosed.
        await prepare(executor, 'first',  '[([[[{{({(', preparedPairs, preparedCursors);
        await prepare(executor, 'second', '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'third',  '{<{<<<{{{<', preparedPairs, preparedCursors);
        await prepare(executor, 'fourth', '[[[[[[[[[[', preparedPairs, preparedCursors);

        // 1. Change the root workspace value of `leaper.detectedPairs`.
        //
        // This changes the effective value of `leaper.detectedPairs` for text editors one and four.
        //
        // The relevant configuration values after this step:
        //
        //     View Column                      1            2            3            4           
        //     ------------------------------------------------------------------------------------
        //     Workspace Folder               | 0          | 2          | 3          | 4          |
        //     File                           | text.ts    | text.ts    | text.md    | text.ts    |
        //     ------------------------------------------------------------------------------------
        //     Language                       | Typescript | Typescript | Markdown   | Typescript |
        //     Autoclosing Pairs              | (A1)       | (A1)       | (A2)       | (A1)       |
        //                                    |            |            |            |            |
        //     leaper.decorateAll Value       |            |            |            |            |
        //       - Workspace                  | false      | false      | false      | false      |
        //       - Workspace Folder           | undefined  | undefined  | undefined  | true       |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | undefined  | undefined  |
        //       - Effective                  | false      | false      | false      | true       |
        //                                    |            |            |            |            |
        //     leaper.detectedPairs Value     |            |            |            |            |
        //       - Workspace                  | [ "()" ]   | [ "()" ]   | [ "()" ]   | [ "()" ]   |
        //       - Workspace Folder           | undefined  | [ "()" ]   | []         | undefined  |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | (P2)       | undefined  |
        //       - Effective                  | [ "()" ]   | [ "()" ]   | (P2)       | [ "()" ]   |
        //     ------------------------------------------------------------------------------------
        //     
        //     (A1): [ "()", "[]", "{}", "``", "''", "\"\"" ]
        //     *(A2): [ "()", "[]", "{}", "<>" ]
        //     (P2): [ "{}", "<>" ]
        //
        //     *Note that Markdown has an odd behavior where `<>` pairs within square brackets are 
        //     not consistently autoclosed.
        //
        await executor.setConfiguration({
            partialName: 'detectedPairs',
            value:       [ "()" ]
        });

        // Since text editors one and four have each had an effective configuration value changed, 
        // we expect the pairs we typed into them during the preparation step to be invalidated.
        await check(executor, {
            firstTextEditor:  { pairs: [ 'None' ],    cursors: preparedCursors },
            secondTextEditor: { pairs: preparedPairs, cursors: preparedCursors },
            thirdTextEditor:  { pairs: preparedPairs, cursors: preparedCursors },
            fourthTextEditor: { pairs: [ 'None' ],    cursors: preparedCursors }
        });

        // Prepare-2. Just like for step 1, we do a similar preparation step for step 2.
        await prepare(executor, 'first',  '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'second', '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'third',  '{{{{<{{{{{', preparedPairs, preparedCursors);
        await prepare(executor, 'fourth', '((((((((((', preparedPairs, preparedCursors);

        // 2. Change Workspace Folder 3's Markdown specific `leaper.detectedPairs` value.
        //
        // This changes the effective value of `leaper.detectedPairs` for text editor three.
        //
        // The relevant configuration values after this step:
        //
        //     View Column                      1            2            3            4           
        //     ------------------------------------------------------------------------------------
        //     Workspace Folder               | 0          | 2          | 3          | 4          |
        //     File                           | text.ts    | text.ts    | text.md    | text.ts    |
        //     ------------------------------------------------------------------------------------
        //     Language                       | Typescript | Typescript | Markdown   | Typescript |
        //     Autoclosing Pairs              | (A1)       | (A1)       | (A2)       | (A1)       |
        //                                    |            |            |            |            |
        //     leaper.decorateAll Value       |            |            |            |            |
        //       - Workspace                  | false      | false      | false      | false      |
        //       - Workspace Folder           | undefined  | undefined  | undefined  | true       |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | undefined  | undefined  |
        //       - Effective                  | false      | false      | false      | true       |
        //                                    |            |            |            |            |
        //     leaper.detectedPairs Value     |            |            |            |            |
        //       - Workspace                  | [ "()" ]   | [ "()" ]   | [ "()" ]   | [ "()" ]   |
        //       - Workspace Folder           | undefined  | [ "()" ]   | []         | undefined  |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | [ "<>" ]   | undefined  |
        //       - Effective                  | [ "()" ]   | [ "()" ]   | [ "<>" ]   | [ "()" ]   |
        //     ------------------------------------------------------------------------------------
        //     
        //     (A1): [ "()", "[]", "{}", "``", "''", "\"\"" ]
        //     *(A2): [ "()", "[]", "{}", "<>" ]
        //
        //     *Note that Markdown has an odd behavior where `<>` pairs within square brackets are 
        //     not consistently autoclosed.
        //
        await executor.setConfiguration({
            partialName:           'detectedPairs',
            value:                 [ "<>" ],
            targetLanguage:        'markdown',
            targetWorkspaceFolder: 'workspace-3'
        });

        // Since text editor three has had an effective configuration value changed, we expect the 
        // pairs we typed into it during the preparation step to be invalidated.
        await check(executor, {
            firstTextEditor:  { pairs: preparedPairs, cursors: preparedCursors },
            secondTextEditor: { pairs: preparedPairs, cursors: preparedCursors },
            thirdTextEditor:  { pairs: [ 'None' ],    cursors: preparedCursors },
            fourthTextEditor: { pairs: preparedPairs, cursors: preparedCursors }
        });

        // Prepare-3. Just like for step 1, we do a similar preparation step for step 3.
        await prepare(executor, 'first',  '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'second', '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'third',  '<<<<<<<<<<', preparedPairs, preparedCursors);
        await prepare(executor, 'fourth', '((((((((((', preparedPairs, preparedCursors);

        // 3. Change the root workspace's Typescript specific `leaper.decorateAll` value.
        //
        // This changes the effective value of `leaper.decorateAll` for text editors one and two.
        //
        // The relevant configuration values after this step:
        //
        //     View Column                      1            2            3            4           
        //     ------------------------------------------------------------------------------------
        //     Workspace Folder               | 0          | 2          | 3          | 4          |
        //     File                           | text.ts    | text.ts    | text.md    | text.ts    |
        //     ------------------------------------------------------------------------------------
        //     Language                       | Typescript | Typescript | Markdown   | Typescript |
        //     Autoclosing Pairs              | (A1)       | (A1)       | (A2)       | (A1)       |
        //                                    |            |            |            |            |
        //     leaper.decorateAll Value       |            |            |            |            |
        //       - Workspace                  | false      | false      | false      | false      |
        //       - Workspace Folder           | undefined  | undefined  | undefined  | true       |
        //       - Language Workspace         | true       | true       | undefined  | true       |
        //       - Language Workspace Folder  | undefined  | undefined  | undefined  | undefined  |
        //       - Effective                  | true       | true       | false      | true       |
        //                                    |            |            |            |            |
        //     leaper.detectedPairs Value     |            |            |            |            |
        //       - Workspace                  | [ "()" ]   | [ "()" ]   | [ "()" ]   | [ "()" ]   |
        //       - Workspace Folder           | undefined  | [ "()" ]   | []         | undefined  |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | [ "<>" ]   | undefined  |
        //       - Effective                  | [ "()" ]   | [ "()" ]   | [ "<>" ]   | [ "()" ]   |
        //     ------------------------------------------------------------------------------------
        //     
        //     (A1): [ "()", "[]", "{}", "``", "''", "\"\"" ]
        //     *(A2): [ "()", "[]", "{}", "<>" ]
        //
        //     *Note that Markdown has an odd behavior where `<>` pairs within square brackets are 
        //     not consistently autoclosed.
        //
        await executor.setConfiguration({
            partialName:    'decorateAll',
            value:          true,
            targetLanguage: 'typescript'
        });

        // Since text editors one and two have each had an effective configuration value changed, we 
        // expect the pairs we typed into them during the preparation step to be invalidated.
        await check(executor, {
            firstTextEditor:  { pairs: [ 'None' ],    cursors: preparedCursors },
            secondTextEditor: { pairs: [ 'None' ],    cursors: preparedCursors },
            thirdTextEditor:  { pairs: preparedPairs, cursors: preparedCursors },
            fourthTextEditor: { pairs: preparedPairs, cursors: preparedCursors }
        });

        // Prepare-4. Just like for step 1, we do a similar preparation step for step 4.
        await prepare(executor, 'first',  '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'second', '((((((((((', preparedPairs, preparedCursors);
        await prepare(executor, 'third',  '<<<<<<<<<<', preparedPairs, preparedCursors);
        await prepare(executor, 'fourth', '((((((((((', preparedPairs, preparedCursors);

        // 4. Change Workspace Folder 3's `leaper.decorateAll` value.
        //
        // This changes the effective value of `leaper.decorateAll` for text editor three.
        //
        // The relevant configuration values after this step:
        //
        //     View Column                      1            2            3            4           
        //     ------------------------------------------------------------------------------------
        //     Workspace Folder               | 0          | 2          | 3          | 4          |
        //     File                           | text.ts    | text.ts    | text.md    | text.ts    |
        //     ------------------------------------------------------------------------------------
        //     Language                       | Typescript | Typescript | Markdown   | Typescript |
        //     Autoclosing Pairs              | (A1)       | (A1)       | (A2)       | (A1)       |
        //                                    |            |            |            |            |
        //     leaper.decorateAll Value       |            |            |            |            |
        //       - Workspace                  | false      | false      | false      | false      |
        //       - Workspace Folder           | undefined  | undefined  | true       | true       |
        //       - Language Workspace         | true       | true       | undefined  | true       |
        //       - Language Workspace Folder  | undefined  | undefined  | undefined  | undefined  |
        //       - Effective                  | true       | true       | true       | true       |
        //                                    |            |            |            |            |
        //     leaper.detectedPairs Value     |            |            |            |            |
        //       - Workspace                  | [ "()" ]   | [ "()" ]   | [ "()" ]   | [ "()" ]   |
        //       - Workspace Folder           | undefined  | [ "()" ]   | []         | undefined  |
        //       - Language Workspace         | undefined  | undefined  | undefined  | undefined  |
        //       - Language Workspace Folder  | undefined  | undefined  | [ "<>" ]   | undefined  |
        //       - Effective                  | [ "()" ]   | [ "()" ]   | [ "<>" ]   | [ "()" ]   |
        //     ------------------------------------------------------------------------------------
        //     
        //     (A1): [ "()", "[]", "{}", "``", "''", "\"\"" ]
        //     *(A2): [ "()", "[]", "{}", "<>" ]
        //
        //     *Note that Markdown has an odd behavior where `<>` pairs within square brackets are 
        //     not consistently autoclosed.
        //
        await executor.setConfiguration({
            partialName:           'decorateAll',
            value:                 true,
            targetWorkspaceFolder: 'workspace-3'
        });        

        // Since text editor three has had an effective configuration value changed, we expect the 
        // pairs we typed into it during the preparation step to be invalidated.
        await check(executor, {
            firstTextEditor:  { pairs: preparedPairs, cursors: preparedCursors },
            secondTextEditor: { pairs: preparedPairs, cursors: preparedCursors },
            thirdTextEditor:  { pairs: [ 'None' ],    cursors: preparedCursors },
            fourthTextEditor: { pairs: preparedPairs, cursors: preparedCursors }
        });
    }
});

/**
 * Test that the pairs in a text editor are invalidated once the text editor is closed.
 */
const INVALIDATION_DUE_TO_TEXT_EDITOR_BEING_CLOSED = new TestCase({
    name: 'Invalidation Due to Text Editor Being Closed',
    prelude: async (executor) => {
     
        // Set up view column 1 with a single text editor using the shared prelude.
        await sharedPrelude(executor);

        // Set up view column 2 with two text editors. Some pairs are typed into the one that is on
        // display in view column 2.
        await executor.openFile('./workspace-1/text.txt', { viewColumn: ViewColumn.Two });
        await executor.openFile('./workspace-2/text.ts',  { viewColumn: ViewColumn.Two });
        await executor.typeText('(', { repetitions: 10 });
        await executor.assertPairs([ { line: 0, sides: range(0, 20) }]);
        await executor.assertCursors([ [0, 10] ]);
    },
    task: async (executor) => {

        // 1. Check that pairs are invalidated when a text editor is switched away from*.
        //
        // For this step, we use the second view column. 
        //
        // *vscode considers switching away from a text editor (i.e. `Ctrl` + `Tab`) closing that 
        // text editor.
        await executor.switchToEditorInGroup('prev');
        await executor.switchToEditorInGroup('next');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [0, 10] ]);    // Cursors are preserved when switching away.

        // 2. Check that pairs are invalidated when a text editor is directly closed.
        await executor.focusEditorGroup('first');
        await executor.closeActiveEditor();
        await executor.openFile('./workspace-0/text.ts');
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [0, 0] ]);    // Cursors are not preserved when directly closed.
    }
});

/**
 * Test that the pairs in a text editor are not invalidated when focus is switched away from it.
 */
const NO_INVALIDATION_DUE_TO_FOCUS_SWITCH_TEST_CASE = new TestCase({
    name: 'No Invalidation Due To Focus Switch',
    prelude: sharedPrelude,
    task: async (executor) => {

        /**
         * The pairs that are expected to be in the text editor in view column 1 after it is 
         * initialized with `sharedPrelude`.
         */
        const firstEditorPairs = [ { line: 1, sides: [15, 16, 23, 30, 32, 46, 52, 54, 56, 58, 60, 61] } ];

        /**
         * The expected state of the cursors in the text editor in view column 1 after it is 
         * initialized with `sharedPrelude`.
         */
        const firstEditorCursors: CompactCursor[] = [ [1, 52] ];

        // 1. Open another text editor in view column 2, which takes focus.
        //
        // Check that the pairs in the first text editor have not been invalidated.
        await executor.openFile('./workspace-2/text.ts', { viewColumn: ViewColumn.Two });
        await executor.assertPairs(firstEditorPairs,     { viewColumn: ViewColumn.One });
        await executor.assertCursors(firstEditorCursors, { viewColumn: ViewColumn.One });

        // Might as well check that the newly opened text editor in view column 2 has no pairs being 
        // tracked for it.
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [0, 0] ]);

        // 2. Type some pairs into the text editor in view column 2.
        //
        // Check that pairs are indeed being tracked for the second text editor, while the pairs for
        // the first text editor remain unaffected.
        // 
        // We only type in `()` pairs because the effective value of the `leaper.detectedPairs`
        // configuration for the text editor in view column 2 is `['()']`.
        await executor.typeText('(', { repetitions: 20 });
        const secondEditorPairs: CompactCluster[]  = [ { line: 0, sides: range(0, 40) } ];
        const secondEditorCursors: CompactCursor[] = [ [0, 20] ];
        await executor.assertPairs(firstEditorPairs,     { viewColumn: ViewColumn.One });
        await executor.assertCursors(firstEditorCursors, { viewColumn: ViewColumn.One });
        await executor.assertPairs(secondEditorPairs);
        await executor.assertCursors(secondEditorCursors);

        // 3. Open another text document in view column 3, which takes focus.
        //
        // Check that the pairs in the first two text editors have not been invalidated.
        await executor.openFile('./workspace-3/text.md', { viewColumn: ViewColumn.Three });
        await executor.assertPairs(firstEditorPairs,      { viewColumn: ViewColumn.One });
        await executor.assertCursors(firstEditorCursors,  { viewColumn: ViewColumn.One });
        await executor.assertPairs(secondEditorPairs,     { viewColumn: ViewColumn.Two });
        await executor.assertCursors(secondEditorCursors, { viewColumn: ViewColumn.Two });

        // Might as well check that the newly opened text editor in view column 3 has no pairs being 
        // tracked for it.
        await executor.assertPairs([ 'None' ]);
        await executor.assertCursors([ [0, 0] ]);

        // 4. Switch focus to the text editor in view column 1.
        //
        // Check that the pairs in the first two text editors have not been invalidated and that no 
        // new pairs have been created in the third text editor.
        await executor.focusEditorGroup('first');
        async function stepFourChecks(): Promise<void> {
            await executor.assertPairs(firstEditorPairs,      { viewColumn: ViewColumn.One });
            await executor.assertCursors(firstEditorCursors,  { viewColumn: ViewColumn.One });
            await executor.assertPairs(secondEditorPairs,     { viewColumn: ViewColumn.Two });
            await executor.assertCursors(secondEditorCursors, { viewColumn: ViewColumn.Two });
            await executor.assertPairs([ 'None' ],            { viewColumn: ViewColumn.Three });
            await executor.assertCursors([ [0, 0] ],          { viewColumn: ViewColumn.Three });    
        }
        await stepFourChecks();

        // 5. Switch focus to the text editor in view column 2.
        // 
        // Repeat the checks we did in step 4.
        await executor.focusEditorGroup('second');
        await stepFourChecks();
        
        // 6. Switch focus to view column 4, which will open an empty editor tab group since there
        //    was no existing text editor opened in view column 4.
        //
        // Repeat the checks we did in step 4.
        await executor.focusEditorGroup('fourth');
        await stepFourChecks();

        // 7. Switch focus to the text editor in view column 1.
        //
        // Repeat the checks we did in step 4.
        await executor.focusEditorGroup('first');
        await stepFourChecks();

        // 8. Switch focus to the explorer side bar.
        //
        // Repeat the checks we did in step 4.
        await executor.focusExplorerSideBar();
        await stepFourChecks();

        // 9. Switch focus to the text editor in view column 2.
        //
        // Repeat the checks we did in step 4.
        await executor.focusEditorGroup('second');
        await stepFourChecks();
    }
});

/**
 * A collection of test cases that check that pairs for a single cursor are invalidated due to:
 * 
 *  1. Cursor being moved out of them (also known as 'cursor escape' or 'cursor exit').
 *  2. Multi-line text being inserted between them.
 *  3. Their opening or closing sides being deleted.
 *  4. The text editor being closed.
 * 
 * In addition to the checks above, this test group also checks that pairs are not invalidated when 
 * the text editor that they are in is defocused but not closed.
 */
export const SINGLE_CURSOR_PAIR_INVALIDATION_TEST_GROUP = new TestGroup(
    'Pair Invalidation',
    [
        RIGHTWARDS_EXIT_OF_CURSOR_INCREMENTAL_TEST_CASE,
        RIGHTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_CLICKING_OUT_TEST_CASE,
        RIGHTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_PRESSING_END_KEY_TEST_CASE,
        LEFTWARDS_EXIT_OF_CURSOR_INCREMENTAL_TEST_CASE,
        LEFTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_CLICKING_OUT_TEST_CASE,
        LEFTWARDS_EXIT_OF_CURSOR_IN_ONE_GO_BY_PRESSING_HOME_KEY_TEST_CASE,
        UPWARDS_EXIT_OF_CURSOR_TEST_CASE,
        DOWNWARDS_EXIT_OF_CURSOR_TEST_CASE,
        DELETION_OF_OPENING_SIDE_TEST_CASE,
        DELETION_OF_CLOSING_SIDE_TEST_CASE,
        MULTI_LINE_TEXT_INSERTED_BETWEEN_PAIRS_TEST_CASE,
        MULTI_LINE_SNIPPET_INSERTED_BETWEEN_PAIRS_TEST_CASE,
        INVALIDATION_IN_OUT_OF_FOCUS_TEXT_EDITOR_TEST_CASE,
        INVALIDATION_DUE_TO_CHANGE_IN_EFFECTIVE_CONFIGURATION_VALUE_TEST_CASE,
        INVALIDATION_DUE_TO_TEXT_EDITOR_BEING_CLOSED,
        NO_INVALIDATION_DUE_TO_FOCUS_SWITCH_TEST_CASE
    ]
);
