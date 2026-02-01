import { describe, expect, test, it } from "vitest";
import { normalizeString, undefinedToNullDeep, buildUserAvatarURLs } from "../../src/lib/helpers.js";

describe("string normalization", () => {
    // Passing string test cases with expected normalized output
    const passingStrings = [
        { input: "Andrew", expected: "Andrew" },
        { input: " Dan", expected: "Dan" },
        { input: "  leading space", expected: "leading space" },
        { input: "trailing space  ", expected: "trailing space" },
        { input: "  both sides  ", expected: "both sides" },
        { input: "mixed CASE String", expected: "mixed CASE String" },
        { input: "a".repeat(10000), expected: "a".repeat(10000) },
        { input: "🦄✨漢字", expected: "🦄✨漢字" },
        { input: "😂🤣👍", expected: "😂🤣👍" },
        { input: "", expected: "" },
        { input: "     ", expected: "" },
        { input: "  multiple   spaces  inside  ", expected: "multiple spaces inside" },
        { input: "\t tabs\tand  spaces \t", expected: "tabs and spaces" },
        { input: "\nnewlines\nand spaces\n", expected: "newlines and spaces" },
        { input: "\u00A0non-breaking\u00A0spaces\u00A0", expected: "non-breaking spaces" },
        { input: "e\u0301", expected: "é" }, // Unicode combining character normalized
        { input: "A\u030A", expected: "Å" }, // Another combining character
        { input: "Café\u0301", expected: "Café́" }, // Mix of composed and combining accents
        { input: "multiple\t\n\u00A0whitespace", expected: "multiple whitespace" },
        { input: "\u200ELTR mark", expected: "LTR mark" },           // left-to-right mark
        { input: "\u200FRTR mark", expected: "RTR mark" },           // right-to-left mark
        { input: "\u202Fnarrow no-break space\u202F", expected: "narrow no-break space" }, // narrow no-break spaces
        { input: "\uFEFFBOM at start", expected: "BOM at start" },   // zero-width no-break / BOM
        { input: "Hello\u200BWorld", expected: "HelloWorld" },        // zero-width space
        { input: "A\u200C\u200DJoiners", expected: "AJoiners" },      // zero-width non-joiner + joiner
        { input: "Word\u2060Joiner", expected: "WordJoiner" },       // word joiner

    ];

    // Failing cases for non-string inputs (expected to throw TypeError)
    const failingNonStrings = [
        0,
        1,
        -1,
        42,
        -42,
        3.1415,
        -3.1415,
        true,
        false,
        null,
        undefined,
        BigInt(9007199254740991),
        Symbol("sym"),
        {},
        { key: "value" },
        [],
        [1, 2, 3],
        new Date(),
        new Map(),
        new Set(),
        Promise.resolve("done"),
        () => { },
        function* () { yield 1; },
    ];

    const passingTestCases = passingStrings.map(item => [item.input, item.expected]);
    test.each(passingTestCases)("input: %s, expected: %s", (input, expected) => {
        expect(normalizeString(input)).toBe(expected);
    });

    test.each(failingNonStrings)("to throw Type Error for %s", (input) => {
        expect(() => normalizeString(input as any)).toThrow(TypeError);
    });
});

describe("undefinedToNullDeep", () => {
    // BASIC VALUES
    test("returns null when input is undefined", () => {
        expect(undefinedToNullDeep(undefined)).toBeNull();
    });

    test("returns null as-is", () => {
        expect(undefinedToNullDeep(null)).toBeNull();
    });

    test("returns primitive values unchanged", () => {
        expect(undefinedToNullDeep(42)).toBe(42);
        expect(undefinedToNullDeep("hello")).toBe("hello");
        expect(undefinedToNullDeep(true)).toBe(true);
    });

    // ARRAYS
    test("replaces undefined inside array", () => {
        expect(undefinedToNullDeep([1, undefined, 3])).toEqual([1, null, 3]);
    });

    test("handles deeply nested arrays", () => {
        const input = [1, [2, undefined, [undefined]]];
        const output = undefinedToNullDeep(input);
        expect(output).toEqual([1, [2, null, [null]]]);
    });

    // OBJECTS
    test("replaces undefined inside object", () => {
        const input = { a: 1, b: undefined };
        const output = undefinedToNullDeep(input);
        expect(output).toEqual({ a: 1, b: null });
    });

    test("handles nested objects", () => {
        const input = {
            a: undefined,
            b: { c: undefined, d: 5 },
        };

        const output = undefinedToNullDeep(input);

        expect(output).toEqual({
            a: null,
            b: { c: null, d: 5 },
        });
    });

    // COMPLEX STRUCTURES
    test("handles objects with arrays and nested values", () => {
        const input = {
            list: [1, undefined, { x: undefined, y: 2 }],
            flag: undefined,
        };

        const output = undefinedToNullDeep(input);

        expect(output).toEqual({
            list: [1, null, { x: null, y: 2 }],
            flag: null,
        });
    });

    // IMMUTABILITY
    test("does not mutate the original object", () => {
        const input = { a: undefined, nested: { b: undefined } };
        const copy = structuredClone(input);

        undefinedToNullDeep(input);

        expect(input).toEqual(copy); // unchanged
    });

    // TYPE PRESERVATION
    test("preserves array type when converting undefined", () => {
        const input: Array<number | undefined> = [1, undefined, 3];
        const output = undefinedToNullDeep(input);

        expect(Array.isArray(output)).toBe(true);
        expect(output).toEqual([1, null, 3]);
    });

    // shape preservation
    test("does not create keys that were not present in the original object", () => {
        const input = { b: "x" };
        const output = undefinedToNullDeep(input);

        expect(output).toEqual({ b: "x" });
        expect(output).not.toHaveProperty("a");
    });
});

describe("buildUserAvatarURLs", () => {
    it("returns correct URLs for a normal avatar ID", () => {
        const avatarId = "91cef337aed16e049637b7bdf164e711";
        const [thumb, full] = buildUserAvatarURLs(avatarId);

        expect(thumb).toBe(`https://sleepercdn.com/avatars/thumbs/${avatarId}`);
        expect(full).toBe(`https://sleepercdn.com/avatars/${avatarId}`);
    });

    it("returns a tuple of length 2", () => {
        const result = buildUserAvatarURLs("abc");
        expect(result).toHaveLength(2);
    });

    it("throws an error for empty string avatar ID", () => {
        expect(() => buildUserAvatarURLs("")).toThrowError(
            "You must pass a valid string greater than 0 in length"
        );
    });

    it("supports avatar ID with special characters", () => {
        const avatarId = "a/b+c@d_e";
        const [thumb, full] = buildUserAvatarURLs(avatarId);
        expect(thumb).toBe(`https://sleepercdn.com/avatars/thumbs/${avatarId}`);
        expect(full).toBe(`https://sleepercdn.com/avatars/${avatarId}`);
    });

    it("supports very long avatar IDs", () => {
        const avatarId = "x".repeat(1000);
        const [thumb, full] = buildUserAvatarURLs(avatarId);
        expect(thumb).toBe(`https://sleepercdn.com/avatars/thumbs/${avatarId}`);
        expect(full).toBe(`https://sleepercdn.com/avatars/${avatarId}`);
    });

    it("supports numeric-like string IDs", () => {
        const avatarId = "1234567890";
        const [thumb, full] = buildUserAvatarURLs(avatarId);
        expect(thumb).toBe(`https://sleepercdn.com/avatars/thumbs/${avatarId}`);
        expect(full).toBe(`https://sleepercdn.com/avatars/${avatarId}`);
    });

    it("TypeScript prevents assigning wrong URL type", () => {
        const [thumb, full] = buildUserAvatarURLs("id");

        // @ts-expect-error
        const wrong: ThumbURL = full;

        // @ts-expect-error
        const wrong2: FullURL = thumb;
    });
});