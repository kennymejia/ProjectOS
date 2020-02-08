/**
 * This interface in required to be implemented by all hardware that wishes to be assigned an IRQ.
 */

import {Queue} from "../imp/Queue"

export interface Interrupt {
    irq: number;
    priority : Interrupt.Priority;
    name: String;                       // reference name for harware eg: keyboard, disk, etc.
    inputBuffer: Queue;                // Device controller buffer that contains input for the device
    outputBuffer: Queue;               // Device controller buffer that contains output from the device
}

export namespace Interrupt {
    export const enum Priority {
        NONE = -1,
        REGULAR = 0,
        HIGH = 1,
        VERY_HIGH = 2
    }
}

