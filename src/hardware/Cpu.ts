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
import { VirtualKeyboard } from "./VirtualKeyboard";
import { pipeline } from "stream";
import { MemoryManagementUnit } from "./MemoryManagementUnit";

export class Cpu extends Hardware implements ClockListener{

    constructor(mmu: MemoryManagementUnit) {
        super(0, "CPU");
        this.log("CPU Created");
        this.pc = 0x0000;
        this.ir = 0x00;
        this.acc = 0x00;
        this.xReg = 0x00;
        this.yReg = 0x00;
        this.zFlag = 0x00;
        this.interrupt = null;
        this.mode = Cpu.Mode.KERNEL;
        this.isExecuting = false;
        this.clockCount = 0;
        this.pipelineStep = "fetch";
        this.mmu = mmu;
        this.counter = 0;
    }

    public pc: number;
    public ir: number;
    public acc: number;
    public xReg: number;
    public yReg: number;
    public zFlag: number;
    public interrupt: Interrupt;
    public mode: Cpu.Mode;
    public isExecuting: boolean;
    public clockCount: number;
    public pipelineStep: string;
    public mmu: MemoryManagementUnit;
    public counter: number;

    public reset(): void {
        this.pc = 0x0000;
        this.ir = 0x00;
        this.acc = 0x00;
        this.xReg = 0x00;
        this.yReg = 0x00;
        this.zFlag = 0x00;
        this.interrupt = null;
        this.mode = Cpu.Mode.KERNEL;
        this.isExecuting = false;
        this.clockCount = 0;
        this.pipelineStep = "";
        this.counter = 0;
    }


    /**
     * Send the CPU an interrupt here!
     * @param interrupt
     */
    public setInterrupt(interrupt: Interrupt): void {

        this.interrupt = interrupt;
    }

    /**
     * CPU acts on the clock pulse, implementation goes here.
     */
    public pulse(): void {
        
        this.clockCount++;
        this.log("CPU Received Clock Pulse" + " - " + "Clock Count: " + this.clockCount + " - " + "Mode: " + this.mode);

        this.cpuLog(
            "CPU State  | " + 
            " PC: " + this.pc.toString(16).toLocaleUpperCase().padStart(6,"0x0000") +
            "  IR: " + this.ir.toString(16).toLocaleUpperCase().padStart(4,"0x00") +
            "  ACC: " + this.acc.toString(16).toLocaleUpperCase().padStart(4,"0x00") +
            "  xReg: " + this.xReg.toString(16).toLocaleUpperCase().padStart(4,"0x00") +
            "  yReg: " + this.yReg.toString(16).toLocaleUpperCase().padStart(4,"0x00") +
            "  zFlag: " + this.zFlag.toString(16).toLocaleUpperCase().padStart(4,"0x00") +
            "  ClockCount: " + this.clockCount
        );

        // the actual pipeline where FDEW and check for interrupts after each cycle
        switch (this.pipelineStep) {

            case "fetch":
                //this.cpuLog("Fetching: ");
                this.fetch();
                break;
            
            case "decode":
                //this.cpuLog("Decoding: ");
                this.decode();
                break;

            case "execute":
                //this.cpuLog("Executing: ")
                this.execute();
                break;

            case "writeBack":
                //this.cpuLog("WriteBack: ")
                this.writeBack();
                break;
            
            default:
                this.cpuLog("Something Went Wrong, Pipeline Not Performing FDEW");
                break;
        }
        
        this.interruptCheck();
    }

    /**
     * Handles the fetch portion of the cycle
     * Checks PC, retrieves instruction form Memory
     */
    private fetch(): void {

        // sending the mmu a 16 bit address and the mmu sets it to the MAR
        this.mmu.settingMar(this.pc);

        // incrementing the PC after fetching the instruction
        this.pc++;

        // loading the IR with whatever instruction is in the MDR
        this.ir = this.mmu.memoryRead();

        // seeting the tracker to decode or the next step in the pipeline
        this.pipelineStep = "decode";
    }

    /**
     * Handles decode of instruction based on 6502 instruction set
     */
    private decode(): void {

        switch (this.ir) {

            case 0xA9:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.pipelineStep = "execute";
                break;

            case 0xAD:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$AD();
                break;
            
            case 0x8D:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$8D();
                break;

            default:
                this.cpuLog("Nothing To Decode, Lets Execute");
                this.pipelineStep = "execute"
                break;
        }
    }

    /**
     * Executes the current instruction in the pipline
     */
    private execute(): void {

        switch (this.ir) {

            case 0xA9:
                this.$A9(this.mmu.memoryRead());
                break;

            case 0xAD:
                this.$AD();
                break;

            default:
                this.cpuLog("Nothing To Execute, Lets Check For Interrupts");
                this.pipelineStep = "fetch"
                break;
        }

    }

    private writeBack(): void {

        switch(this.ir) {
            
            case 0x8D:
                this.mmu.memoryWrite();
                break;

            default:
                this.cpuLog("Nothing To WriteBack");
                break;
            
        }
    }

    private interruptCheck(): void {

        if (this.interrupt != null && this.interrupt.name == "VKB" && this.interrupt.outputBuffer.isEmpty()!=true) {
            
            this.log("CPU Acting On Interrupt - IRQ: " + this.interrupt.irq + " From: " + this.interrupt.name);
            this.log("CPU Sees: " + this.interrupt.outputBuffer.printQueue());
            this.interrupt.outputBuffer.dequeue();
            
        }

    }

    // load the accumulator with a consrant
    private $A9 (constant:number): void {
        this.acc = constant;
        this.pipelineStep = "fetch";
    }

    // load the accumulator from memory
    private $AD (): void {
        
        if (this.counter == 0) {

            // getting an 8 bit address so we call our little endian function
            // incrementing our tracker, tells us whether we are decoding again or executing
            // we are decoding again in this case since we only have half of an address
            this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "decode";
            this.counter++;
        }
        else if (this.counter == 1) {

            // executing now that we have the full address
            this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "execute";
            this.counter++;
        }
        else {

            // coming back in and executing the write to memory
            this.acc = this.mmu.memoryRead();
            this.pipelineStep = "fetch";
            this.counter = 0;
        }
    }

    // store the accumulator in memory
    private $8D (): void {

        if (this.counter == 0) {

            // getting an 8 bit address so we call our little endian function
            // incrementing our tracker, tells us whether we are decoding again or executing
            // we are decoding again in this case since we only have half of an address
            this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "decode";
            this.counter++;
        }
        else if (this.counter == 1) {

            // executing now that we have the full address
            this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "execute";
            this.counter++;
        }
        else {

            this.mmu.settingMDR(this.acc);
            this.pipelineStep = "writeBack";
            this.counter = 0;
        }
    }

    // add with carry, result stored in accumulator
    private $6D (): void {
        this.cpuLog("");
    }

    // load the X register with a constant
    private $A2 (): void {
        this.cpuLog("");
    }

    // load the X register from memory
    private $AE(): void {
        this.cpuLog("");
    }

    // load the Y register with a constant
    private $A0 (): void {
        this.cpuLog("");
    }   

    // load the Y register from memory
    private $AC (): void {
        this.cpuLog("");
    }

    // no operation
    private $EA (): void {
        this.cpuLog("");
    }

    // break, which is a system call
    private $00 (): void {
        this.cpuLog("");
    }

    // compare a byte in mem to X reg, sets Z flag if equal
    private $EC (): void {
        this.cpuLog("");
    }

    // branch n bytes if Z flag = 0
    private $D0 (): void {
        this.cpuLog("");
    }

    // increment the value of a byte
    private $EE (): void {
        this.cpuLog("");
    }

    // system call
    private $FF (): void {
        this.cpuLog("");
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