/* ------------
     Memory.ts
        TODO: BG
     ...
     ------------ */

import {Hardware} from "./Hardware";
import {ClockListener} from "./imp/ClockListener";

export class Memory extends Hardware implements ClockListener{

    constructor() {
        super(0, "RAM");

        this.mar = 0;
        this.mdr = 0;
        this.isExecuting = false;

    }

    public mar: number;
    public mdr: number;
    public isExecuting: boolean;

    public reset(): void {
        this.mar = 0;
        this.mdr = 0;
        this.isExecuting = false;
    }

    public pulse(): void {

    }
}
