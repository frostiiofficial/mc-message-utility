import {
    FileCode,
    FileText,
    Braces,
    SlidersHorizontal,
    type LucideIcon,
} from "lucide-react";

export interface LanguageOption {
    id: string;
    label: string;
    monacoLanguage: string;
    icon: LucideIcon;
}

export const languages: LanguageOption[] = [
    {
        id: "text",
        label: "Plain Text",
        monacoLanguage: "plaintext",
        icon: FileText,
    },
    {
        id: "yaml",
        label: "YAML",
        monacoLanguage: "yaml",
        icon: FileCode,
    },
    {
        id: "json",
        label: "JSON",
        monacoLanguage: "json",
        icon: Braces,
    },
    {
        id: "properties",
        label: "Properties",
        monacoLanguage: "ini",
        icon: SlidersHorizontal,
    },
];
