/*
 require('foo').implementation or require('foo/implementation') is a spec-compliant JS function,
 that will depend on a receiver (a “this” value) as the spec requires.
 */

import { RegExpExecArray, RegExpExecIndicesArray } from "./types";
import {
    AstNode,
    AstRegExp,
    CapturingGroup,
    Expression
} from "regexp-tree/ast";
import {
    parse,
    transform,
    TransformResult,
    TransformHandlers,
    traverse,
    TraversalCallbacks,
    TraversalHandlers
} from "regexp-tree";

const nativeExec = RegExp.prototype.exec;
const weakMeasurementRegExp = new WeakMap<RegExp, TransformResult<AstRegExp, readonly GroupInfo[]>>();

function exec(this: RegExp, string: string): RegExpExecArray | null {
    const source = this.source;
    const flags = this.flags;
    const lastIndex = this.lastIndex;
    const result = nativeExec.call(this, string);
    if (result === null) return null;

    const hasGroups = !!result.groups;
    const matchStart = result.index;
    const matchEnd = matchStart + result[0].length;

    // for performance reasons, we defer getting the indices until later
    let indicesArray: RegExpExecIndicesArray | undefined;
    Object.defineProperty(result, "indices", {
        enumerable: true,
        configurable: true,
        get: () => {
            if (indicesArray !== undefined) {
                return indicesArray;
            }

            let transformed = weakMeasurementRegExp.get(this);
            if (!transformed) {
                transformed = transformMeasurementGroups(parse(`/${source}/${flags}`));
                weakMeasurementRegExp.set(this, transformed);
            }

            const groupInfos = transformed.getExtra();
            const newRegExp = transformed.toRegExp();
            newRegExp.lastIndex = lastIndex;

            const measuredResult = nativeExec.call(newRegExp, string);
            if (measuredResult === null) throw new TypeError();

            const newResult = [] as RegExpExecIndicesArray;
            const groups: Record<string, [number, number]> | undefined = hasGroups ? {} : undefined;
            newResult.groups = groups;
            newResult[0] = [matchStart, matchEnd];

            for (const groupInfo of groupInfos) {
                let startIndex = matchStart;
                if (groupInfo.measurementGroups) {
                    for (const measurementGroup of groupInfo.measurementGroups) {
                        startIndex += measuredResult[measurementGroup].length;
                    }
                }

                const endIndex = startIndex + measuredResult[groupInfo.newGroupNumber].length;
                const indices: [number, number] = [startIndex, endIndex];
                newResult[groupInfo.oldGroupNumber] = indices;
                if (groups && groupInfo.groupName !== undefined) {
                    groups[groupInfo.groupName] = indices;
                }
            }

            return indicesArray = newResult;
        }
    });

    return result as RegExpExecArray;
}

interface GroupInfo {
    readonly oldGroupNumber: number;
    readonly newGroupNumber: number;
    readonly measurementGroups: ReadonlyArray<number> | undefined;
    readonly groupName?: string;
}

let groupRenumbers: GroupInfo[] | undefined;
let hasBackreferences = false;
let nodesContainingCapturingGroup = new Set<AstNode>();
let containsCapturingGroupStack: boolean[] = [];
let containsCapturingGroup = false;
let nextNewGroupNumber = 1;
let measurementGroupStack: CapturingGroup[][] = [];
let measurementGroupsForGroup = new Map<CapturingGroup, CapturingGroup[]>();
let newGroupNumberForGroup = new Map<number, number>();

const handlers: TransformHandlers<AstRegExp> = {
    init() {
        hasBackreferences = false;
        nodesContainingCapturingGroup.clear();
        containsCapturingGroupStack.length = 0;
        containsCapturingGroup = false;
        nextNewGroupNumber = 1;
        measurementGroupStack.length = 0;
        measurementGroupsForGroup.clear();
        newGroupNumberForGroup.clear();
        groupRenumbers = [];
    },
    RegExp(path) {
        traverse(path.node, visitor);
        if (nodesContainingCapturingGroup.size > 0) {
            transform(path.node, builder);
            transform(path.node, groupRenumberer);
            if (hasBackreferences) {
                transform(path.node, backreferenceRenumberer);
            }
        }
        return false;
    }
};

const nodeCallbacks: TraversalCallbacks = {
    pre(path) {
        containsCapturingGroupStack.push(containsCapturingGroup);
        containsCapturingGroup = path.node.type === "Group" && path.node.capturing;
    },
    post(path) {
        if (containsCapturingGroup) {
            nodesContainingCapturingGroup.add(path.node);
        }
        containsCapturingGroup = containsCapturingGroupStack.pop() || containsCapturingGroup;
    }
};

const visitor: TraversalHandlers = {
    Alternative: nodeCallbacks,
    Disjunction: nodeCallbacks,
    Assertion: nodeCallbacks,
    Group: nodeCallbacks,
    Repetition: nodeCallbacks,
    Backreference(path) { hasBackreferences = true; }
};

const builder: TransformHandlers = {
    Alternative(path) {
        if (nodesContainingCapturingGroup.has(path.node)) {
            // aa(b)c       -> (aa)(b)c
            // aa(b)c(d)    -> (aa)(b)(c)(d)
            // aa(b)+c(d)   -> (aa)((b)+)(c)(d);
            let lastMeasurementIndex = 0;
            let pendingTerms: Expression[] = [];
            const measurementGroups: CapturingGroup[] = [];
            const terms: Expression[] = [];
            for (let i = 0; i < path.node.expressions.length; i++) {
                const term = path.node.expressions[i];
                if (nodesContainingCapturingGroup.has(term)) {
                    if (i > lastMeasurementIndex) {
                        const measurementGroup: CapturingGroup = {
                            type: "Group",
                            capturing: true,
                            number: -1,
                            expression:
                                pendingTerms.length > 1 ? { type: "Alternative", expressions: pendingTerms } :
                                pendingTerms.length === 1 ? pendingTerms[0] :
                                null
                        };
                        terms.push(measurementGroup);
                        measurementGroups.push(measurementGroup);
                        lastMeasurementIndex = i;
                        pendingTerms = [];
                    }
                    measurementGroupStack.push(measurementGroups);
                    transform(term, builder);
                    measurementGroupStack.pop();
                    pendingTerms.push(term);
                    continue;
                }

                pendingTerms.push(term);
            }
            path.update({ expressions: terms.concat(pendingTerms) });
        }
        return false;
    },
    Group(path) {
        if (!path.node.capturing) return;
        measurementGroupsForGroup.set(path.node, getMeasurementGroups());
    }
};

const groupRenumberer: TransformHandlers = {
    Group(path) {
        if (!groupRenumbers) throw new Error("Not initialized.");
        if (!path.node.capturing) return;
        const oldGroupNumber = path.node.number;
        const newGroupNumber = nextNewGroupNumber++;
        const measurementGroups = measurementGroupsForGroup.get(path.node);
        if (oldGroupNumber !== -1) {
            groupRenumbers.push({
                oldGroupNumber,
                newGroupNumber,
                measurementGroups: measurementGroups && measurementGroups.map(group => group.number),
                groupName: path.node.name
            });
            newGroupNumberForGroup.set(oldGroupNumber, newGroupNumber);
        }
        path.update({ number: newGroupNumber });
    }
};

const backreferenceRenumberer: TransformHandlers = {
    Backreference(path) {
        const newGroupNumber = newGroupNumberForGroup.get(path.node.number);
        if (newGroupNumber) {
            if (path.node.kind === "number") {
                path.update({
                    number: newGroupNumber,
                    reference: newGroupNumber
                });
            }
            else {
                path.update({
                    number: newGroupNumber
                });
            }
        }
    }
};

function getMeasurementGroups() {
    const measurementGroups: CapturingGroup[] = [];
    for (const array of measurementGroupStack) {
        for (const item of array) {
            measurementGroups.push(item);
        }
    }
    return measurementGroups;
}

function transformMeasurementGroups(ast: AstRegExp) {
    const result = transform(ast, handlers);
    return new TransformResult(result.getAST(), groupRenumbers as readonly GroupInfo[]);
}

export = exec;