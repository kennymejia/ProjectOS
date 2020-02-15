import {Hardware} from "./Hardware";
import { Cpu } from "./Cpu";
import { Memory } from "./Memory";

export class MemoryManagementUnit extends Hardware {

    constructor(cpu: Cpu, memory: Memory) {

        super(0, "MMU");
        this.log("Memory Management Unit Created");

        this.cpu = cpu;
        this.memory = memory;
    }

    private cpu: Cpu;
    private memory: Memory;
    public isExecuting: boolean = false;

    public init (): void {

        this.isExecuting = false;
    }

    private setMar (): void {

        this.memory.write;
    }
}