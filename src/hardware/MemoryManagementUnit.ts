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

        // hardcoded instructions used to test instruction set
        //this.instructionSet = [0xA9, 0x0D, 0xA9, 0x1D, 0xA9, 0x2D, 0xA9, 0x3F, 0xA9, 0xFF, 0x00];
        //this.instructionSet = [0xA2, 0x02, 0xFF, 0x06, 0x00, 0x00, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00];
        //this.instructionSet = [0xAD, 0x0E, 0x00, 0x8D, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02];
        //this.instructionSet = [0xA9, 0x02, 0x6D, 0x0A, 0x00, 0x8D, 0x0B, 0x00, 0x00, 0x00, 0x03,0x00];
        //this.instructionSet = [0xA2, 0x08, 0xA0, 0x08, 0xAE, 0x12, 0x00, 0xAC, 0x13, 0x00, 
        //                       0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x07];
        //this.instructionSet = [0xA2, 0x06, 0xEC, 0x09, 0x00, 0xD0, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        //this.instructionSet = [0xEE, 0x06, 0x00, 0x00, 0x00, 0x00, 0x01];

        // A Simple Print Of Lucas Numbers And Print Out Text
        this.instructionSet = [

            // setting up lucas numbers 2 and 1
            0x00A9, 0x0002, 0x008D, 0x003C, 0x0000, 0x00A2, 0x0001, 0x00AC, 0x003C, 0x0000,
            0x00FF, 0x00A9, 0x0001, 0x008D, 0x003D, 0x0000, 0x00AC, 0x003D, 0x0000, 0x00FF,
            
            // Where we jump back to if we fail to set the Z flag to 0
            // we continue to print lucas numbers
            0x006D, 0x003C, 0x0000, 0x008D, 0x003C, 0x0000, 0x00AC, 0x003C, 0x0000, 0x00A2,
            0x0001, 0x00FF, 0x006D, 0x003D, 0x0000, 0x008D, 0x003D, 0x0000, 0x00AC, 0x003D,
            0x0000, 0x00FF, 
            
            // where we load x in order to compare our current lucas number to a mem location
            // if we fail to set z flag to 0 we jump back otherwise we continue
                            0x00AE, 0x003D, 0x0000, 0x00EC, 0x005A, 0x0000, 0x00D0, 0xFFE2, // -21 0xffeb

            // setting up to call our print 00 terminated string
            0x00A2, 0x0002, 0x00FF, 0x0046, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000,
            0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000,
            
            // the beginning of our text output
            0x0054, 0x0068, 0x0065, 0x0020, 0x004C, 0x0075, 0x0063, 0x0061, 0x0073, 0x0020,
            0x0053, 0x0065, 0x0071, 0x0075, 0x0065, 0x006E, 0x0063, 0x0065, 0x000A, 0x0000,

            // lucas number we are looking for so we dont branch out
            0x004C, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000
        ]

        for (let instruction = 0x0000; instruction < this.instructionSet.length; instruction++) {

            this.writeImmediate(instruction, this.instructionSet[instruction]);
        }

        this.memoryDump(0x0000,this.instructionSet.length-1);
    }

    // MMU knows about both the CPU and the Memory
    private cpu: Cpu;
    private memory: Memory;
    public instructionSet: number[];

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
    public littleEndian (address8Bit): number {

        if (this.endianArray.length == 0) {

            this.endianArray[1] = address8Bit;
        }
        else {

            this.endianArray[0] = address8Bit;

            let address16Bit = +this.endianArray.join("").toLocaleUpperCase().padStart(4,"0x00");

            this.memory.setMAR(address16Bit);

            this.endianArray = [];

            return address16Bit;
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

        this.mmuLog("Debug Mode: Memory Dump Initialized");
        
        this.mmuLog("-------------------------------------------------------------");
        for (startAddress; startAddress <= endAddress; startAddress++) {

            this.mmuLog (
                
                "Addr: " + startAddress.toString(16).toLocaleUpperCase().padStart(6,"0x0000") + 
                "    | " + memoryDumpArray[startAddress].toString(16).padStart(2,"0").toUpperCase()
            );
        }
        this.mmuLog("-------------------------------------------------------------");
        
        this.mmuLog("Debug Mode: Memory Dump Complete");
    }
    
 }