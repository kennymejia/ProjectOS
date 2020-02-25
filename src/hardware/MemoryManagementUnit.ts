import {Hardware} from "./Hardware";
import { Cpu } from "./Cpu";
import { Memory } from "./Memory";
import { start } from "repl";

export class MemoryManagementUnit extends Hardware {

    constructor(memory: Memory) {

        super(0, "MMU");
        this.log("Memory Management Unit Created");

        this.memory = memory;
        this.endianArray = [];

        // instructions used when flashing memory
        //let instructionSet = [0xA9, 0x0D, 0xA9, 0x1D, 0xA9, 0x2D, 0xA9, 0x3F, 0xA9, 0xFF, 0x00];
        let instructionSet = [0xA2, 0x02, 0xFF, 0x03, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00];

        for (let instruction = 0x0000; instruction < instructionSet.length; instruction++) {

            this.writeImmediate(instruction, instructionSet[instruction]);
        }

        this.memoryDump(0x0000,0x000F);
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

    // receiving data from the accumulator 
    public settingMDR (data:number): void {

        this.memory.setMDR(data);
    }

    // receiving a 16 bit address from the program counter
    public settingMar (address16Bit:number): void {

        this.memory.setMAR(address16Bit);
    }

    // receiving one byte and formatting it into a little endian address
    // FOR STORAGE ONLY!!!
    public littleEndian (address8Bit): void {

        if (this.endianArray.length == 0) {

            this.endianArray[1] = address8Bit;
        }
        else {

            this.endianArray[0] = address8Bit;

            let address16Bit = +this.endianArray.toString();

            this.cpuLog("The Endian Address: " + address16Bit);

            this.memory.setMAR(address16Bit);
    
            this.endianArray = [];
        }
    }

    // no register interaction
    // calling read function since registers already set

    // returning a number after a read
    public memoryRead (): number {

        this.memory.read();
        return this.memory.getMDR();
    }

    // no register interaction
    // calling write function since memory already set
    public memoryWrite (): void {

        this.memory.write();
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

        memoryDumpArray = memory.slice(startAddress,endAddress+1);

        this.log("Debug Mode: Memory Dump Initialized");
        
        this.log("-------------------------------------------------------------");
        for (startAddress; startAddress<= endAddress; startAddress++) {

            this.log (
                
                "Addr: " + startAddress.toString(16).toLocaleUpperCase().padStart(6,"0x0000") + 
                "    | " + memoryDumpArray[startAddress].toString(16).padStart(2,"0").toUpperCase()
            );
        }
        this.log("-------------------------------------------------------------");
        
        this.log("Debug Mode: Memory Dump Complete");
    }
    
 }