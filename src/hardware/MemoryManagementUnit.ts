import {Hardware} from "./Hardware";
import { Cpu } from "./Cpu";
import { Memory } from "./Memory";
import { start } from "repl";

export class MemoryManagementUnit extends Hardware {

    constructor(cpu: Cpu, memory: Memory) {

        super(0, "MMU");
        this.log("Memory Management Unit Created");

        this.cpu = cpu;
        this.memory = memory;
        this.endianArray = [];

        // FLASHING MEMORY GOES HERE ?
        let instructionSet = [
            0xA9, 
            0x0D, 
            0xA9, 
            0x1D, 
            0xA9, 
            0x2D, 
            0xA9, 
            0x3F, 
            0xA9, 
            0xFF, 
            0x00
        ];

        for (let instruction = 0x0000; instruction < instructionSet.length; instruction++) {

            this.writeImmediate(instruction, instructionSet[instruction]);
        }

        this.memoryDump(0x0000,0x000A);
    }

    // MMU knows about both the CPU and the Memory
    private cpu: Cpu;
    private memory: Memory;

    // Used to manipulate bytes for Little Endian Format Storage
    private endianArray = [];

    public isExecuting: boolean = false;

    public init (): void {

        this.isExecuting = false;
    }

    // receiving a 16 bit address from the program counter
    public settingMar (address16Bit): void {

        this.memory.setMAR(address16Bit);
    }

    // receiving one byte and formatting it into a little endian address
    // FOR STORAGE ONLY!!!
    public littleEndian (address8Bit): void {

        if (this.endianArray.length == 0) {

            let tempArray = Array.from(address8Bit);

            // NOT SURE IF THIS WILL WORK MAY HAVE TO REFORMAT

            this.endianArray[2] = tempArray[0];
            this.endianArray[3] = tempArray[1];
        }
        else {

            let tempArray = Array.from(address8Bit);
            this.endianArray[0] = tempArray[0];
            this.endianArray[1] = tempArray[1];

            let address16Bit = +this.endianArray.toString();

            this.memory.setMAR(address16Bit);
    
            this.endianArray = [];
        }
    }

    // no register interaction
    // calling read function since registers already set
    public memoryRead (): void {

        this.memory.read;
    }

    // no register interaction
    // calling write function since memory already set
    public memoryWrite (): void {

        this.memory.write;
    }

    // writting a program immediately into memory
    public writeImmediate (address: number, data: number): void {

        this.memory.setMAR(address);
        this.memory.setMDR(data);
        this.memory.write();
    }

    public memoryDump (startAddress: number, endAddress: number) {

        let memoryDumpArray = [];
        let memory = this.memory.getMemory();

        memoryDumpArray = memory.slice(startAddress,endAddress);

        this.log("Debug Mode: ON - Memory Dump Initialized");
        this.log("-------------------------------------------------------------");
        for (startAddress; startAddress<= endAddress; ++startAddress) {

            this.log("Addr: " + startAddress + "    | " + memoryDumpArray[startAddress])
        }
        this.log("-------------------------------------------------------------");
        this.log("Debug Mode: ON - Memory Dump Complete");
    }
 }