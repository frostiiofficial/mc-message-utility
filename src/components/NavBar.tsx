import {
    Boxes,
    Copy,
    GitFork,
    PanelRightClose,
    PanelRightOpen,
    SmilePlus,
    Upload,
    WandSparkles,
} from "lucide-react";
import { useRef } from "react";
import { languages } from "../data/Language";

interface NavBarProps {
    language: string;
    onLanguageChange: (language: string) => void;
    onConvert: () => void;
    onStripEmojis: () => void;
    onCopy: () => void;
    onFileSelected: (file: File) => void;
    isStructureVisible: boolean;
    onToggleStructure: () => void;
}

const NavBar = ({
    language,
    onLanguageChange,
    onConvert,
    onStripEmojis,
    onCopy,
    onFileSelected,
    isStructureVisible,
    onToggleStructure,
}: NavBarProps) => {
    const fileInput = useRef<HTMLInputElement>(null);
    return (
        <div className="flex flex-wrap items-center gap-3 border-b border-b-zinc-700 bg-zinc-800 p-3">
            <Boxes size={32} />
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">MC Message Utility</h1>
                    <span className="rounded border border-amber-400/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300">
                        BETA
                    </span>
                </div>
                <h4 className="text-sm font-light">FrostiiOffical</h4>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onConvert}
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-blue-500 px-3 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <WandSparkles size={17} />
                    Convert
                </button>
                <button
                    type="button"
                    onClick={onStripEmojis}
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-600 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-blue-500 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <SmilePlus size={17} />
                    Strip emoji
                </button>
                <button
                    type="button"
                    onClick={onCopy}
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-600 px-3 text-sm font-medium text-zinc-200 transition-colors hover:border-blue-500 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <Copy size={17} />
                    Copy
                </button>
                <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex h-10 w-32 items-center justify-center gap-2 rounded-md border border-blue-500 text-base font-medium text-blue-400 transition-colors hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <Upload size={20} />
                    Upload
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".yml,.yaml,.json,.properties,.props,.ini"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onFileSelected(file);
                        event.target.value = "";
                    }}
                />
                <label
                    className="flex items-center gap-2 text-sm"
                    htmlFor="language-select">
                    <select
                        id="language-select"
                        value={language}
                        onChange={(event) =>
                            onLanguageChange(event.target.value)
                        }
                        className="h-10 w-32 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-white outline-none focus:border-zinc-500">
                        {languages.map((option) => (
                            <option
                                key={option.id}
                                value={option.monacoLanguage}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={onToggleStructure}
                    aria-label={`${isStructureVisible ? "Hide" : "Show"} structure view`}
                    title={`${isStructureVisible ? "Hide" : "Show"} structure view`}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-600 text-zinc-200 transition-colors hover:border-blue-500 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {isStructureVisible ? (
                        <PanelRightClose size={17} />
                    ) : (
                        <PanelRightOpen size={17} />
                    )}
                </button>
                <a
                    href="#"
                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
                    <GitFork size={16} />
                    <span className="underline">Report a bug</span>
                </a>
            </div>
        </div>
    );
};

export default NavBar;
