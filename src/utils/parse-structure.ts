import { parseDocument } from "yaml";

export interface StructureField {
    path: string;
    value: string;
}

export interface StructureResult {
    fields: StructureField[];
    error: { message: string; line: number } | null;
}

const toSingleLine = (value: string) =>
    value.replace(/\s*\r?\n\s*/g, " ").trim();

const minecraftColorPlaceholder = "\uE000";

const restoreMinecraftColors = (value: unknown): unknown => {
    if (typeof value === "string") {
        return value.replaceAll(minecraftColorPlaceholder, "&");
    }
    if (Array.isArray(value)) {
        return value.map(restoreMinecraftColors);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [
                key,
                restoreMinecraftColors(child),
            ]),
        );
    }
    return value;
};

const flattenJson = (
    value: unknown,
    path: string,
    fields: StructureField[],
) => {
    if (value === null || typeof value !== "object") {
        fields.push({ path, value: toSingleLine(String(value)) });
        return;
    }

    const entries = Array.isArray(value)
        ? value.map((item, index) => [String(index), item] as const)
        : Object.entries(value);

    if (entries.length === 0) {
        fields.push({ path, value: Array.isArray(value) ? "[]" : "{}" });
        return;
    }

    entries.forEach(([key, child]) => {
        flattenJson(child, path ? `${path}.${key}` : key, fields);
    });
};

const parseJson = (content: string): StructureResult => {
    if (!content.trim()) {
        return { fields: [], error: null };
    }

    try {
        const parsed = JSON.parse(content);
        const fields: StructureField[] = [];
        flattenJson(parsed, "", fields);
        return { fields, error: null };
    } catch {
        return {
            fields: [],
            error: { message: "Invalid JSON syntax", line: 1 },
        };
    }
};

const parseProperties = (content: string): StructureResult => {
    const fields: StructureField[] = [];
    const lines = content.split(/\r?\n/);

    for (const [index, line] of lines.entries()) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
            continue;
        }

        const separator = trimmed.search(/[=:]/);
        if (separator < 1) {
            return {
                fields: [],
                error: {
                    message: "Invalid properties syntax",
                    line: index + 1,
                },
            };
        }

        fields.push({
            path: trimmed.slice(0, separator).trim(),
            value: toSingleLine(trimmed.slice(separator + 1)),
        });
    }

    return { fields, error: null };
};

const parseYaml = (content: string): StructureResult => {
    if (!content.trim()) {
        return { fields: [], error: null };
    }

    const protectedContent = content.replace(
        /&(?=[0-9a-fk-or])/gi,
        minecraftColorPlaceholder,
    );
    const document = parseDocument(protectedContent);
    if (document.errors.length > 0) {
        const firstError = document.errors[0];
        return {
            fields: [],
            error: {
                message: "Invalid YAML syntax",
                line: (firstError.linePos?.[0]?.line ?? 1),
            },
        };
    }

    const fields: StructureField[] = [];
    flattenJson(restoreMinecraftColors(document.toJS()), "", fields);
    return { fields, error: null };
};

export const parseStructure = (
    content: string,
    language: string,
): StructureResult => {
    if (language === "json") {
        return parseJson(content);
    }

    if (language === "ini") {
        return parseProperties(content);
    }

    return parseYaml(content);
};