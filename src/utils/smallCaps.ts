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

const findClosing = (
    text: string,
    start: number,
    opening: string,
    closing: string,
) => {
    if (opening === closing) return text.indexOf(closing, start + 1);

    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
        if (text[index] === opening) {
            depth += 1;
        } else if (text[index] === closing) {
            depth -= 1;
            if (depth === 0) return index;
        }
    }

    return -1;
};

const gradientRulePattern =
    /<gradient:[^>\r\n]*>|gradient:(?:#[^:\s>]+(?::#[^:\s>]+)+)/giu;

const colorCodePattern =
    /(?:[&§](?:[0-9a-fk-or]|#(?:[0-9a-f]{6}|[0-9a-f]{3})|x(?:[&§][0-9a-f]){6})|&#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:;)?/giu;

const urlPattern =
    /(?:https?:\/\/|www\.)[^\s<>{}\[\]()]*(?:\?[^\s<>{}\[\]()]*)?(?:#[^\s<>{}\[\]()]*)?|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>{}\[\]()]*)?(?:\?[^\s<>{}\[\]()]*)?(?:#[^\s<>{}\[\]()]*)?/giu;

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
    const preservedUrls: string[] = [];
    const protectedText = text
        .replace(gradientRulePattern, (gradient) => {
            preservedGradients.push(gradient);
            return `\uE200${preservedGradients.length - 1}\uE201`;
        })
        .replace(urlPattern, (url) => {
            preservedUrls.push(url);
            return `\uE300${preservedUrls.length - 1}\uE301`;
        });
    let result = "";
    let index = 0;

    while (index < protectedText.length) {
        const character = protectedText[index];

        if (rules.colorCodes && (character === "&" || character === "§")) {
            const colorCodeMatch = protectedText
                .slice(index)
                .match(
                    /^(?:[&§](?:[0-9a-fk-or]|#(?:[0-9a-f]{6}|[0-9a-f]{3})|x(?:[&§][0-9a-f]){6})|&#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:;)?/i,
                );

            if (colorCodeMatch) {
                result += colorCodeMatch[0];
                index += colorCodeMatch[0].length;
                continue;
            }
        }

        if (rules.angleBrackets && character === "<") {
            const closingIndex = findClosing(protectedText, index, "<", ">");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (rules.curlyBraces && character === "{") {
            const closingIndex = findClosing(protectedText, index, "{", "}");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (rules.percentTokens && character === "%") {
            const closingIndex = findClosing(protectedText, index, "%", "%");
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
            const closingIndex = findClosing(protectedText, index, "[", "]");
            if (closingIndex !== -1) {
                result += protectedText.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        result += smallCapsMap[character.toLowerCase()] ?? character;
        index += 1;
    }

    return result
        .replace(
            /\uE200(\d+)\uE201/g,
            (_match, gradientIndex: string) =>
                preservedGradients[Number(gradientIndex)],
        )
        .replace(
            /\uE300(\d+)\uE301/g,
            (_match, urlIndex: string) => preservedUrls[Number(urlIndex)],
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
    const protectedText = text
        .replace(
            /(?:[&§](?:[0-9a-fk-or]|#(?:[0-9a-f]{6}|[0-9a-f]{3})|x(?:[&§][0-9a-f]){6})|&#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:;)?|(?:<[^>]*>)|(?:\{[^{}\r\n]*\})|(?:%[^%]*%)/giu,
            (token) => {
                protectedTokens.push(token);
                return `\uE100${protectedTokens.length - 1}\uE101`;
            },
        )
        .replace(urlPattern, (url) => {
            protectedTokens.push(url);
            return `\uE110${protectedTokens.length - 1}\uE111`;
        });

    return { protectedText, protectedTokens };
};

export const stripEmojis = (text: string) => {
    const { protectedText, protectedTokens } = protectMinecraftSyntax(text);
    return protectedText
        .replace(emojiPattern, "")
        .replace(
            /\uE100(\d+)\uE101|\uE110(\d+)\uE111/g,
            (_match, minecraftIndex: string, urlIndex: string) =>
                protectedTokens[Number(minecraftIndex ?? urlIndex)],
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

const isMaterialFieldName = (key: string) =>
    key.split(".").at(-1)?.trim().toLowerCase() === "material";

const convertJsonValues = (
    text: string,
    rules: ConversionRules = defaultConversionRules,
) => {
    let result = "";
    let index = 0;
    let lastPropertyKey: string | null = null;

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
            try {
                lastPropertyKey = JSON.parse(rawValue);
            } catch {
                lastPropertyKey = rawValue.slice(1, -1);
            }
            result += rawValue;
            index = end + 1;
            continue;
        }

        const valueText = rawValue.slice(1, -1);
        const isMaterialJsonKey =
            lastPropertyKey !== null && isMaterialFieldName(lastPropertyKey);

        result += isMaterialJsonKey
            ? rawValue
            : `"${convertSegment(valueText, rules)}"`;
        lastPropertyKey = null;
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
            const closingIndex = findClosing(
                line,
                index,
                character,
                closingCharacter,
            );
            if (closingIndex !== -1) {
                index = closingIndex + 1;
                continue;
            }
        }

        if (separators.includes(character)) {
            const left = line.slice(0, index).trim();
            const looksLikeColorizedText =
                /(?:[&§]|&#|<gradient:|\{|\[|%)/.test(left) &&
                /(?:[&§]|&#)/.test(left);

            if (looksLikeColorizedText) {
                index += 1;
                continue;
            }

            return index;
        }
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

        const keyText = line.slice(0, separator).trim();
        const keyName = keyText.replace(/[\[\]]/g, "").trim();
        const isMaterialValue = isMaterialFieldName(keyName);

        if (isMaterialValue) {
            return line;
        }

        return `${line.slice(0, separator + 1)}${convertToSmallCaps(line.slice(separator + 1), rules)}`;
    });

    return converted.join("");
};

const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceNextStructuredValue = (
    content: string,
    rawValue: string,
    convertedValue: string,
    searchStart: number,
) => {
    if (!rawValue || rawValue === "[]" || rawValue === "{}") {
        return { content, nextSearchStart: searchStart };
    }

    const pattern = new RegExp(
        `(^|[=:]\\s*|-\\s*)(["']?)${escapeRegExp(rawValue)}\\2(?=\\s*(?:#.*)?$)`,
        "gm",
    );
    pattern.lastIndex = searchStart;
    const match = pattern.exec(content);
    if (!match || match.index === undefined) {
        return { content, nextSearchStart: searchStart };
    }

    const quote = match[2] ?? "";
    const replacement = `${match[1]}${quote}${convertedValue}${quote}`;
    const nextContent =
        content.slice(0, match.index) +
        replacement +
        content.slice(match.index + match[0].length);

    return {
        content: nextContent,
        nextSearchStart: match.index + replacement.length,
    };
};

const replaceNextJsonValue = (
    content: string,
    rawValue: string,
    convertedValue: string,
    searchStart: number,
) => {
    const serializedValue = JSON.stringify(rawValue);
    const serializedReplacement = JSON.stringify(convertedValue);
    const pattern = new RegExp(
        `(^|[\\[,:]\\s*)${escapeRegExp(serializedValue)}(?=\\s*[,}\\]])`,
        "gm",
    );
    pattern.lastIndex = searchStart;
    const match = pattern.exec(content);
    if (!match || match.index === undefined) {
        return { content, nextSearchStart: searchStart };
    }

    const replacement = `${match[1]}${serializedReplacement}`;
    const nextContent =
        content.slice(0, match.index) +
        replacement +
        content.slice(match.index + match[0].length);

    return {
        content: nextContent,
        nextSearchStart: match.index + replacement.length,
    };
};

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
    let searchStart = 0;
    selectedFields.forEach((field) => {
        const value = isMaterialFieldName(field.path)
            ? field.value
            : convertToSmallCaps(field.value, rules);

        if (language === "json") {
            const replacement = replaceNextJsonValue(
                result,
                field.value,
                value,
                searchStart,
            );
            result = replacement.content;
            searchStart = replacement.nextSearchStart;
            return;
        }

        const replacement = replaceNextStructuredValue(
            result,
            field.value,
            value,
            searchStart,
        );
        result = replacement.content;
        searchStart = replacement.nextSearchStart;
    });

    return result;
};