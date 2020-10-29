//! The following module defines the 'starting point' class of the extension.

import { commands, Disposable, Position, TextEditor, window } from 'vscode';
import { TestAPI } from './test-api';
import { ContextBroadcaster } from './context-broadcaster';
import { Tracker } from './tracker/tracker';

/**
 * The engine of this extension.
 * 
 * Creating an instance of this class starts the extension. 
 * 
 * # What This Class Does
 * 
 * This class mainly acts as a coordinator. 
 * 
 * The primary responsbility of this class is to assign to each visible text editor a `Tracker` 
 * instance. The `Tracker` instance belonging to each class is then responsible for tracking and 
 * decorating the pairs in its owning text editor.
 * 
 * Furthermore, this class manages the keybindings of this extension by 'context switching', that is, 
 * by making sure that the context values within vscode are always synchronized with the context 
 * values of the active text editor's tracker.
 * 
 * # Safety
 * 
 * Only one instance of this class should be active at any time. And the created instance of this 
 * class must be disposed of when the extension is shut down.
 */
export class Engine implements TestAPI {

    /**
     * The trackers assigned to each visible text editor.
     */
    private trackers: Map<TextEditor, Tracker>;

    /**
     * A pointer to the tracker assigned to the active text editor.
     * 
     * This is `undefined` if there is no active text editor.
     */
    private activeTracker: Tracker | undefined;

    /**
     * Keybinding to move the cursor in the active text editor past the nearest available pair.
     */
    private readonly leapCommand = commands.registerTextEditorCommand(
        'leaper.leap', 
        () => this.activeTracker?.leap()
    );

    /**
     * Keybinding to untrack all the pairs in the active text editor. 
     */
    private readonly escapeLeaperModeCommand = commands.registerTextEditorCommand(
        'leaper.escapeLeaperMode', 
        () => this.activeTracker?.escapeLeaperMode()    
    );

    /**
     * Watcher to make sure that this engine follows the active text editor.
     */
    private readonly activeTextEditorChangeWatcher = window.onDidChangeActiveTextEditor(() => {
        this.rebindActiveTracker();
    });

    /**
     * Watcher that keeps track of the visible text editors.
     */
    private readonly visibleTextEditorsChangeWatcher = window.onDidChangeVisibleTextEditors(
        (_visibleTextEditors) => {

            const visibleSet  = new Set(_visibleTextEditors);
            const newTrackers = new Map<TextEditor, Tracker>();

            // Preserve the trackers of text editors that are still visible and clean up the rest.
            for (const [editor, tracker] of this.trackers.entries()) {
                visibleSet.has(editor) ? newTrackers.set(editor, tracker) : tracker.dispose();
            }

            // Assign trackers for text editors that are newly visible.
            for (const visibleTextEditor of visibleSet) {
                if (!newTrackers.has(visibleTextEditor)) {
                    newTrackers.set(visibleTextEditor, new Tracker(visibleTextEditor));
                }
            }

            this.trackers = newTrackers;
        }
    )

    /**
     * To broadcast the `leaper.inLeaperMode` context of the active tracker to vscode.
     */
    private readonly inLeaperModeContextBroadcaster = new ContextBroadcaster(
        'leaper.inLeaperMode',
        () => this.activeTracker?.inLeaperModeContext.get() ?? false
    );

    /**
     * Watcher that schedules for a broadcast when the `leaper.inLeaperMode` context of the active 
     * tracker has been updated.
     */
    private activeInLeaperModeContextUpdateWatcher: Disposable | undefined;

    /** 
     * See `TestAPI` for more info. 
     */
    public get MRBInLeaperModeContext(): boolean | undefined {
        return this.inLeaperModeContextBroadcaster.prevBroadcasted;
    }

    /**
     * To broadcast the `leaper.hasLineOfSight` context of the active tracker to vscode.
     */
    private readonly hasLineOfSightContextBroadcaster = new ContextBroadcaster(
        'leaper.hasLineOfSight',
        () => this.activeTracker?.hasLineOfSightContext.get() ?? false
    );

    /**
     * Watcher that schedules for a broadcast when the `leaper.hasLineOfSight` context of the active 
     * tracker has been updated.
     */
    private activeHasLineOfSightContextUpdateWatcher: Disposable | undefined;

    /** 
     * See `TestAPI` for more info. 
     */
    public get MRBHasLineOfSightContext(): boolean | undefined {
        return this.hasLineOfSightContextBroadcaster.prevBroadcasted;
    }
    
    public constructor() {
        
        // Assign to each text editor its own tracker.
        this.trackers = new Map(window.visibleTextEditors.map((e) => [e, new Tracker(e)]));

        // Bind this engine to the active text editor's tracker.
        this.rebindActiveTracker();
    }

    /**
     * Rebind this engine to the currently active text editor's tracker.
     * 
     * This switches vscode's context to the context of the active tracker.
     */
    private rebindActiveTracker(): void {

        const { activeTextEditor } = window;

        // Point to the current active text editor's tracker.
        this.activeTracker = activeTextEditor ? this.trackers.get(activeTextEditor): undefined;

        // Stop the previous context watchers since they might be listening to a now inactive tracker.
        this.activeInLeaperModeContextUpdateWatcher?.dispose();
        this.activeHasLineOfSightContextUpdateWatcher?.dispose();

        // Begin to watch the active tracker's context values.
        this.activeInLeaperModeContextUpdateWatcher = this.activeTracker?.inLeaperModeContext.onDidUpdate(() => {
            this.inLeaperModeContextBroadcaster.set();
        });
        this.activeHasLineOfSightContextUpdateWatcher = this.activeTracker?.hasLineOfSightContext.onDidUpdate(() => {
            this.hasLineOfSightContextBroadcaster.set();
        });
            
        // Switch vscode's context to the active tracker's context.
        this.inLeaperModeContextBroadcaster.set();
        this.hasLineOfSightContextBroadcaster.set();
    }

    /**
     * See `TestAPI` for more info.
     */
    public activeSnapshot(): { open: Position, close: Position, isDecorated: boolean }[][] {
        return this.activeTracker?.snapshot() ?? [];
    }

    /**
     * Terminate the engine.
     * 
     * Calling this method does the following:
     * 
     *   1. Unregister the extension's commands.
     *   2. Remove all pairs from being tracked.
     *   3. Remove all decorations.
     *   4. Disable tracking of the editors.
     *   5. Disable the extension's keybinding contexts.
     * 
     * In other words, calling this method removes all traces of the extension. 
     */
    public dispose(): void {
        this.trackers.forEach((tracker) => tracker.dispose());  
        this.leapCommand.dispose();
        this.escapeLeaperModeCommand.dispose();
        this.activeTextEditorChangeWatcher.dispose();
        this.visibleTextEditorsChangeWatcher.dispose();
        this.inLeaperModeContextBroadcaster.dispose();
        this.activeInLeaperModeContextUpdateWatcher?.dispose();
        this.hasLineOfSightContextBroadcaster.dispose();
        this.activeHasLineOfSightContextUpdateWatcher?.dispose();
    }

}
