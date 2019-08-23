/*!
Copyright 2019 Ron Buckton

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
 require('foo').implementation or require('foo/implementation') is a spec-compliant JS function,
 that will depend on a receiver (a “this” value) as the spec requires.
 */

import config = require("./config");
import nativeExec = require("./native");
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

const weakMeasurementRegExp = new WeakMap<RegExp, TransformResult<AstRegExp, readonly GroupInfo[]>>();

function exec(this: RegExp, string: string): RegExpExecArray | null {
    return config.mode === "spec-compliant"
        ? execSpecCompliant(this, string)
        : execLazy(this, string);
}

function execLazy(regexp: RegExp, string: string) {
    const index = regexp.lastIndex;
    const result = nativeExec.call(regexp, string);
    if (result === null) return null;

    // For performance reasons, we defer computing the indices until later. This isn't spec compliant,
    // but once we compute the indices we convert the result to a data-property.
    let indicesArray: RegExpExecIndicesArray | undefined;
    Object.defineProperty(result, "indices", {
        enumerable: true,
        configurable: true,
        get() {
            if (indicesArray === undefined) {
                const { measurementRegExp, groupInfos } = getMeasurementRegExp(regexp);
                measurementRegExp.lastIndex = index;
                const measuredResult = nativeExec.call(measurementRegExp, string);
                if (measuredResult === null) throw new TypeError();
                makeDataProperty(result, "indices", indicesArray = makeIndicesArray(measuredResult, groupInfos));
            }
            return indicesArray;
        },
        set(value) {
            makeDataProperty(result, "indices", value);
        }
    });
    return result;
}

function execSpecCompliant(regexp: RegExp, string: string) {
    const { measurementRegExp, groupInfos } = getMeasurementRegExp(regexp);
    measurementRegExp.lastIndex = regexp.lastIndex;

    const measuredResult = nativeExec.call(measurementRegExp, string);
    if (measuredResult === null) return null;

    regexp.lastIndex = measurementRegExp.lastIndex;

    const result = [] as unknown as RegExpExecArray;
    makeDataProperty(result, 0, measuredResult[0]);

    for (const groupInfo of groupInfos) {
        makeDataProperty(result, groupInfo.oldGroupNumber, measuredResult[groupInfo.newGroupNumber]);
    }

    makeDataProperty(result, "index", measuredResult.index);
    makeDataProperty(result, "input", measuredResult.input);
    makeDataProperty(result, "groups", measuredResult.groups);
    makeDataProperty(result, "indices", makeIndicesArray(measuredResult, groupInfos));
    return result;
}

function getMeasurementRegExp(regexp: RegExp) {
    let transformed = weakMeasurementRegExp.get(regexp);
    if (!transformed) {
        transformed = transformMeasurementGroups(parse(`/${regexp.source}/${regexp.flags}`));
        weakMeasurementRegExp.set(regexp, transformed);
    }
    const groupInfos = transformed.getExtra();
    const measurementRegExp = transformed.toRegExp();
    return { measurementRegExp, groupInfos };
}

function makeIndicesArray(measuredResult: RegExpExecArray, groupInfos: readonly GroupInfo[]) {
    const matchStart = measuredResult.index;
    const matchEnd = matchStart + measuredResult[0].length;
    const hasGroups = !!measuredResult.groups;
    const indicesArray = [] as RegExpExecIndicesArray;
    const groups: Record<string, [number, number]> | undefined = hasGroups ? Object.create(null) : undefined;
    makeDataProperty(indicesArray, 0, [matchStart, matchEnd]);

    for (const groupInfo of groupInfos) {
        let indices: [number, number] | undefined;
        if (measuredResult[groupInfo.newGroupNumber] !== undefined) {
            let startIndex = matchStart;
            if (groupInfo.measurementGroups) {
                for (const measurementGroup of groupInfo.measurementGroups) {
                    startIndex += measuredResult[measurementGroup].length;
                }
            }

            const endIndex = startIndex + measuredResult[groupInfo.newGroupNumber].length;
            indices = [startIndex, endIndex];
        }
        makeDataProperty(indicesArray, groupInfo.oldGroupNumber, indices!);
        if (groups && groupInfo.groupName !== undefined) {
            makeDataProperty(groups, groupInfo.groupName, indices!);
        }
    }

    makeDataProperty(indicesArray, "groups", groups);
    return indicesArray;
}

function makeDataProperty<T, K extends keyof T>(result: T, key: K, value: T[K]) {
    const existingDesc = Object.getOwnPropertyDescriptor(result, key);
    if (existingDesc ? existingDesc.configurable : Object.isExtensible(result)) {
        const newDesc = {
            enumerable: existingDesc ? existingDesc.enumerable : true,
            configurable: existingDesc ? existingDesc.configurable : true,
            writable: true,
            value
        };
        Object.defineProperty(result, key, newDesc);
    }
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