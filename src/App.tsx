import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
    Group,
    Panel,
    Separator,
    type PanelImperativeHandle,
} from "react-resizable-panels";
import CodeEditor, { type CodeEditorHandle } from "./components/CodeEditor";
import NavBar from "./components/NavBar";
import StructureView from "./components/StructureView";
import ToastProvider, { useToast } from "./components/ToastProvider";
import { parseStructure } from "./utils/parse-structure";
import {
    convertContentValues,
    convertSelectedValues,
    stripEmojis,
} from "./utils/smallCaps";

const sessionStorageKey = "mc-message-utility-session";

interface SavedSession {
    content: string;
    language: string;
    treeSelection: {
        signature: string;
        paths: string[];
    };
}

const loadSession = (): SavedSession | null => {
    try {
        const saved = window.localStorage.getItem(sessionStorageKey);
        return saved ? (JSON.parse(saved) as SavedSession) : null;
    } catch {
        return null;
    }
};

const AppContent = () => {
    const [savedSession] = useState(loadSession);
    const [language, setLanguage] = useState(savedSession?.language ?? "yaml");
    const [content, setContent] = useState(savedSession?.content ?? "");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStructureVisible, setIsStructureVisible] = useState(true);
    const [treeSelection, setTreeSelection] = useState<{
        signature: string;
        paths: Set<string>;
    }>({
        signature: savedSession?.treeSelection.signature ?? "",
        paths: new Set(savedSession?.treeSelection.paths ?? []),
    });
    const editorRef = useRef<CodeEditorHandle>(null);
    const structurePanelRef = useRef<PanelImperativeHandle>(null);
    const { showToast } = useToast();
    const structure = parseStructure(content, language);
    const structureSignature = structure.fields
        .map((field) => field.path)
        .join("\u0001");
    const selectedTreePaths =
        treeSelection.signature === structureSignature
            ? treeSelection.paths
            : new Set<string>();

    useEffect(() => {
        try {
            window.localStorage.setItem(
                sessionStorageKey,
                JSON.stringify({
                    content,
                    language,
                    treeSelection: {
                        signature: treeSelection.signature,
                        paths: [...treeSelection.paths],
                    },
                } satisfies SavedSession),
            );
        } catch {
            // Storage can be unavailable in private or restricted contexts.
        }
    }, [content, language, treeSelection]);

    const handleHeaderConvert = async () => {
        setIsProcessing(true);
        await new Promise((resolve) => window.setTimeout(resolve, 120));

        try {
            const editor = editorRef.current;
            const selectedText = editor?.getSelectedText() ?? "";
            if (selectedText) {
                editor?.replaceSelectedText(
                    convertSelectedValues(selectedText, language),
                );
            } else {
                setContent(convertSelectedValues(content, language));
            }
            showToast("Values converted.", "success");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStructureConvert = async () => {
        if (selectedTreePaths.size === 0) {
            showToast("Select at least one field first.", "error");
            return;
        }

        setIsProcessing(true);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        try {
            setContent(
                convertContentValues(
                    content,
                    language,
                    structure.fields,
                    selectedTreePaths,
                ),
            );
            showToast("Selected values converted.", "success");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(editorRef.current?.getValue() ?? "");
            showToast("Copied to clipboard!", "success");
        } catch {
            showToast("Unable to copy to clipboard.", "error");
        }
    };

    const handleStripEmojis = () => {
        const strippedContent = stripEmojis(content);
        setContent(strippedContent);
        showToast(
            strippedContent === content
                ? "No emojis or symbols found."
                : "Emojis and symbols stripped.",
            strippedContent === content ? "info" : "success",
        );
    };

    const handleFileSelected = async (file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const nextLanguage =
            extension === "json"
                ? "json"
                : extension === "properties" || extension === "props" || extension === "ini"
                  ? "ini"
                  : "yaml";
        setLanguage(nextLanguage);
        setContent(await file.text());
        setTreeSelection({ signature: "", paths: new Set() });
        showToast(`Loaded ${file.name}`, "success");
    };

    return (
        <div className="flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden">
            <NavBar
                language={language}
                onLanguageChange={setLanguage}
                onConvert={handleHeaderConvert}
                onStripEmojis={handleStripEmojis}
                onCopy={handleCopy}
                onFileSelected={handleFileSelected}
                isStructureVisible={isStructureVisible}
                onToggleStructure={() => {
                    if (isStructureVisible) {
                        structurePanelRef.current?.collapse();
                    } else {
                        structurePanelRef.current?.expand();
                    }
                    setIsStructureVisible((visible) => !visible);
                }}
            />
            <Group className="min-h-0 min-w-0 flex-1">
                <Panel defaultSize="50%" minSize="400px" className="min-w-0">
                    <CodeEditor
                        ref={editorRef}
                        language={language}
                        value={content}
                        onChange={setContent}
                    />
                </Panel>
                <Separator className="bg-zinc-700 hover:bg-zinc-600 w-1.5 duration-300" />
                <Panel
                    panelRef={structurePanelRef}
                    defaultSize="50%"
                    minSize="400px"
                    collapsedSize="0%"
                    collapsible
                    className="min-w-0">
                    <StructureView
                        fields={structure.fields}
                        error={structure.error}
                        checkedPaths={selectedTreePaths}
                        onConvert={handleStructureConvert}
                        onCheckedPathsChange={(paths) =>
                            setTreeSelection({
                                signature: structureSignature,
                                paths: new Set(paths),
                            })
                        }
                    />
                </Panel>
            </Group>
            {isProcessing && (
                <div className="animate-loading-fade fixed inset-0 z-60 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 text-zinc-200 backdrop-blur-sm">
                    <LoaderCircle
                        size={32}
                        className="animate-spin text-blue-400"
                    />
                    <span className="animate-pulse text-sm">Processing values...</span>
                </div>
            )}
        </div>
    );
};

const App = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;
