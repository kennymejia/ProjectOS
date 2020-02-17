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
        this.mar = 0x0000;
        this.mdr = 0x00;
        this.memory = new Array (65536);
        this.isExecuting = false;
        this.reset();
        this.log("Memory Created - Addressable Space: " + this.memory.length);
    }

    private mar: number;
    private mdr: number;
    private memory: number[];
    private isExecuting: boolean;

    public reset(): void {
        this.mar = 0x0000;
        this.mdr = 0x00;
        this.isExecuting = false;

        for (let address of this.memory) {
            this.memory[address] = 0x00;
        }

    }

    public pulse(): void {

        this.log("Received Clock Pulse");
    }

    public read (): void {
        
        this.mdr = this.memory[this.mar];
        
        this.log("Address Received Reading Data")
    }

    public write (): void {

        this.memory[this.mar] = this.mdr;

        this.log("Data Received Setting Now")
    }

    public getMAR (): number {
        return this.mar;
    }

    public getMDR (): number {
        return this.mdr;
    }

    public setMAR (mar: number) {
        this.mar = mar;
    }

    public setMDR (mdr: number) {
        this.mdr = mdr;
    }

    public getMemory (): number[] {

        return this.memory;
    }
}
