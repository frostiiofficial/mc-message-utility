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

const convertSegment = (text: string): string => {
    let result = "";
    let index = 0;

    while (index < text.length) {
        const character = text[index];

        if (
            (character === "&" || character === "§") &&
            /[0-9a-fk-or]/i.test(text[index + 1] ?? "")
        ) {
            result += text.slice(index, index + 2);
            index += 2;
            continue;
        }

        if (character === "<") {
            const closingIndex = findClosing(text, index, ">");
            if (closingIndex !== -1) {
                const inner = text.slice(index + 1, closingIndex);
                result += `<${inner.includes("|") ? convertSegment(inner) : inner}>`;
                index = closingIndex + 1;
                continue;
            }
        }

        if (character === "{") {
            const closingIndex = findClosing(text, index, "}");
            if (closingIndex !== -1) {
                result += text.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        if (character === "%") {
            const closingIndex = findClosing(text, index, "%");
            if (closingIndex !== -1) {
                result += text.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }

        result += smallCapsMap[character.toLowerCase()] ?? character;
        index += 1;
    }

    return result;
};

export const convertToSmallCaps = (text: string) => convertSegment(text);

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

const convertJsonValues = (text: string) => {
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
            result += `"${convertSegment(rawValue.slice(1, -1))}"`;
        }
        index = end + 1;
    }

    return result;
};

export const convertSelectedValues = (
    text: string,
    language: string,
): string => {
    if (language === "json") {
        return convertJsonValues(text);
    }

    const lines = text.split(/(\r?\n)/);
    const converted = lines.map((line) => {
        if (/^\r?\n$/.test(line)) return line;

        const trimmed = line.trimStart();
        const isComment =
            trimmed.startsWith("#") ||
            (language === "ini" && trimmed.startsWith("!"));
        if (isComment) return line;

        const separator = language === "ini"
            ? line.search(/[=:]/)
            : line.search(/:/);
        if (separator < 1) {
            return convertToSmallCaps(line);
        }

        return `${line.slice(0, separator + 1)}${convertToSmallCaps(line.slice(separator + 1))}`;
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
) => {
    const selectedFields = fields.filter((field) => selectedPaths.has(field.path));
    if (selectedFields.length === 0) return content;
    if (selectedFields.length === fields.length) {
        return convertSelectedValues(content, language);
    }

    let result = content;
    selectedFields.forEach((field) => {
        const key = field.path.split(".").at(-1) ?? field.path;
        const value = convertToSmallCaps(field.value);
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
            `${prefix}${convertToSmallCaps(rawValue)}`,
        );
    });

    return result;
};