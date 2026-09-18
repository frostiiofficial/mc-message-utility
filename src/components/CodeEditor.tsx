import { Editor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from "react";

export interface CodeEditorHandle {
    getSelectedText: () => string;
    replaceSelectedText: (text: string) => boolean;
    getValue: () => string;
}

interface CodeEditorProps {
    language: string;
    value: string;
    onChange: (value: string) => void;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
    ({ language, value, onChange }, ref) => {
        const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

        useEffect(() => {
            const editor = editorRef.current;
            const model = editor?.getModel();
            if (!editor || !model || model.getValue() === value) return;

            editor.executeEdits("mc-message-utility-external", [
                {
                    range: model.getFullModelRange(),
                    text: value,
                    forceMoveMarkers: true,
                },
            ]);
        }, [value]);

        useImperativeHandle(ref, () => ({
            getSelectedText: () => {
                const editor = editorRef.current;
                if (!editor) return "";
                return editor.getModel()?.getValueInRange(editor.getSelection()!) ?? "";
            },
            replaceSelectedText: (text) => {
                const editor = editorRef.current;
                const model = editor?.getModel();
                const selection = editor?.getSelection();
                if (!editor || !model || !selection || selection.isEmpty()) return false;
                const startOffset = model.getOffsetAt(selection.getStartPosition());
                editor.executeEdits("mc-message-utility", [
                    { range: selection, text, forceMoveMarkers: true },
                ]);
                const endPosition = model.getPositionAt(startOffset + text.length);
                editor.setSelection({
                    selectionStartLineNumber: endPosition.lineNumber,
                    selectionStartColumn: endPosition.column,
                    positionLineNumber: endPosition.lineNumber,
                    positionColumn: endPosition.column,
                });
                editor.focus();
                return true;
            },
            getValue: () => editorRef.current?.getValue() ?? value,
        }));

        return (
        <div className="relative h-full w-full overflow-hidden">
            <Editor
                language={language}
                defaultValue={value}
                onChange={(nextValue) => onChange(nextValue ?? "")}
                height="100%"
                width="100%"
                theme="vs-dark"
                options={{
                    fontFamily: "JetBrains Mono, monospace",
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: "on",
                    cursorBlinking: "phase",
                    selectionHighlight: false,
                    occurrencesHighlight: "off",
                    unicodeHighlight: {
                        nonBasicASCII: false,
                        invisibleCharacters: false,
                        ambiguousCharacters: false,
                        includeComments: false,
                        includeStrings: false,
                    },
                    minimap: {
                        enabled: false,
                    },
                }}
                onMount={(editor) => {
                    editorRef.current = editor;
                }}
            />
        </div>
        );
    },
);

CodeEditor.displayName = "CodeEditor";

export default CodeEditor;
