import { ViewColumn } from 'vscode';
import { Executor, TestCase, TestGroup } from '../../utilities/framework';
import { range } from '../../utilities/other';

/**
 * Tests the effective `detectedPairs` configuration in the active text editor by asserting that:
 * 
 *  - The autoclosing pairs in `should` are detected.
 *  - The autoclosing pairs in` shouldNot` are not detected.
 * 
 * **Please make sure that the pairs provided are actual autoclosing pairs in the language of the
 * active text editor**. For instance, `<>`, even though it is a commonly used pair in languages with
 * generics like Rust or Typescript, is not autoclosed in either language. 
 */
async function testDetectedPairs(
    executor:  Executor,
    should:    ("{}" | "[]" | "()" | "''" | "\"\"" | "``" | "<>")[],
    shouldNot: ("{}" | "[]" | "()" | "''" | "\"\"" | "``" | "<>")[]
): Promise<void> {

    // Move cursor to the end of document.
    await executor.cursorBottom();
    const cursor = executor.getCursors()[0] as [number, number];

    // Perform the checks.
    await check(should,    true);
    await check(shouldNot, false);

    /**
     * Type in the opening side of each pair in `pairs`, let vscode autoclose the pair, then 
     * depending on `expectTrack`:
     *  
     *  - If `true`, will assert that each inserted pair is tracked by the extension.
     *  - If `false`, will assert that each inserted pair is not tracked by the extension. 
     */
    async function check(
        pairs: ("{}" | "[]" | "()" | "''" | "\"\"" | "``" | "<>")[],
        expectTrack: boolean
    ): Promise<void> {
        for (const pair of pairs) {

            // Type in the opening side of the pair, and let vscode autoclose it.
            await executor.typeText({ text: pair[0] });

            // Check that the pair is being tracked (or not tracked, depending on `expect`).
            executor.assertPairs({
                expect: [
                    expectTrack ? { line: cursor[0], sides: [ cursor[1], cursor[1] + 1 ] } : 'None'
                ]
            });
            executor.assertCursors({ expect: [ [cursor[0], cursor[1] + 1] ] });

            // Remove the inserted pair.
            await executor.undo();

            // Check that the inserted pair was removed.
            executor.assertPairs({   expect: [ 'None' ] });
            executor.assertCursors({ expect: [ cursor ] });
        }
    }
}

/**
 * Test whether this extension is correctly reading configuration values.
 * 
 * We use the `leaper.detectedPairs` configuration to perform the tests, by first configuring it to
 * different values at different scopes throughout the test workspace, then checking if this
 * extension is able to correctly behave based on the effective configuration value.
 */
const CAN_READ_VALUES_TEST_CASE = new TestCase({
    name: 'Can Read Values',
    task: async (executor) => {

        // 1. Test whether workspace configuration values can be read.
        // 
        // For this, we use the initial text editor that is provided to each test case.
        //
        // Because we did not specify a language for the provided text editor, it will be Typescript.
        // And because the opened text editor does not belong to any of the workspace folders within 
        // the workspace, it is expected to only inherit up to workspace configuration values.
        // 
        // The testing workspace has `leaper.detectedPairs` configured to: 
        // 
        //     [ "{}", "[]", "()", "''", "\"\"", "``", "<>" ]
        // 
        // while Typescript autocloses the following pairs: 
        //
        //     [ "{}", "[]", "()", "''", "\"\"", "``" ]
        //
        // Therefore we would expect all of the autoclosing pairs of Typescript to be tracked.
        await testDetectedPairs(executor, [ "{}", "[]", "()", "''", "\"\"", "``" ], []);

        // 2a. Test whether language-specific workspace configuration values can be read.
        //
        // For this, we use the Plaintext file within the first workspace folder.
        //
        // The workspace has `leaper.detectedPairs`, scoped to Plaintext, configured to:
        //
        //      []
        //
        // while Plaintext autocloses the following pairs:
        //
        //      [ "{}", "[]", "()" ]
        //
        // Therefore we would expect none of the autoclosing pairs of Plaintext to be tracked.
        await executor.openFile({ rel: './workspace-1/text.txt' });
        await testDetectedPairs(executor, [], [ "{}", "[]", "()" ]);

        // 2b. Repeat the test after moving the opened text editor to another tab.
        //
        // This tests whether we can move the text editor without affecting its loaded configuration 
        // values.
        await executor.moveEditorToRight();
        await testDetectedPairs(executor, [], [ "{}", "[]", "()" ]);

        // 3a. Test whether workspace folder configuration values can be read.
        //
        // For this, we use the Typescript file within the second workspace folder.
        // 
        // The second workspace folder has `leaper.detectedPairs` configured to:
        // 
        //     [ "()" ]
        //
        // while Typescript autocloses the following pairs:
        //
        //     [ "{}", "[]", "()", "''", "\"\"", "``" ]
        // 
        // Therefore we would expect the following autoclosing pairs of Typescript to be tracked:
        //
        //     [ "()" ]
        // 
        // and would expect the following autoclosing pairs of Typescript to not be tracked: 
        //
        //     [ "{}", "[]", "''", "\"\"", "``" ]
        await executor.openFile({ rel: './workspace-2/text.ts' });
        await testDetectedPairs(executor, [ "()" ], [ "{}", "[]", "''", "\"\"", "``" ]);

        // 3b. Repeat the test after moving the active text editor to another tab.
        //
        // This tests whether we can move the text editor without affecting its loaded configuration 
        // values.
        await executor.moveEditorToRight();
        await testDetectedPairs(executor, [ "()" ], [ "{}", "[]", "''", "\"\"", "``" ]);

        // 4a. Test whether language-specific workspace folder configuration values can be read.
        //
        // For this, we use the Markdown file within the third workspace folder.
        //
        // The second workspace folder has `leaper.detectedPairs`, scoped to Markdown, configured to:
        //
        //     [ "{}", "<>" ]
        //
        // while Markdown autocloses the following pairs:
        //
        //     [ "{}", "()", "<>", "[]" ]
        //
        // Therefore we would expect the following autoclosing pairs of Markdown to be tracked:
        //
        //     [ "{}", "<>" ]
        //
        // and would expect the following autoclosing pairs of Markdown to not be tracked:
        //
        //     [ "()", "[]" ]
        await executor.openFile({ rel: './workspace-3/text.md'});
        await testDetectedPairs(executor, [ "{}", "<>" ], [ "()", "[]" ]);

        // 4b. Repeat the test after moving the active text editor to another tab.
        //
        // This tests whether we can move the text editor without affecting its loaded configuration 
        // values.
        await executor.moveEditorToRight();
        await testDetectedPairs(executor, [ "{}", "<>" ], [ "()", "[]" ]);

    }
});

/**
 * Test whether this extension reloads configuration values when a change in them is detected.
 * 
 * Note that we will not be testing whether this extension will automatically reload configuration 
 * values when deprecated configurations are changed, as deprecated configurations are not supposed 
 * to be used going forward.
 */
const RELOAD_ON_CHANGE_TEST_CASE = new TestCase({
    name: 'Reload on Change',
    task: async (executor) => {

        // First open the text files in all three workspace folders. 
        //
        // This results in a total of 4 text editors (including the one provided to this test case)
        // being opened, arranged as so:
        //
        //      Provided Text | Workspace 1 Text | Workspace 2 Text | Workspace 3 Text 
        //
        // # Focus
        // 
        // The text document in the third workspace will be in focus after this step.
        await executor.openFile({ rel: './workspace-1/text.txt', showOptions: { viewColumn: 2 }});
        await executor.openFile({ rel: './workspace-2/text.ts',  showOptions: { viewColumn: 3 }});
        await executor.openFile({ rel: './workspace-3/text.md',  showOptions: { viewColumn: 4 }});

        // 1. Change the workspace configuration value.
        //
        // The testing workspace's `leaper.detectedPairs` configuration is changed:
        //
        //     From: [ "{}", "[]", "()", "<>", "''", "\"\"", "``" ]
        // 
        //     To:   [ "{}" ]
        //
        // # Effect on the Provided Text Document
        // 
        // The provided text document inherits the workspace configuration value since there are no
        // values in more nested scopes that would override the workspace configuration value.
        //  
        // Since the provided text document is Typescript, and Typescript autocloses the following 
        // pairs:
        //
        //     [ "{}", "[]", "()", "''", "\"\"", "``" ]
        // 
        // we would expect the following autoclosing pairs of Typescript to be tracked:
        //
        //     [ "{}" ]
        // 
        // Furthermore, we would expect the following autoclosing pairs of Typescript to not be 
        // tracked: 
        //
        //     [ "{}", "[]", "''", "\"\"", "``" ]
        //
        // # Effect on the Other Text Documents
        //
        // The other text documents have been configured to override the workspace configuration 
        // value, so no change is expected for them.
        //
        // # Focus 
        // 
        // The provided text editor (view column 1) will be in focus after this step.
        await executor.setConfiguration<ReadonlyArray<string>>({
            partialName: 'detectedPairs',
            value:       [ "{}" ],
        });
        await testDetectedPairs(executor, [ "{}", "<>" ], [ "()", "[]" ]);                // Workspace 3 (Markdown).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [ "()" ], [ "{}", "[]", "''", "\"\"", "``" ]);  // Workspace 2 (Typescript).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [], [ "{}", "[]", "()" ]);                      // Workspace 1 (Plaintext).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [ "{}" ], [ "[]", "()", "''", "\"\"", "``" ]);  // Provided (Typescript).

        // 2. Change a language-specific workspace configuration value.
        //
        // The testing workspace's `leaper.detectedPairs` configuration, scoped to Plaintext, is 
        // changed:
        //
        //     From: []
        //     
        //     To:   [ "[]",  "()" ]
        //
        // # Effect on Workspace 1's Text Document
        //
        // Workspace 1's text document inherits the language-specific workspace configuration value
        // from the root workspace.
        //
        // Since Workspace 1's text document is Plaintext, and Plaintext autocloses the following 
        // pairs:
        //
        //     [ "{}", "[]", "()" ]
        // 
        // we would expect the following autoclosing pairs of Plaintext to be tracked:
        //
        //     [ "[]",  "()" ]
        //
        // Furthermore, we would expect the following autoclosing pairs of Plaintext to not be 
        // tracked:
        //
        //     [ "{}" ]
        //
        // # Effect on the Other Text Documents
        //
        // The other text documents are not of Plaintext language and are therefore not affected by
        // this change.
        //
        // # Focus 
        //
        // The text editor of the third workspace (view column 4) will be in focus after this step.
        await executor.setConfiguration<ReadonlyArray<string>>({
            partialName:    'detectedPairs',
            value:          [ "[]", "()" ],
            targetLanguage: 'plaintext',
        });
        await testDetectedPairs(executor, [ "{}" ], [ "[]", "()", "''", "\"\"", "``" ]);  // Provided (Typescript).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "[]", "()" ], [ "{}" ] );                     // Workspace 1 (Plaintext).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "()" ], [ "{}", "[]", "''", "\"\"", "``" ]);  // Workspace 2 (Typescript).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "{}", "<>" ], [ "()", "[]" ]);                // Workspace 3 (Markdown).

        // 3. Change a workspace folder configuration value.
        //
        // Workspace 2's `leaper.detectedPairs` configuration is changed:
        //
        //     From: [ "()" ]
        //
        //     To:   [ "''", "\"\"", "``" ]
        //
        // # Effect on Workspace 2's Text Document
        //
        // Workspace 2's text document is affected by this change as there is no override of the
        // configuration value for Typescript in Workspace 2.
        //
        // Since Workspace 2's text document is Typescript, and Typescript autocloses the following
        // pairs:
        //
        //      [ "{}", "[]", "()", "''", "\"\"", "``" ]
        //
        // we would expect the following autoclosing pairs of Typescript to be tracked:
        //
        //      [ "''", "\"\"", "``" ]
        //
        // Furthermore, we would expect the following autoclosing pairs of Typescript to not be 
        // tracked: 
        //
        //      [ "{}", "[]", "()" ]
        //
        // # Effect on the Other Text Documents
        //
        // The provided text document is not within any of the workspace folders so it is not 
        // affected. 
        //
        // Meanwhile, the text documents in Workspace 1 and Workspace 3 are not affected at all as 
        // this change only applies to Workspace 2.
        //
        // # Focus 
        // 
        // The provided text editor (view column 1) will be in focus after this step.
        await executor.setConfiguration<ReadonlyArray<string>>({
            partialName:           'detectedPairs',
            value:                 [ "''", "\"\"", "``" ],
            targetWorkspaceFolder: 'workspace-2'
        });
        await testDetectedPairs(executor, [ "{}", "<>" ], [ "()", "[]" ]);                // Workspace 3 (Markdown).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [ "''", "\"\"", "``" ], [ "{}", "[]", "()" ]);  // Workspace 2 (Typescript).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [ "[]", "()" ], [ "{}" ] );                     // Workspace 1 (Plaintext).
        await executor.focusLeftEditorGroup();
        await testDetectedPairs(executor, [ "{}" ], [ "[]", "()", "''", "\"\"", "``" ]);  // Provided (Typescript).

        // 4. Change a language-specific workspace folder configuration value.
        //
        // Workspace 3's `leaper.detectedPairs` configuration, scoped to Markdown, is changed:
        //
        //     From: [ "{}", "<>" ]
        //
        //     To:   [ "{}", "()", "<>", "[]" ]
        //
        // # Effect on Workspace 3's Text Document
        // 
        // Workspace 3's text document is affected by this change as it is of Markdown language.
        //
        // Since Workspace 3's text document is Markdown, and Markdown autocloses the following
        // pairs:
        //
        //     [ "{}", "()", "<>", "[]" ]
        //
        // we would expect all of the autoclosing pairs of Markdown to be tracked.
        //
        // Furthermore, we would expect none of the autoclosing pairs of Markdown to not be tracked.
        //
        // # Effect on Other Text Documents
        //
        // The provided text document is not within any of the workspace folders so it is not 
        // affected.         
        //
        // Meanwhile, the text documents in Workspace 1 and Workspace 2 are not affected at all as 
        // this change only applies to Markdown text documents in Workspace 3.
        //
        // # Focus 
        //
        // The text editor of the third workspace (view column 4) will be in focus after this step.
        await executor.setConfiguration<ReadonlyArray<string>>({
            partialName:           'detectedPairs',
            value:                 [ "{}", "()", "<>", "[]" ],
            targetWorkspaceFolder: 'workspace-3',
            targetLanguage:        'markdown',
        });
        await testDetectedPairs(executor, [ "{}" ], [ "[]", "()", "''", "\"\"", "``" ]);  // Provided (Typescript).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "[]", "()" ], [ "{}" ] );                     // Workspace 1 (Plaintext).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "''", "\"\"", "``" ], [ "{}", "[]", "()" ]);  // Workspace 2 (Typescript).
        await executor.focusRightEditorGroup();
        await testDetectedPairs(executor, [ "{}", "()", "<>", "[]" ], []);                // Workspace 3 (Markdown).
    }
});

/**
 * Test whether the pairs in a text editor are cleared when its configuration values have changed.
 */
export const PAIRS_CLEARED_ON_CHANGE_TEST_CASE = new TestCase({
    name: 'Pairs Cleared on Change',
    prelude: async (executor) => {
        
        // First type some pairs into the provided text editor (which will be in view column 1).
        await executor.typePair({ repetitions: 10 });
        executor.assertPairs({   expect: [ { line: 0, sides: range(0, 20) } ] });
        executor.assertCursors({ expect: [ [0, 10] ] });

        // Open the Typescript file in Workspace 2 in another view column (view column 2).
        //
        // Note that we only type in `()` pairs because that is the only pair that is configured to 
        // be detected in Workspace 2.
        await executor.openFile({
            rel:         './workspace-2/text.ts',
            showOptions: { viewColumn: ViewColumn.Two }
        });
        await executor.cursorBottom();
        await executor.typeText({ text: '(', repetitions: 10 });
        executor.assertPairs({   expect: [ { line: 2, sides: range(0, 20) } ] });
        executor.assertCursors({ expect: [ [2, 10] ] });

        // Open the Markdown file in Workspace 3 in another view column (view column 3).
        //
        // Note that we only type in `{}` and `<>` pairs because those are the only two pairs that 
        // were configured to be detected in the Markdown file in Workspace 3.
        await executor.openFile({
            rel:         './workspace-3/text.md',
            showOptions: { viewColumn: ViewColumn.Three }
        });
        await executor.cursorBottom();
        await executor.typeText({ text: '{<{<<<{{{<' });
        executor.assertPairs({   expect: [ { line: 2, sides: range(0, 20) } ] });
        executor.assertCursors({ expect: [ [2, 10] ] });

        // View column 3 will be in focus by the end of the prelude.
    }, 
    task: async (executor) => {

        // 1a. Change the configuration value in Workspace 3, scoped to Markdown.
        await executor.setConfiguration({
            partialName:           'detectedPairs',
            value:                 [ "{}", "[]", "()" ],
            targetWorkspaceFolder: 'workspace-3',
            targetLanguage:        'markdown'
        });

        // 1b. Check that pairs are cleared when the effective configuration value has changed for 
        //     the active text document. 
        executor.assertPairs({   expect: [ 'None' ] });
        executor.assertCursors({ expect: [ [2, 10] ] });

        // 1c. Ensure that unaffected text documents do not have their pairs cleared.
        executor.assertPairs({   expect: [ { line: 0, sides: range(0, 20) } ], viewColumn: ViewColumn.One });
        executor.assertCursors({ expect: [ [0, 10] ],                          viewColumn: ViewColumn.One });
        executor.assertPairs({   expect: [ { line: 2, sides: range(0, 20) } ], viewColumn: ViewColumn.Two });
        executor.assertCursors({ expect: [ [2, 10] ],                          viewColumn: ViewColumn.Two });

        // Type some pairs back into Workspace 3's Markdown file in preparation for the next step.
        await executor.end();
        await executor.typePair({ repetitions: 10 });
        executor.assertPairs({   expect: [ { line: 2, sides: range(20, 40) } ] });
        executor.assertCursors({ expect: [ [2, 30] ] });

        // 2a. Switch focus to Workspace 2's text file, then change the configuration value in the 
        //     workspace root scope.
        await executor.focusLeftEditorGroup();
        await executor.setConfiguration({
            partialName:           'detectedPairs',
            value:                 [ "[]" ],
        });
        
        // 2b. Check that pairs are not cleared when a configuration change does not affect the 
        //     effective value for the active text document.
        //
        // Note that the effective value for Workspace 2's text file is not expected to change since 
        // the configuration is being overridden in Workspace 2's `settings.json` file.
        executor.assertPairs({   expect: [ { line: 2, sides: range(0, 20) } ] });
        executor.assertCursors({ expect: [ [2, 10] ] });

        // 2c. Check that the desired behavior also holds for text documents that are not in focus.
        executor.assertPairs({   expect: [ 'None' ],                             viewColumn: ViewColumn.One });
        executor.assertCursors({ expect: [ [0, 10] ],                            viewColumn: ViewColumn.One });
        executor.assertPairs({   expect: [ { line: 2, sides: range(20, 40) } ],  viewColumn: ViewColumn.Three });
        executor.assertCursors({ expect: [ [2, 30] ],                            viewColumn: ViewColumn.Three });
    }

});

/**
 * This test group tests whether this extension can correctly read configuration values.
 *
 * Within this group, the `leaper.detectedPairs` configuration will be modified in the workspace and 
 * workspace folder scopes in order to check if this extension can properly reload configuration 
 * values when they change.
 */
export const CONFIGURATION_READING_TEST_GROUP = new TestGroup({
    name: 'Configuration Reading',
    testCases: [
        CAN_READ_VALUES_TEST_CASE,
        RELOAD_ON_CHANGE_TEST_CASE,
        PAIRS_CLEARED_ON_CHANGE_TEST_CASE,
    ]
});
