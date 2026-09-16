import {
    AlertCircle,
    Check,
    CheckCheck,
    ChevronRight,
    ChevronsUpDown,
    ListX,
    Minus,
    WandSparkles,
} from "lucide-react";
import { useState } from "react";
import type { StructureField } from "../utils/parse-structure";

interface StructureViewProps {
    fields: StructureField[];
    error: { message: string; line: number } | null;
    checkedPaths: ReadonlySet<string>;
    onCheckedPathsChange: (paths: ReadonlySet<string>) => void;
    onConvert: () => void;
}

interface TreeNode {
    path: string;
    label: string;
    value?: string;
    isArray?: boolean;
    isObject?: boolean;
    children: TreeNode[];
}

interface TreeRowProps {
    node: TreeNode;
    depth: number;
    collapsed: Set<string>;
    checkedFields: ReadonlySet<string>;
    onToggleExpanded: (path: string) => void;
    onToggleChecked: (node: TreeNode) => void;
}

const buildTree = (fields: StructureField[]) => {
    const roots: TreeNode[] = [];

    fields.forEach((field) => {
        const parts = field.path ? field.path.split(".") : ["value"];
        let nodes = roots;
        let parentPath = "";

        parts.forEach((part, index) => {
            const path = parentPath ? `${parentPath}.${part}` : part;
            let node = nodes.find((item) => item.path === path);
            if (!node) {
                node = { path, label: part, children: [] };
                nodes.push(node);
            }

            if (index === parts.length - 1) {
                node.value = field.value;
            }

            parentPath = path;
            nodes = node.children;
        });
    });

    const markArrays = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
            node.isArray =
                node.value === "[]" ||
                (node.children.length > 0 &&
                    node.children.every((child) => /^\d+$/.test(child.label)));
            node.isObject = node.children.length > 0 && !node.isArray;
            markArrays(node.children);
        });
    };

    markArrays(roots);

    return roots;
};

const getDescendantPaths = (node: TreeNode): string[] => [
    node.path,
    ...node.children.flatMap(getDescendantPaths),
];

const getBranchPaths = (nodes: TreeNode[]): string[] =>
    nodes.flatMap((node) =>
        node.children.length > 0
            ? [node.path, ...getBranchPaths(node.children)]
            : [],
    );

const TreeRow = ({
    node,
    depth,
    collapsed,
    checkedFields,
    onToggleExpanded,
    onToggleChecked,
}: TreeRowProps) => {
    const descendantPaths = getDescendantPaths(node);
    const checkedCount = descendantPaths.filter((path) =>
        checkedFields.has(path),
    ).length;
    const checked = checkedCount === descendantPaths.length;
    const partiallyChecked = checkedCount > 0 && !checked;
    const hasChildren = node.children.length > 0;
    const expanded = !collapsed.has(node.path);

    return (
        <div className="min-w-full">
            <div
            className="flex min-h-9 min-w-full items-center gap-1 rounded-md px-2 transition-colors duration-200 hover:bg-zinc-800/70"
                style={{ paddingLeft: `${depth * 1.25}rem` }}>
                {hasChildren ? (
                    <button
                        type="button"
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`}
                        aria-expanded={expanded}
                        onClick={() => onToggleExpanded(node.path)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200">
                        <ChevronRight
                            size={15}
                            className={`transition-transform duration-200 ease-out ${
                                expanded ? "rotate-90" : "rotate-0"
                            }`}
                        />
                    </button>
                ) : (
                    <span className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <div
                    role="checkbox"
                    aria-checked={partiallyChecked ? "mixed" : checked}
                    tabIndex={-1}
                    onClick={() => onToggleChecked(node)}
                    className="tree-node-content flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1">
                    <span
                        className={`pointer-events-none flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked || partiallyChecked
                                ? "border-blue-500"
                                : "border-zinc-600"
                        } ${checked ? "bg-blue-600" : "bg-transparent"}`}>
                        {checked && <Check size={12} />}
                        {partiallyChecked && <Minus size={12} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-1">
                        <span className="shrink-0 text-sm text-zinc-200">
                            {node.label}:
                        </span>
                        {node.isArray && (
                            <span className="shrink-0 rounded border border-emerald-500/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                                array
                            </span>
                        )}
                        {node.isObject && (
                            <span className="shrink-0 rounded border border-sky-500/50 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                                object
                            </span>
                        )}
                        {node.value !== undefined && (
                            <span className="tree-node-value min-w-0 flex-1 basis-0 wrap-break-word rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-1 text-xs text-zinc-500">
                                {`${node.value}`}
                            </span>
                        )}
                    </span>
                </div>
            </div>
            {hasChildren && (
                <div
                    aria-hidden={!expanded}
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                        expanded
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                    }`}>
                    <div className="min-h-0 min-w-full space-y-1 overflow-hidden pt-1">
                        {node.children.map((child) => (
                            <TreeRow
                                key={child.path}
                                node={child}
                                depth={depth + 1}
                                collapsed={collapsed}
                                checkedFields={checkedFields}
                                onToggleExpanded={onToggleExpanded}
                                onToggleChecked={onToggleChecked}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StructureView = ({
    fields,
    error,
    checkedPaths,
    onCheckedPathsChange,
    onConvert,
}: StructureViewProps) => {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const tree = buildTree(fields);
    const allPaths = tree.flatMap(getDescendantPaths);
    const branchPaths = getBranchPaths(tree);
    const checkedFields = checkedPaths;
    const allExpanded =
        branchPaths.length > 0 &&
        branchPaths.every((path) => !collapsed.has(path));

    const toggleExpanded = (path: string) => {
        setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const toggleChecked = (node: TreeNode) => {
        const paths = getDescendantPaths(node);
        const next = new Set(checkedFields);
        const shouldCheck = paths.some((path) => !next.has(path));

        paths.forEach((path) => {
            if (shouldCheck) {
                next.add(path);
            } else {
                next.delete(path);
            }
        });
        onCheckedPathsChange(next);
    };

    const setAllChecked = (checked: boolean) => {
        onCheckedPathsChange(checked ? new Set(allPaths) : new Set());
    };

    const toggleAllExpanded = () => {
        const shouldExpand = branchPaths.some((path) => collapsed.has(path));
        setCollapsed(shouldExpand ? new Set() : new Set(branchPaths));
    };

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-6">
                <div className="flex max-w-sm items-center gap-3 rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200">
                    <AlertCircle size={20} className="shrink-0" />
                    <span>
                        {error.message} on line {error.line}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full min-w-0 overflow-x-auto overflow-y-auto [overflow-anchor:none] bg-zinc-900 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="mr-auto flex items-center gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                        Structure
                    </h2>
                    <button
                        type="button"
                        onClick={onConvert}
                        className="flex h-8 items-center gap-1 rounded border border-blue-500/60 px-2 text-xs text-blue-300 transition-colors hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <WandSparkles size={14} />
                        Convert
                    </button>
                </div>
                <button
                    type="button"
                    onClick={toggleAllExpanded}
                    disabled={branchPaths.length === 0}
                    className="flex h-8 items-center gap-1 rounded border border-zinc-700 px-2 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronsUpDown size={14} />
                    {allExpanded ? "Collapse all" : "Expand all"}
                </button>
                <button
                    type="button"
                    onClick={() => setAllChecked(true)}
                    disabled={allPaths.length === 0}
                    className="flex h-8 items-center gap-1 rounded border border-zinc-700 px-2 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                    <CheckCheck size={14} />
                    Select all
                </button>
                <button
                    type="button"
                    onClick={() => setAllChecked(false)}
                    disabled={allPaths.length === 0}
                    className="flex h-8 items-center gap-1 rounded border border-zinc-700 px-2 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
                    <ListX size={14} />
                    Clear all
                </button>
            </div>
            {tree.length === 0 ? (
                <p className="text-sm text-zinc-500">No fields found</p>
            ) : (
                <div className="min-w-full space-y-1">
                    {tree.map((node) => (
                        <TreeRow
                            key={node.path}
                            node={node}
                            depth={0}
                            collapsed={collapsed}
                            checkedFields={checkedFields}
                            onToggleExpanded={toggleExpanded}
                            onToggleChecked={toggleChecked}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StructureView;