/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5

     BG: I am augmenting the original CPU to be function inclusive and to have a basic fetch - decode - execute
        3-stage pipeline.  This should be fun.

     Plan for Decoding:
        Based on the Cpu.Mode enum setting, the CPU will either live in a fantasy world where it is not used (kernel,
        fudge) Or actually used just like a real processor (user).

        This is the initial plan because otherwise I would need to write a compiler, or write the entire OS kernel and
        supporting user space applications like the shell in 6502 assembler which is cool but I only have a week before
        the semester starts.

        So this trade off means that the 'CPU' will not actually be running when the Kernel is in charge or a
        application given 'fudge' mode privilege.  When the CPU should be in kernel mode, it will *not* be pulling
        opcodes from memory and decoding, the kernel TypeScript code will just be running directly. Anytime it is
        supposed to be in user mode but running an application I do not want to write in 6502 assembler it will be in
        a mix of user and kernel mode. Kernel mode because it will not actually be getting opcodes from memory and
        decoding them, and user mode because it will lack privileges of kernel mode.  Hence the name, fudge mode (this
        is a teaching tool after all).  But when switched into user mode it will pull opcodes from memory and decode
        them just like a real CPU.  This means that all applications in user space need to written or eventually
        compiled to compatible 6502 opcodes in the correct endian format. TODO:  More to come on this soon.
     ------------ */


import {Hardware} from "./Hardware";
import {ClockListener} from "./imp/ClockListener";
import {Interrupt} from "./imp/Interrupt";
import { cpus } from "os";

export class Cpu extends Hardware implements ClockListener{

    constructor() {
        super(0, "CPU");
        this.log("CPU Created");
        this.pc = 0;
        this.acc = 0;
        this.xReg = 0;
        this.yReg = 0;
        this.zFlag = 0;
        this.interrupt = null;
        this.mode = Cpu.Mode.KERNEL;
        this.isExecuting = false;
        this.clockCount = 0;

    }

    public pc: number;
    public acc: number;
    public xReg: number;
    public yReg: number;
    public zFlag: number;
    public interrupt: Interrupt;
    public mode: Cpu.Mode;
    public isExecuting: boolean;
    public clockCount: number;

    public reset(): void {
        this.pc = 0;
        this.acc = 0;
        this.xReg = 0;
        this.yReg = 0;
        this.zFlag = 0;
        this.interrupt = null;
        this.mode = Cpu.Mode.KERNEL;
        this.isExecuting = false;
        this.clockCount = 0;
    }


    /**
     * Send the CPU an interrupt here!
     * @param interrupt
     * 
     * 
     */
    public setInterrupt(interrupt: Interrupt): void {

        this.interrupt = interrupt;
        
        // interrupt is from the keyboard so we deal with it a certain way
        // for now output is the length of the queue and what is in the queue
        if (interrupt.name == "VKB") {
            
            this.log("Interrupts Remaining In the CPU Queue: " + interrupt.outputBuffer.length);
        
            var queueOutput = "";
            for(var index = 0; index < interrupt.outputBuffer.length; index++) {

                queueOutput = queueOutput + "[" + interrupt.outputBuffer[index] + "]" + " ";
            }

            this.log("Queue: " + queueOutput);

            //interrupt.outputBuffer = interrupt.outputBuffer.slice(0,interrupt.outputBuffer.length-2);
        }

    }

    /**
     * CPU acts on the clock pulse, implementation goes here.
     */
    public pulse(): void {
        this.clockCount++;
        this.log("Received Clock Pulse" + " - " + "Clock Count: " +this.clockCount + " - " + "Mode: " + this.mode);
    }

    /**
     * Handles the fetch portion of the cycle
     * Checks PC, retrieves instruction form Memory
     */
    private fetch(): void {

    }

    /**
     * Handles decode of instruction based on 6502 instruction set
     */
    private decode(): void {

    }

    /**
     * Executes the current instruction in the pipline
     */
    private execute(): void {

    }
    
}


export namespace Cpu {
    /*
        KERNEL = CPU not decoding opcodes, emulating protected mode
        USER = CPU running decoding opcodes and running applications in userspace
        FUDGE = CPU not decoding opcodes, not emulating protected mode
     */
    export enum Mode {
        KERNEL, USER, FUDGE
    }
}
