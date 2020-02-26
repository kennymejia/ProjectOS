import {Hardware} from "./Hardware";
import {ClockListener} from "./imp/ClockListener";
import {Cpu} from "./Cpu";
import {Memory} from "./Memory";
import {InterruptController} from "./InterruptController";
import { System } from "../System";
import { cpus } from "os";


export class Clock extends Hardware {

    public runningClockId: NodeJS.Timeout;

    constructor(cpu : Cpu, memory: Memory, interruptController: InterruptController) {

        super(0, "CLK");
        this.log("Clock Created");
        this.clockListeningHardware = [];
        this.cpu = cpu;
        this.addHardware(cpu);
        this.addHardware(memory);
        this.addHardware(interruptController);
    }

    public clockCount: number = 0;
    public isExecuting: boolean = false;
    private clockListeningHardware: ClockListener[];
    private cpu: Cpu;

    private addHardware(clockListener: ClockListener) {
        
        this.clockListeningHardware.push(clockListener);
    }

    public sendPulse(): void {
        this.log("Clock Pulse Sent To Hardware");
        
        // one elegant line of code calling the pulse method on each hardware piece
        this.clockListeningHardware.forEach(element => element.pulse());

        if (this.cpu.stop == true) {

            this.stopClock();
        }
    }

    public startClock(delay:number) : boolean {
        let started: boolean = false;
        if (this.runningClockId == null) {
            // .bind(this) is required when running an asynchronous process in node that wishes to reference an
            // instance of an object.
            this.runningClockId = setInterval(this.sendPulse.bind(this), delay)
            started = true;
        }
        else {
            //this.log("Clock startup failed, clock already running!");
            started = false;
        }
            return started;
    }

    public stopClock() : boolean {
        clearInterval(this.runningClockId);
        return true;
    }

}
