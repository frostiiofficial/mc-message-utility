const smallCapsMap: Record<string, string> = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "ꜱ",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
};

const findClosing = (text: string, start: number, closing: string) =>
    text.indexOf(closing, start + 1);

const gradientRulePattern =
    /<gradient:[^>\r\n]*>|gradient:(?:#[^:\s>]+(?::#[^:\s>]+)+)/giu;

export interface ConversionRules {
    colorCodes: boolean;
    angleBrackets: boolean;
    curlyBraces: boolean;
    percentTokens: boolean;
    squareBrackets: boolean;
    escapes: boolean;
}

export const defaultConversionRules: ConversionRules = {
    colorCodes: true,
    angleBrackets: true,
    curlyBraces: true,
    percentTokens: true,
    squareBrackets: true,
    escapes: true,
};

const convertSegment = (
    text: string,
    rules: ConversionRules = defaultConversionRules,
): string => {
    const preservedGradients: string[] = [];
    const protectedText = text.replace(gradientRulePattern, (gradient) => {
        preservedGradients.push(gradient);
        return `\uE200${preservedGradients.length - 1}\uE201`;
    });
    let result = "";
    let index = 0;

    while (index < protectedText.length) {
        const character = protectedText[index];

        if (
            rules.colorCodes &&
            (character === "&" || character === "§") &&
            /[0-9a-fk-or]/i.test(protectedText[index + 1] ?? "")
        ) {
            result += protectedText.slice(index, index + 2);
            index += 2;
            continue;
        }

        if (character === "<") {
            const closingIndex = findClosing(protectedText, index, ">");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (rules.curlyBraces && character === "{") {
                const closingIndex = findClosing(protectedText, index, "}");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (rules.percentTokens && character === "%") {
            const closingIndex = findClosing(protectedText, index, "%");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (rules.escapes && character === "\\") {
            const escapedCharacter = protectedText[index + 1] ?? "";
            const unicodeEscape =
                escapedCharacter.toLowerCase() === "u" &&
                /^[0-9a-f]{4}$/i.test(protectedText.slice(index + 2, index + 6));
            const escapeLength = unicodeEscape ? 6 : 2;
            result += protectedText.slice(index, index + escapeLength);
            index += escapeLength;
            continue;
        }

        if (rules.squareBrackets && character === "[") {
            const closingIndex = findClosing(protectedText, index, "]");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        result += smallCapsMap[character.toLowerCase()] ?? character;
        index += 1;
    }

    return result.replace(
        /\uE200(\d+)\uE201/g,
        (_match, gradientIndex: string) => preservedGradients[Number(gradientIndex)],
    );
};

export const convertToSmallCaps = (
    text: string,
    rules: ConversionRules = defaultConversionRules,
) => convertSegment(text, rules);

const emojiPattern =
    /[\u{1F000}-\u{1FAFF}]|\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F3FB}-\u{1F3FF}]|[\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{2500}-\u{27BF}\u{2B00}-\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}]|[\u{FE0E}\u{FE0F}\u{200D}]/gu;

const protectMinecraftSyntax = (text: string) => {
    const protectedTokens: string[] = [];
    const protectedText = text.replace(
        /(?:[&§][0-9a-fk-or])|(?:<[^>]*>)|(?:\{[^{}\r\n]*\})|(?:%[^%]*%)/giu,
        (token) => {
            protectedTokens.push(token);
            return `\uE100${protectedTokens.length - 1}\uE101`;
        },
    );

    return { protectedText, protectedTokens };
};

export const stripEmojis = (text: string) => {
    const { protectedText, protectedTokens } = protectMinecraftSyntax(text);
    return protectedText.replace(emojiPattern, "").replace(
        /\uE100(\d+)\uE101/g,
        (_match, index: string) => protectedTokens[Number(index)],
    );
};

export const stripContentEmojis = (
    content: string,
    language: string,
    fields: readonly { path: string; value: string }[],
    selectedPaths: ReadonlySet<string>,
) => {
    if (selectedPaths.size === 0) return content;
    if (selectedPaths.size === fields.length) return stripEmojis(content);

    let result = content;
    fields
        .filter((field) => selectedPaths.has(field.path))
        .forEach((field) => {
            const key = field.path.split(".").at(-1) ?? field.path;
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const separator = language === "ini" ? "[=:]" : ":";
            const pattern = new RegExp(
                `(\\s*${escapedKey}\\s*${separator}\\s*)(.*)$`,
                "gm",
            );
            result = result.replace(pattern, (_match, prefix, value) =>
                `${prefix}${stripEmojis(value)}`,
            );
        });
    return result;
};

const convertJsonValues = (
    text: string,
    rules: ConversionRules = defaultConversionRules,
) => {
    let result = "";
    let index = 0;

    while (index < text.length) {
        if (text[index] !== '"') {
            result += text[index];
            index += 1;
            continue;
        }

        let end = index + 1;
        while (end < text.length) {
            if (text[end] === "\\") {
                end += 2;
                continue;
            }
            if (text[end] === '"') break;
            end += 1;
        }

        const rawValue = text.slice(index, end + 1);
        let next = end + 1;
        while (/\s/.test(text[next] ?? "")) next += 1;

        if (text[next] === ":") {
            result += rawValue;
        } else {
            result += `"${convertSegment(rawValue.slice(1, -1), rules)}"`;
        }
        index = end + 1;
    }

    return result;
};

const findValueSeparator = (line: string, language: string) => {
    const separators = language === "ini" ? "=:" : ":";
    let index = 0;

    while (index < line.length) {
        const character = line[index];
        const closingCharacter =
            character === "<"
                ? ">"
                : character === "{"
                  ? "}"
                  : character === "["
                    ? "]"
                    : character === "%"
                      ? "%"
                      : null;

        if (closingCharacter) {
            const closingIndex = findClosing(line, index, closingCharacter);
            if (closingIndex !== -1) {
                index = closingIndex + 1;
                continue;
            }
        }

        if (separators.includes(character)) return index;
        index += 1;
    }

    return -1;
};

export const convertSelectedValues = (
    text: string,
    language: string,
    rules: ConversionRules = defaultConversionRules,
): string => {
    if (language === "plaintext") {
        return convertToSmallCaps(text, rules);
    }

    if (language === "json") {
        return convertJsonValues(text, rules);
    }

    const lines = text.split(/(\r?\n)/);
    const converted = lines.map((line) => {
        if (/^\r?\n$/.test(line)) return line;

        const trimmed = line.trimStart();
        const isComment =
            trimmed.startsWith("#") ||
            (language === "ini" && trimmed.startsWith("!"));
        if (isComment) return line;

        const separator = findValueSeparator(line, language);
        if (separator < 1) {
            return convertToSmallCaps(line, rules);
        }

        return `${line.slice(0, separator + 1)}${convertToSmallCaps(line.slice(separator + 1), rules)}`;
    });

    return converted.join("");
};

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const convertContentValues = (
    content: string,
    language: string,
    fields: readonly { path: string; value: string }[],
    selectedPaths: ReadonlySet<string>,
    rules: ConversionRules = defaultConversionRules,
) => {
    const selectedFields = fields.filter((field) => selectedPaths.has(field.path));
    if (selectedFields.length === 0) return content;
    if (selectedFields.length === fields.length) {
        return convertSelectedValues(content, language, rules);
    }

    let result = content;
    selectedFields.forEach((field) => {
        const key = field.path.split(".").at(-1) ?? field.path;
        const value = convertToSmallCaps(field.value, rules);
        const escapedKey = escapeRegExp(key);

        if (language === "json") {
            const pattern = new RegExp(
                `(\\"${escapedKey}\\"\\s*:\\s*\\")([^\\"]*)(\\")`,
                "g",
            );
            result = result.replace(pattern, (_match, prefix, _rawValue, suffix) =>
                `${prefix}${value}${suffix}`,
            );
            return;
        }

        const separator = language === "ini" ? "[=:]" : ":";
        const pattern = new RegExp(
            `(\\s*${escapedKey}\\s*${separator}\\s*)(.*)$`,
            "gm",
        );
        result = result.replace(pattern, (_match, prefix, rawValue) =>
            `${prefix}${convertToSmallCaps(rawValue, rules)}`,
        );
    });

    return result;
};