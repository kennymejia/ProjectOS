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
import {Ascii} from "./imp/Ascii";
import { System } from "../System";

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
        this.temp = 0x00;
        this.ascii = new Ascii();
        this.stop = false;
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
    public temp: number;
    public ascii: Ascii;
    public stop: boolean;

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
        this.temp = 0x00;
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
                this.cpuLog("Something Went Wrong, Or The Program Was Automatically Terminated");
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

        // setting the tracker to decode
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

            case 0x6D:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$6D();
                break;

            case 0xA2:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.pipelineStep = "execute";
                break;

            case 0xAE:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$AE();
                break;

            case 0xA0:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.pipelineStep = "execute";
                break;

            case 0xAC:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$AC();
                break;

            case 0xEA:
                this.pipelineStep = "fetch";
                break;

            case 0x00:
                this.$00();
                break;

            case 0xEC:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$EC();
                break;

            case 0xD0:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.pipelineStep = "execute";
                break;

            case 0xEE:
                this.mmu.settingMar(this.pc);
                this.pc++;
                this.$EE();
                break;

            case 0xFF:
                this.mmu.settingMar(this.pc);
                this.$FF();
                break;
            
            default:
                this.cpuLog("Nothing To Decode");
                this.pipelineStep = "fetch"
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

            case 0x8D:
                this.$8D();
                break;

            case 0x6D:
                this.$6D();
                break;

            case 0xA2:
                this.$A2(this.mmu.memoryRead());
                break;

            case 0xAE:
                this.$AE();
                break;

            case 0xA0:
                this.$A0(this.mmu.memoryRead());
                break;

            case 0xAC:
                this.$AC();
                break;

            case 0xEA:
                this.$EA();
                break;

            case 0x00:
                break;

            case 0xEC:
                this.$EC();
                break;

            case 0xD0:
                this.$D0();
                break;

            case 0xEE:
                this.$EE();
                break;

            case 0xFF:
                this.$FF();
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
                this.pipelineStep = "fetch";
                break;

            case 0xEE:
                this.mmu.memoryWrite();
                this.pipelineStep = "fetch";
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

    // load the accumulator with a constant
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

            // coming back in and executing the read from memory
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

            // the accumulator being placed in the MDR
            this.mmu.settingMDR(this.acc);
            this.pipelineStep = "writeBack";
            this.counter = 0;
        }
    }

    // add with carry, result stored in accumulator
    // if time permits going back to add carry flag
    private $6D (): void {
        
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

            // the accumulator being added with the MDR
            this.acc = this.acc + this.mmu.memoryRead();
            this.pipelineStep = "fetch";
            this.counter = 0;
        }
    }

    // load the X register with a constant
    private $A2 (constant: number): void {
        this.xReg = constant;
        this.pipelineStep = "fetch";
    }

    // load the X register from memory
    private $AE(): void {

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

            // coming back in and executing the read from memory
            this.xReg = this.mmu.memoryRead();
            this.pipelineStep = "fetch";
            this.counter = 0;
        }
    }

    // load the Y register with a constant
    private $A0 (constant: number): void {
        this.yReg = constant;
        this.pipelineStep = "fetch";
    }   

    // load the Y register from memory
    private $AC (): void {
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

            // coming back in and executing the read from memory
            this.yReg = this.mmu.memoryRead();
            this.pipelineStep = "fetch";
            this.counter = 0;
        }
    }

    // no operation
    private $EA (): void {
        this.cpuLog("No Operation");
        this.pipelineStep = "fetch";
    }

    // break, which is a system call
    private $00 (): void {

        this.mmu.memoryDump(0x00, this.mmu.instructionSet.length-1);
        // for now stoping the clock 
        this.stopClock();
    }

    // compare a byte in mem to X reg, sets Z flag if equal
    private $EC (): void {
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

            // coming back in and executing the read from memory
            // setting the z flag to the difference between x reg and memory location
            // if its zero then D0 will branch otherwise we wont branch
            this.zFlag = this.mmu.memoryRead() - this.xReg;
            this.cpuLog("Zero Flag Has Been Set")
            this.pipelineStep = "fetch";
            this.counter = 0;
        }
    }

    // branch n bytes if Z flag != 0
    private $D0 (): void {
        
        // if the zFlag is 0 when EC was called then x reg and mem location where equal
        if (this.zFlag != 0) {

            // jumping ahead in the program n locations
            this.cpuLog("Branching Now");
            this.pc = this.pc + this.mmu.memoryRead();
        }
        this.pipelineStep = "fetch";
    }

    // increment the value of a byte
    private $EE (): void {
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

            // coming back in and executing the read from memory
            // using temp as a way to hold the data at the memory location
            this.temp = this.mmu.memoryRead();
            this.temp = this.temp + 1;
            this.mmu.settingMDR(this.temp);
            this.pipelineStep = "writeBack";
            this.counter = 0;
        }
    }

    // system call
    private $FF (): void {
        
        // first part of the function checks to see if we have a 1 or a 2
        if (this.counter == 0) {

            if (this.xReg == 0x01) {

                this.counter = 1;
                this.pipelineStep = "execute";
            }
            else if(this.xReg == 0x02) {

                this.counter = 2;
                this.pipelineStep = "execute";
            }
            else {
                this.counter = 0;
                this.pipelineStep = "fetch";
            }
        }

        // print the integer stored in y reg
        else if (this.counter == 1) {

            process.stdout.write(this.yReg.toString(16).toLocaleUpperCase().padStart(4,"0x00").padEnd(6,", "));
            this.pipelineStep = "fetch";
            this.counter = 0;
        }

        // getting our starting address
        else if (this.counter == 2) {

            // getting an 8 bit address so we call our little endian function
            // incrementing our tracker, tells us whether we are decoding again or executing
            // we are decoding again in this case since we only have half of an address
            this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "execute";
            this.counter = 3;
            this.pc++;
            this.mmu.settingMar(this.pc);
        }
        else if (this.counter == 3) {
            // executing now that we have the full address
            this.temp = this.pc;
            this.pc = this.mmu.littleEndian(this.mmu.memoryRead());
            this.pipelineStep = "execute";
            this.counter = 4;
        }
        else {

            // reading the memory location
            this.yReg = this.mmu.memoryRead();
            
            if (this.yReg == 0x00) {

                // terminate the string output
                this.pc = this.temp;
                this.temp = 0x00;
                this.pipelineStep = "fetch";
                this.counter = 0;
            }
            else {

                // output with our ASCII decoder
                // updating the PC here since we are still in execute step
                process.stdout.write(this.ascii.byteToCharacter(this.yReg));
                this.pc++;
                this.mmu.settingMar(this.pc);
            }
        }
    }

    private stopClock (): void {

        this.stop = true;
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