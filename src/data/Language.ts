import {
    FileCode,
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
