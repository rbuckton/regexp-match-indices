export interface RegExpExecArray extends globalThis.RegExpExecArray {
    readonly indices: RegExpExecIndicesArray;
}

export interface RegExpExecIndicesArray extends Array<[number, number]> {
    groups?: { [key: string]: [number, number] };
}
