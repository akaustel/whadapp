
/**
 * Uint8Array to hex string
 */
export function bufferToHex (buffer) {
    return Array
        .from (new Uint8Array (buffer))
        .map (b => b.toString (16).padStart (2, '0'))
        .join ('');
}

export const btoh = bufferToHex;

/**
 * Hex to Uint8Array
 */
export function htob(hex: string) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

/**
 * Strip unused but set keys
 *
 * Undefined, null and empty string values will be stripped
 */
export function stripEmptyKeys(object: object) {
    const stripped = {};

    for (const key in object) {
        if (
            typeof object[key] === 'undefined' ||
            object[key] === null ||
            object[key] === ''
        ) {
            continue;
        }
        stripped[key] = object[key];
    }

    return stripped;
}

export interface License {
    [license: string]: string;
}

export interface Share {
    public?: License;
    groups?: { [key: string]: License };
    users?: { [key: string]: License };
}

export interface Document {
    parent?: string;
    uid: Uint8Array;
    time: Number;
    type: string;
    content: string | object;
    hash?: Uint8Array;
    data?: Uint8Array;
    signed?: {
      data: Uint8Array, signatures: any
    };
    share?: {
      public?: any;
      groups?: {};
      users?: {};
    };
  }
